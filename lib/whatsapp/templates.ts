import { WhatsAppTemplateComponent } from "./types";

export interface TemplateResolutionContext {
  studentName?: string | null;
  courseName?: string | null;
  batchName?: string | null;
  date?: string | null;
  time?: string | null;
  bookingReference?: string | null;
  amountPaid?: string | null;
  paymentReference?: string | null;
  zoomLink?: string | null;
  [key: string]: string | null | undefined;
}

/**
 * Resolves template placeholders in text, supporting both mustache {{var}} and bracket [Var] formats.
 */
export function resolveTemplateVariables(
  templateText: string,
  context: TemplateResolutionContext
): string {
  if (!templateText) return "";

  const studentName = context.studentName || "Student";
  const courseName = context.courseName || "Masterclass";
  const batchName = context.batchName || "Upcoming Batch";
  const date = context.date || "Upcoming Date";
  const time = context.time || "TBA";
  const bookingReference = context.bookingReference || "N/A";
  const amountPaid = context.amountPaid || "N/A";
  const paymentReference = context.paymentReference || "N/A";
  const zoomLink = context.zoomLink || "Link will be shared before session";

  return templateText
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    // Student Name
    .replace(/\[Student Name\]|\{\{student_name\}\}|\{\{studentName\}\}|\{\{customerName\}\}/gi, studentName)
    // Course Name
    .replace(/\[Course Name\]|\{\{course_name\}\}|\{\{courseName\}\}|\{\{courseTitle\}\}/gi, courseName)
    // Batch Name
    .replace(/\[Batch Name\]|\{\{batch_name\}\}|\{\{batchName\}\}/gi, batchName)
    // Date
    .replace(/\[Date\]|\{\{date\}\}|\{\{startDate\}\}/gi, date)
    // Time
    .replace(/\[Time\]|\{\{time\}\}|\{\{startTime\}\}/gi, time)
    // Booking Reference
    .replace(/\[Booking Reference\]|\{\{booking_reference\}\}|\{\{bookingReference\}\}/gi, bookingReference)
    // Amount Paid
    .replace(/\[Amount Paid\]|\{\{amount_paid\}\}|\{\{amount\}\}/gi, amountPaid)
    // Payment Reference
    .replace(/\[Payment Reference\]|\{\{payment_reference\}\}|\{\{paymentId\}\}/gi, paymentReference)
    // Zoom / Join Link
    .replace(/\[Join Link\]|\[Zoom Link\]|\{\{zoom_link\}\}|\{\{zoomJoinUrl\}\}/gi, zoomLink);
}

/**
 * Converts ordered parameter values into Meta Cloud API body component parameters.
 */
export function buildMetaTemplateComponents(
  parameters: string[]
): WhatsAppTemplateComponent[] {
  if (!parameters || parameters.length === 0) {
    return [];
  }

  return [
    {
      type: "body",
      parameters: parameters.map((param) => ({
        type: "text",
        text: param,
      })),
    },
  ];
}
