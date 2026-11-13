import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface BookingEmailTemplateData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  bookingReference: string;
  courseTitle: string;
  courseSlug?: string | null;
  courseDescription?: string | null;
  batchName: string;
  startDate: string;
  endDate?: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  duration?: string | null;
  amountPaise: number;
  currency: string;
  paymentId?: string | null;
  zoomJoinUrl?: string | null;
  zoomPasscode?: string | null;
  isEligibleForDiscount?: boolean;
  discountReferenceId?: string | null;
  discountAmountPaise?: number;
  discountTargetCourseTitle?: string;
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

  // Safe time string (graceful fallback if timing is unannounced)
  const hasValidStartTime = Boolean(data.startTime && data.startTime.trim() && data.startTime !== "To be announced");
  const timeString = hasValidStartTime
    ? `${data.startTime}${data.endTime && data.endTime.trim() ? ` – ${data.endTime}` : ""} ${data.timezone || "IST"}`
    : "To be announced";

  const safeStartDate = data.startDate && data.startDate.trim() ? data.startDate : "To be announced";
  const safeDuration = data.duration && data.duration.trim() ? data.duration : "90 Minutes Each";

  // Build zoom access text safely without inventing fake links
  const zoomAccessText = data.zoomJoinUrl
    ? `${data.zoomJoinUrl}${data.zoomPasscode ? ` (Passcode: ${data.zoomPasscode})` : ""}`
    : "Will be shared prior to the session.";

  const discountRef = data.discountReferenceId || data.bookingReference;
  const targetCourseTitle = data.discountTargetCourseTitle || "Watercolour Artistry + Foundation";
  const discountAmountFormatted =
    typeof data.discountAmountPaise === "number" && data.discountAmountPaise > 0
      ? formatAmount(data.discountAmountPaise, data.currency)
      : formattedAmount;

  // 2. Prepare Template Replacements
  const replacements: Record<string, string> = {
    "{{student_name}}": data.customerName,
    "{{course_name}}": data.courseTitle,
    "{{batch_name}}": data.batchName,
    "{{date}}": safeStartDate,
    "{{start_date}}": safeStartDate,
    "{{time}}": timeString,
    "{{start_time}}": data.startTime || "To be announced",
    "{{duration}}": safeDuration,
    "{{booking_reference}}": data.bookingReference,
    "{{amount_paid}}": formattedAmount,
    "{{payment_reference}}": data.paymentId || "N/A",
    "{{zoom_link}}": zoomAccessText,
    "{{discount_reference_id}}": discountRef,
    "{{discount_amount}}": discountAmountFormatted,
  };

  let subject =
    dbTemplate?.subject || "Your Booking is Confirmed – {{course_name}} | Renuka Art Studio";
  for (const [key, val] of Object.entries(replacements)) {
    subject = subject.replace(new RegExp(key, "g"), val);
  }

  // 3. Plain Text Version
  let text = dbTemplate?.body || "";
  if (text) {
    for (const [key, val] of Object.entries(replacements)) {
      text = text.replace(new RegExp(key, "g"), val);
    }
    // If eligible for discount but the DB template didn't include the upgrade section, append it
    if (data.isEligibleForDiscount && !text.includes(discountRef)) {
      text += `\n\n--- YOUR SPECIAL UPGRADE BENEFIT ---
You are eligible for a ${discountAmountFormatted} discount on the ${targetCourseTitle} course!

Your unique discount reference ID:
${discountRef}

Keep this reference ID safe. It can be redeemed once when purchasing the eligible course.

How to Redeem:
1. Visit the Watercolour Artistry + Foundation course page: https://renuka-art-studio.vercel.app/course/watercolour-artistry-foundation
2. Click "Reserve Your Seat".
3. Enter your registered email (${data.customerEmail}) and phone number (${data.customerPhone || "registered WhatsApp number"}).
4. Enter your unique discount reference ID: ${discountRef}.
5. Your ${discountAmountFormatted} discount will be automatically applied to your checkout fee!

* Note: This reference ID is strictly single-use, non-transferable, and linked exclusively to your registered student account.`;
    }
  } else {
    text = `Hi ${data.customerName},

Your payment has been successfully received, and your booking for ${data.courseTitle} (${data.batchName}) is confirmed!

Your Course Details:
- Course: ${data.courseTitle}
- Booking Reference: ${data.bookingReference}
- Batch: ${data.batchName}
- Start Date: ${safeStartDate}
- Timing: ${timeString}
- Duration: ${safeDuration}
- Amount Paid: ${formattedAmount}${data.paymentId ? `\n- Payment ID: ${data.paymentId}` : ""}
- Live Access / Joining Instructions: ${zoomAccessText}
${
  data.isEligibleForDiscount
    ? `
--- YOUR SPECIAL UPGRADE BENEFIT ---
You are eligible for a ${discountAmountFormatted} discount on the ${targetCourseTitle} course!

Your unique discount reference ID:
${discountRef}

Keep this reference ID safe. It can be redeemed once when purchasing the eligible course.

How to Redeem:
1. Visit the Watercolour Artistry + Foundation course page: https://renuka-art-studio.vercel.app/course/watercolour-artistry-foundation
2. Click "Reserve Your Seat".
3. Enter your registered email (${data.customerEmail}) and phone number (${data.customerPhone || "registered WhatsApp number"}).
4. Enter your unique discount reference ID: ${discountRef}.
5. Your ${discountAmountFormatted} discount will be automatically applied to your checkout fee!

* Note: This reference ID is strictly single-use, non-transferable, and linked exclusively to your registered student account.
`
    : ""
}
For any questions or assistance, reply to this email, contact us at renuka.art.studio25@gmail.com, or call/WhatsApp +91 9599109200.

Warmly,
Renuka Aggarwal
Renuka Art Studio`;
  }

  // 4. HTML Version with Renuka Art Studio visual styling
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F2; color: #292923; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #FFFFFF; border: 1px solid rgba(70, 65, 55, 0.15); border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(200, 209, 199, 0.35); color: #68705A; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
    h1 { font-size: 22px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #292923; }
    p { font-size: 14px; line-height: 1.6; color: #6F6B61; margin: 0 0 16px; }
    .details-box { background: #F7F4EC; border: 1px solid rgba(70, 65, 55, 0.1); border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; }
    .details-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed rgba(70, 65, 55, 0.1); }
    .details-row:last-child { border-bottom: none; }
    .label { color: #68705A; font-weight: 600; }
    .value { color: #292923; font-weight: 500; text-align: right; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .upgrade-box { background: #F4F6F0; border: 1.5px solid #A2AD91; border-radius: 10px; padding: 20px; margin: 24px 0; }
    .upgrade-title { font-size: 15px; font-weight: 700; color: #354228; margin: 0 0 8px; display: flex; align-items: center; gap: 8px; }
    .ref-code-box { background: #FFFFFF; border: 1px dashed #68705A; border-radius: 6px; padding: 12px; text-align: center; margin: 12px 0; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid rgba(70, 65, 55, 0.1); font-size: 12px; color: #6F6B61; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Booking Confirmed</span>
    <h1>Your Seat Is Confirmed, ${data.customerName}!</h1>
    <p>Namaste! Your payment has been successfully received, and your registration for <strong>${data.courseTitle}</strong> is confirmed. We are thrilled to welcome you.</p>
    
    <div class="details-box">
      <div class="details-row">
        <span class="label">Course:</span>
        <span class="value">${data.courseTitle}</span>
      </div>
      <div class="details-row">
        <span class="label">Cohort Batch:</span>
        <span class="value">${data.batchName}</span>
      </div>
      <div class="details-row">
        <span class="label">Start Date:</span>
        <span class="value">${safeStartDate}</span>
      </div>
      <div class="details-row">
        <span class="label">Timing:</span>
        <span class="value">${timeString}</span>
      </div>
      <div class="details-row">
        <span class="label">Duration:</span>
        <span class="value">${safeDuration}</span>
      </div>
      <div class="details-row">
        <span class="label">Booking Reference:</span>
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
        <span class="label">Live Access / Instructions:</span>
        <span class="value">${data.zoomJoinUrl ? `<a href="${data.zoomJoinUrl}" style="color: #68705A;">${zoomAccessText}</a>` : zoomAccessText}</span>
      </div>
    </div>

    ${
      data.isEligibleForDiscount
        ? `
    <div class="upgrade-box">
      <div class="upgrade-title">
        <span>🌸 Your Special Upgrade Benefit</span>
      </div>
      <p style="font-size: 13px; color: #292923; line-height: 1.5; margin: 0 0 10px;">
        As a valued Watercolour Foundation student, you are eligible for a <strong>${discountAmountFormatted} discount</strong> on the <strong>${targetCourseTitle}</strong>!
      </p>

      <div class="ref-code-box">
        <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #68705A; margin-bottom: 4px; font-weight: 600;">Your Unique Discount Reference ID</span>
        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; font-size: 17px; font-weight: 700; color: #1E2818; letter-spacing: 0.05em;">${discountRef}</span>
      </div>

      <div style="font-size: 12px; line-height: 1.6; color: #464137;">
        <strong>How to Redeem:</strong>
        <ol style="margin: 6px 0 0; padding-left: 18px;">
          <li>Visit the <a href="https://renuka-art-studio.vercel.app/course/watercolour-artistry-foundation" style="color: #444C38; font-weight: 600; text-decoration: underline;">Watercolour Artistry + Foundation</a> course page.</li>
          <li>Click <strong>Reserve Your Seat</strong>.</li>
          <li>Enter your registered email (<code>${data.customerEmail}</code>) and phone number.</li>
          <li>Enter your unique discount reference ID: <code>${discountRef}</code>.</li>
          <li>Your ${discountAmountFormatted} credit will be automatically applied to your checkout fee!</li>
        </ol>
        <p style="margin: 8px 0 0; font-size: 11px; color: #6F6B61; font-style: italic;">
          * Note: Keep this reference ID safe. It can be redeemed once when purchasing the eligible course and is securely linked to your student account.
        </p>
      </div>
    </div>`
        : ""
    }

    <p>Please add this session to your calendar. If you have any questions, reply to this email, write to <a href="mailto:renuka.art.studio25@gmail.com" style="color: #68705A;">renuka.art.studio25@gmail.com</a>, or call/WhatsApp <a href="tel:+919599109200" style="color: #68705A;">+91 9599109200</a>.</p>

    <div class="footer">
      <p style="margin: 0; font-weight: 600; color: #292923;">Warmly,</p>
      <p style="margin: 2px 0 0; color: #68705A;">Renuka Aggarwal &bull; Renuka Art Studio</p>
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
