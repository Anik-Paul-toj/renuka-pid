"use client";

import React, { useMemo, useRef, useState } from "react";
import { AlertCircle, Send, Save, X } from "lucide-react";

export type TemplatePurposeKind = "confirmation" | "upcoming_batches";

interface CourseItem {
  id: string;
  title: string;
}

interface VarDef {
  placeholder: string;
  name: string;
  sourceField: string;
  sampleValue: string;
}

const VARIABLE_CHIPS: {
  label: string;
  sourceField: string;
  name: string;
  sample: string;
  only?: TemplatePurposeKind;
}[] = [
  { label: "Student name", sourceField: "student_name", name: "student_name", sample: "Aarav" },
  { label: "Course name", sourceField: "course_name", name: "course_name", sample: "Watercolour Foundation" },
  { label: "Batch name", sourceField: "batch_name", name: "batch_name", sample: "Live Batch - December" },
  { label: "Date", sourceField: "batch_date", name: "batch_date", sample: "28 November 2026" },
  { label: "Time", sourceField: "batch_time", name: "batch_time", sample: "6:30 PM - 8:30 PM IST" },
  { label: "Zoom link", sourceField: "zoom_link", name: "zoom_link", sample: "https://zoom.us/j/123456789" },
  { label: "Booking reference", sourceField: "booking_reference", name: "booking_reference", sample: "REF-AB12CD", only: "confirmation" },
];

const STARTERS: Record<
  TemplatePurposeKind,
  { title: string; body: string; footer: string; vars: VarDef[]; category: "UTILITY" | "MARKETING" }
> = {
  confirmation: {
    title: "Booking Confirmation",
    body:
      "Hi {{1}}, your booking for {{2}} is confirmed!\n\nBatch: {{3}}\nDate: {{4}}\nTime: {{5}}\nBooking reference: {{6}}\n\nWe will share the Zoom link before the session. See you there!",
    footer: "Renuka Art Studio",
    category: "UTILITY",
    vars: [
      { placeholder: "{{1}}", name: "student_name", sourceField: "student_name", sampleValue: "Aarav" },
      { placeholder: "{{2}}", name: "course_name", sourceField: "course_name", sampleValue: "Watercolour Foundation" },
      { placeholder: "{{3}}", name: "batch_name", sourceField: "batch_name", sampleValue: "Live Batch - December" },
      { placeholder: "{{4}}", name: "batch_date", sourceField: "batch_date", sampleValue: "28 November 2026" },
      { placeholder: "{{5}}", name: "batch_time", sourceField: "batch_time", sampleValue: "6:30 PM - 8:30 PM IST" },
      { placeholder: "{{6}}", name: "booking_reference", sourceField: "booking_reference", sampleValue: "REF-AB12CD" },
    ],
  },
  upcoming_batches: {
    title: "Course Live Now",
    body:
      "Hi {{1}}, great news! {{2}} is now live and open for registration.\n\nDate: {{3}}\nTime: {{4}}\nJoin on Zoom: {{5}}\n\nSeats are limited, reserve your spot today.",
    footer: "Renuka Art Studio",
    category: "MARKETING",
    vars: [
      { placeholder: "{{1}}", name: "student_name", sourceField: "student_name", sampleValue: "Aarav" },
      { placeholder: "{{2}}", name: "course_name", sourceField: "course_name", sampleValue: "Watercolour Foundation" },
      { placeholder: "{{3}}", name: "batch_date", sourceField: "batch_date", sampleValue: "28 November 2026" },
      { placeholder: "{{4}}", name: "batch_time", sourceField: "batch_time", sampleValue: "6:30 PM - 8:30 PM IST" },
      { placeholder: "{{5}}", name: "zoom_link", sourceField: "zoom_link", sampleValue: "https://zoom.us/j/123456789" },
    ],
  },
};

