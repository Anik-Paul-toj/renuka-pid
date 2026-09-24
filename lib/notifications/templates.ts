import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface BookingEmailTemplateData {
  customerName: string;
  customerEmail: string;
  bookingReference: string;
  courseTitle: string;
  batchName: string;
  startDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  amountPaise: number;
  currency: string;
  paymentId?: string | null;
  zoomJoinUrl?: string | null;
  zoomPasscode?: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Formats amount into friendly currency string.
 */
function formatAmount(amountPaise: number, currency: string): string {
  if (amountPaise === 0) return "Complimentary / Free";
  const symbol = currency.toUpperCase() === "INR" ? "₹" : `${currency} `;
  return `${symbol}${(amountPaise / 100).toFixed(0)}`;
}

/**
 * Compiles and renders the booking confirmation email using database-backed template.
 */
export async function renderBookingConfirmationEmail(
  data: BookingEmailTemplateData
): Promise<RenderedEmail> {
  const adminClient = createAdminClient();

  // 1. Fetch active template from database
  const { data: dbTemplate } = await adminClient
    .from("message_templates")
    .select("slug, subject, body, is_active")
    .eq("slug", "booking-confirmation-email")
    .eq("is_active", true)
    .maybeSingle();

  const formattedAmount = formatAmount(data.amountPaise, data.currency);
  const timeString = `${data.startTime} – ${data.endTime} ${data.timezone}`;

  // Build zoom access text safely without inventing fake links
  const zoomAccessText = data.zoomJoinUrl
    ? `${data.zoomJoinUrl}${data.zoomPasscode ? ` (Passcode: ${data.zoomPasscode})` : ""}`
    : "Will be shared prior to the session.";

  // 2. Prepare Template Replacements
  const replacements: Record<string, string> = {
    "{{student_name}}": data.customerName,
    "{{course_name}}": data.courseTitle,
    "{{batch_name}}": data.batchName,
    "{{date}}": data.startDate,
    "{{time}}": timeString,
    "{{booking_reference}}": data.bookingReference,
    "{{amount_paid}}": formattedAmount,
    "{{payment_reference}}": data.paymentId || "N/A",
    "{{zoom_link}}": zoomAccessText,
  };

  let subject =
    dbTemplate?.subject || "Your seat is reserved for {{course_name}}! 🎨";
  for (const [key, val] of Object.entries(replacements)) {
    subject = subject.replace(new RegExp(key, "g"), val);
  }

  // 3. Plain Text Version
  let text = dbTemplate?.body || "";
  if (text) {
    for (const [key, val] of Object.entries(replacements)) {
      text = text.replace(new RegExp(key, "g"), val);
    }
  } else {
    text = `Hi ${data.customerName},

Your seat for ${data.courseTitle} (${data.batchName}) is confirmed!

Date: ${data.startDate}
Time: ${timeString}
Booking Reference: ${data.bookingReference}
Amount: ${formattedAmount}${data.paymentId ? `\nPayment ID: ${data.paymentId}` : ""}

Private Access: ${zoomAccessText}

Warmly,
Renuka Aggarwal
Art & Soul Studio`;
  }

  // 4. HTML Version with Art & Soul Studio visual styling
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F2; color: #292923; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid rgba(70, 65, 55, 0.15); border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(200, 209, 199, 0.35); color: #68705A; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
    h1 { font-size: 22px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #292923; }
    p { font-size: 14px; line-height: 1.6; color: #6F6B61; margin: 0 0 16px; }
    .details-box { background: #F7F4EC; border: 1px solid rgba(70, 65, 55, 0.1); border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; }
    .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed rgba(70, 65, 55, 0.1); }
    .details-row:last-child { border-bottom: none; }
    .label { color: #68705A; font-weight: 600; }
    .value { color: #292923; font-weight: 500; text-align: right; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid rgba(70, 65, 55, 0.1); font-size: 12px; color: #6F6B61; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Booking Confirmed</span>
    <h1>Your Seat Is Confirmed, ${data.customerName}!</h1>
    <p>Thank you for registering for <strong>${data.courseTitle}</strong>. We are thrilled to welcome you to this session.</p>
    
    <div class="details-box">
      <div class="details-row">
        <span class="label">Workshop:</span>
        <span class="value">${data.courseTitle}</span>
      </div>
      <div class="details-row">
        <span class="label">Cohort Batch:</span>
        <span class="value">${data.batchName}</span>
      </div>
      <div class="details-row">
        <span class="label">Date:</span>
        <span class="value">${data.startDate}</span>
      </div>
      <div class="details-row">
        <span class="label">Time:</span>
        <span class="value">${timeString}</span>
      </div>
      <div class="details-row">
        <span class="label">Booking Ref:</span>
        <span class="value mono"><strong>${data.bookingReference}</strong></span>
      </div>
      <div class="details-row">
        <span class="label">Amount Paid:</span>
        <span class="value">${formattedAmount}</span>
      </div>
      ${
        data.paymentId
          ? `<div class="details-row">
        <span class="label">Payment ID:</span>
        <span class="value mono">${data.paymentId}</span>
      </div>`
          : ""
      }
      <div class="details-row">
        <span class="label">Live Access:</span>
        <span class="value">${data.zoomJoinUrl ? `<a href="${data.zoomJoinUrl}" style="color: #68705A;">${zoomAccessText}</a>` : zoomAccessText}</span>
      </div>
    </div>

    <p>Please check your calendar so you don't miss the live stream. If you have any questions, simply reply to this email.</p>

    <div class="footer">
      <p style="margin: 0; font-weight: 600; color: #292923;">Warmly,</p>
      <p style="margin: 2px 0 0; color: #68705A;">Renuka Aggarwal &bull; Art & Soul Studio</p>
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    html,
    text,
  };
}
