import type { StudentListItem } from "@/lib/students/service";

export type StudentPdfGroupBy = "course" | "batch" | "date";

interface Row {
  name: string;
  phone: string;
}

const IST = "Asia/Kolkata";

function istDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date(iso)); // YYYY-MM-DD
}

function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const GROUP_LABEL: Record<StudentPdfGroupBy, string> = {
  course: "Course-wise",
  batch: "Batch-wise",
  date: "Date-wise",
};

/**
 * Builds and downloads a PDF listing student names and phone numbers,
 * grouped by course, batch, or booking date. Cancelled/refunded bookings are skipped.
 */
export async function downloadStudentsPdf(opts: {
  students: StudentListItem[];
  groupBy: StudentPdfGroupBy;
  courseId?: string;
  filterSummary?: string;
}): Promise<{ groups: number; rows: number }> {
  const { students, groupBy, courseId, filterSummary } = opts;

  // key -> { sortKey, title, rows }
  const groups = new Map<string, { sortKey: string; title: string; rows: Row[] }>();

  for (const s of students) {
    const phone = s.whatsappPhone || s.phone || "-";
    for (const e of s.enrolledCourses || []) {
      if (e.bookingStatus === "cancelled" || e.bookingStatus === "refunded") continue;
      if (courseId && courseId !== "all" && e.courseId !== courseId) continue;

      let key: string;
      let title: string;
      let sortKey: string;
      if (groupBy === "course") {
        key = e.courseId || e.courseTitle;
        title = e.courseTitle;
        sortKey = e.courseTitle;
      } else if (groupBy === "batch") {
        key = `${e.courseId}::${e.batchName}`;
        title = `${e.courseTitle} - ${e.batchName}`;
        sortKey = title;
      } else {
        const d = istDate(e.createdAt);
        key = d;
        title = `Booked on ${prettyDate(d)}`;
        sortKey = d;
      }

      const g = groups.get(key) || { sortKey, title, rows: [] };
      // avoid listing the same student twice within a group
      if (!g.rows.some((r) => r.name === s.fullName && r.phone === phone)) {
        g.rows.push({ name: s.fullName, phone });
      }
      groups.set(key, g);
    }
  }

  const ordered = [...groups.values()].sort((a, b) =>
    groupBy === "date" ? b.sortKey.localeCompare(a.sortKey) : a.sortKey.localeCompare(b.sortKey)
  );
  const totalRows = ordered.reduce((n, g) => n + g.rows.length, 0);
  if (totalRows === 0) {
    throw new Error("No students match the current filters.");
  }

  const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = (autoTableMod as any).default || (autoTableMod as any).autoTable;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Student List - ${GROUP_LABEL[groupBy]}`, margin, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  const generated = new Date().toLocaleString("en-IN", { timeZone: IST, dateStyle: "medium", timeStyle: "short" });
  doc.text(`Renuka Art Studio  |  Generated ${generated} IST  |  ${totalRows} entries`, margin, 62);
  if (filterSummary) doc.text(`Filters: ${filterSummary}`, margin, 75, { maxWidth: pageW - margin * 2 });
  doc.setTextColor(0);

  let y = filterSummary ? 92 : 82;

  for (const g of ordered) {
    g.rows.sort((a, b) => a.name.localeCompare(b.name));

    const pageH = doc.internal.pageSize.getHeight();
    if (y > pageH - 110) {
      doc.addPage();
      y = 50;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setFillColor(232, 236, 228);
    doc.rect(margin, y - 12, pageW - margin * 2, 20, "F");
    doc.text(`${g.title}  (${g.rows.length})`, margin + 8, y + 2);

    autoTable(doc, {
      startY: y + 10,
      margin: { left: margin, right: margin },
      head: [["#", "Name", "Phone"]],
      body: g.rows.map((r, i) => [String(i + 1), r.name, r.phone]),
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [104, 112, 90], textColor: 255 },
      columnStyles: { 0: { cellWidth: 32 } },
      theme: "striped",
    });

    y = ((doc as any).lastAutoTable?.finalY ?? y + 40) + 26;
  }

  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date());
  doc.save(`students-${groupBy}-wise-${stamp}.pdf`);

  return { groups: ordered.length, rows: totalRows };
}