function toMetaName(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export function CreateTemplateModal({
  purpose,
  courses,
  onClose,
  onDone,
}: {
  purpose: TemplatePurposeKind;
  courses: CourseItem[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const starter = STARTERS[purpose];
  const [title, setTitle] = useState(starter.title);
  const [metaName, setMetaName] = useState(toMetaName(starter.title));
  const [metaNameTouched, setMetaNameTouched] = useState(false);
  const [category, setCategory] = useState<"UTILITY" | "MARKETING">(starter.category);
  const [language, setLanguage] = useState("en_US");
  const [header, setHeader] = useState("");
  const [body, setBody] = useState(starter.body);
  const [footer, setFooter] = useState(starter.footer);
  const [vars, setVars] = useState<VarDef[]>(starter.vars);
  const [zoomLink, setZoomLink] = useState("");
  const [makeDefault, setMakeDefault] = useState(purpose === "confirmation");
  const [assignedCourseId, setAssignedCourseId] = useState("");
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const placeholdersInBody = useMemo(
    () => Array.from(new Set(body.match(/\{\{\d+\}\}/g) || [])),
    [body]
  );

  const insertVariable = (chip: (typeof VARIABLE_CHIPS)[number]) => {
    const used = placeholdersInBody.map((p) => Number(p.replace(/\D/g, "")));
    const next = (used.length ? Math.max(...used) : 0) + 1;
    const placeholder = `{{${next}}}`;
    const el = bodyRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + placeholder + body.slice(end));
    setVars((prev) => [
      ...prev.filter((v) => v.placeholder !== placeholder),
      {
        placeholder,
        name: chip.name,
        sourceField: chip.sourceField,
        sampleValue: chip.sourceField === "zoom_link" && zoomLink.trim() ? zoomLink.trim() : chip.sample,
      },
    ]);
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const activeVars = useMemo(
    () => vars
      .map((v) => (v.sourceField === "zoom_link" && zoomLink.trim() ? { ...v, sampleValue: zoomLink.trim() } : v))
      .filter((v) => placeholdersInBody.includes(v.placeholder)).sort((a, b) => a.placeholder.localeCompare(b.placeholder, undefined, { numeric: true })),
    [vars, placeholdersInBody, zoomLink]
  );

  const preview = useMemo(() => {
    let text = body;
    for (const v of activeVars) text = text.split(v.placeholder).join(v.sampleValue);
    return text;
  }, [body, activeVars]);

  const validate = (): string | null => {
    if (title.trim().length < 2) return "Give the template a name.";
    if (!/^[a-z0-9_]+$/.test(metaName)) return "Meta name can only use lowercase letters, numbers and underscores.";
    if (!body.trim()) return "Message text is required.";
    if (body.length > 1024) return "Message text must be 1024 characters or fewer.";
    const nums = placeholdersInBody.map((p) => Number(p.replace(/\D/g, ""))).sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] !== i + 1) return "Variables must be numbered {{1}}, {{2}}, {{3}} in order with no gaps.";
    }
    if (/^\s*\{\{\d+\}\}/.test(body) || /\{\{\d+\}\}\s*$/.test(body)) {
      return "Meta does not allow a variable at the very start or end of the message. Add some text around it.";
    }
    if (header.length > 60) return "Header must be 60 characters or fewer.";
    if (footer.length > 60) return "Footer must be 60 characters or fewer.";
    for (const p of placeholdersInBody) {
      if (!activeVars.some((v) => v.placeholder === p)) return `Variable ${p} has no sample value. Insert it with the buttons above.`;
    }
    return null;
  };

  const save = async (andSubmit: boolean) => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(andSubmit ? "submit" : "draft");
    setError(null);
    try {
      const components: any[] = [];
      if (header.trim()) components.push({ type: "HEADER", format: "TEXT", text: header.trim() });
      components.push({ type: "BODY", text: body.trim() });
      if (footer.trim()) components.push({ type: "FOOTER", text: footer.trim() });

      const createRes = await fetch("/api/admin/message-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalTitle: title.trim(),
          metaTemplateName: metaName,
          category,
          templatePurpose: purpose,
          language,
          components,
          variableDefinitions: activeVars,
          isDefaultConfirmation: purpose === "confirmation" && makeDefault,
          assignedCourseId: purpose === "confirmation" && assignedCourseId ? assignedCourseId : null,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok || !created.success) throw new Error(created?.error || "Failed to create template.");

      if (!andSubmit) {
        onDone("Template saved as a draft. Submit it to Meta from Message Templates when you are ready.");
        return;
      }

      const submitRes = await fetch(`/api/admin/message-templates/${created.data.id}/submit`, { method: "POST" });
      const submitted = await submitRes.json();
      if (!submitRes.ok || !submitted.success) {
        onDone(`Template saved as a draft, but Meta submission failed: ${submitted?.error || "unknown error"}. You can retry from Message Templates.`);
        return;
      }
      onDone("Template submitted to Meta. It will appear as Approved after Meta reviews it. Press Sync with Meta to refresh the status.");
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  const label = "block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5";
  const input =
    "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-[#68705A] focus:ring-2 focus:ring-[#68705A]/20";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <div className="w-full max-w-4xl rounded-2xl bg-[#FAF8F2] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              New {purpose === "confirmation" ? "booking confirmation" : "course live now"} template
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              WhatsApp only allows messages that Meta has approved. Save a draft, or submit it straight away.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-stone-500 hover:bg-stone-200 cursor-pointer">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-5 sm:p-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Template name</label>
                <input
                  className={input}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!metaNameTouched) setMetaName(toMetaName(e.target.value));
                  }}
                />
              </div>
              <div>
                <label className={label}>Meta name</label>
                <input
                  className={`${input} font-mono`}
                  value={metaName}
                  onChange={(e) => {
                    setMetaNameTouched(true);
                    setMetaName(e.target.value.toLowerCase());
                  }}
                />
              </div>
              <div>
                <label className={label}>Category</label>
                <select className={input} value={category} onChange={(e) => setCategory(e.target.value as any)}>
                  <option value="UTILITY">Utility (transactional)</option>
                  <option value="MARKETING">Marketing (announcements)</option>
                </select>
              </div>
              <div>
                <label className={label}>Language</label>
                <select className={input} value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en_US">English (US)</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>

            <div>
              <label className={label}>Header (optional)</label>
              <input className={input} maxLength={60} value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Short title shown in bold" />
            </div>

            <div>
              <label className={label}>Message</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="mr-1 self-center text-[0.7rem] text-stone-500">Insert:</span>
                {VARIABLE_CHIPS.filter((c) => !c.only || c.only === purpose).map((c) => (
                  <button
                    key={c.sourceField}
                    type="button"
                    onClick={() => insertVariable(c)}
                    className="rounded-full border border-[#68705A]/40 bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-[#444C38] hover:bg-[#68705A] hover:text-white transition-colors cursor-pointer"
                  >
                    + {c.label}
                  </button>
                ))}
              </div>
              <textarea
                ref={bodyRef}
                className={`${input} min-h-[190px] leading-relaxed`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <p className="mt-1 text-[0.7rem] text-stone-500">
                {body.length}/1024 characters. Variables look like {"{{1}}"}; each one is replaced per student when sent.
              </p>
            </div>

            <div>
              <label className={label}>Zoom link (for the Zoom link variable)</label>
              <input
                className={input}
                type="url"
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
              <p className="mt-1 text-[0.7rem] text-stone-500">
                {activeVars.some((v) => v.sourceField === "zoom_link")
                  ? "This link is used as the example for the Zoom link variable when Meta reviews the template. When sending, each message uses the batch's Zoom link, or the one you enter on the Course Live Now tab."
                  : "Use \"+ Zoom link\" above to add a Zoom link variable to the message. Its value is filled in when you send."}
              </p>
            </div>

            <div>
              <label className={label}>Footer (optional)</label>
              <input className={input} maxLength={60} value={footer} onChange={(e) => setFooter(e.target.value)} />
            </div>

            {purpose === "confirmation" && (
              <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-3.5">
                <label className="flex items-center gap-2 text-sm text-stone-800">
                  <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
                  Use as the default confirmation template (once approved by Meta)
                </label>
                <label className="flex items-center gap-2 text-xs text-stone-600">
                  Only for course:
                  <select
                    className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs"
                    value={assignedCourseId}
                    onChange={(e) => setAssignedCourseId(e.target.value)}
                  >
                    <option value="">All courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title.length > 40 ? c.title.slice(0, 40) + "..." : c.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-3 lg:sticky lg:top-4 self-start">
            <span className="text-xs font-bold uppercase tracking-wider text-[#68705A]">Preview (sample values)</span>
            <div className="rounded-xl bg-[#E7F7DC] p-3.5 text-xs text-[#111B21] shadow-sm space-y-1.5 whitespace-pre-line border border-black/5">
              {header.trim() && <p className="font-bold">{header}</p>}
              <p>{preview || "Your message appears here."}</p>
              {footer.trim() && <p className="text-[0.68rem] text-stone-500">{footer}</p>}
            </div>
            {activeVars.length > 0 && (
              <ul className="space-y-1 text-[0.7rem] text-stone-600">
                {activeVars.map((v) => (
                  <li key={v.placeholder} className="flex justify-between gap-2 rounded-md bg-white px-2 py-1 border border-stone-200">
                    <span className="font-mono">{v.placeholder}</span>
                    <span className="truncate">{v.name.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-5 sm:mx-6 mb-3 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={!!busy}
            className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-lg border border-[#68705A] px-4 py-2.5 text-sm font-bold text-[#444C38] hover:bg-[#68705A]/10 disabled:opacity-50 cursor-pointer"
          >
            <Save className="size-4" />
            {busy === "draft" ? "Saving..." : "Save as draft"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-lg bg-[#68705A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#575E4B] disabled:opacity-50 cursor-pointer"
          >
            <Send className="size-4" />
            {busy === "submit" ? "Submitting..." : "Submit to Meta"}
          </button>
        </div>
      </div>
    </div>
  );
}
