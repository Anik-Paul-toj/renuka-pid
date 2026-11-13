import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderBookingConfirmationEmail } from "@/lib/notifications/templates";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { getSettings } from "@/lib/settings/service";
import { getCourseDiscountBenefit } from "@/lib/course-credit/service";
import { parseCourseDetails } from "@/lib/courses-admin/service";

export interface NotificationServiceResult {
  success: boolean;
  alreadySent?: boolean;
  providerMessageId?: string;
  error?: string;
  code?: string;
}

// In-memory set to prevent concurrent in-flight duplicate dispatches for the same booking
const inFlightConfirmations = new Set<string>();

/**
 * Sends a transactional booking confirmation email idempotently.
 * 
 * Guarantees:
 * - Only confirmed bookings receive confirmation emails.
 * - Idempotent: duplicate webhook, page reload, or repeated verification will not re-send.
 * - Notification failures never alter payment or booking confirmation status.
 * - Database logging in notification_logs on both success and failure.
 */
export async function sendBookingConfirmationEmail(
  bookingIdOrReference: string,
  options?: { forceRetry?: boolean }
): Promise<NotificationServiceResult> {
  const adminClient = createAdminClient();

  // 1. Resolve Booking Record with authoritatively linked data
  let query = adminClient
    .from("bookings")
    .select(
      `
      id,
      booking_reference,
      status,
      amount_paise,
      currency,
      customer_id,
      batch_id,
      customers (
        id,
        full_name,
        email,
        phone,
        whatsapp_phone
      ),
      cohort_batches (
        id,
        batch_name,
        start_date,
        end_date,
        start_time,
        end_time,
        timezone,
        zoom_join_url,
        zoom_passcode,
        courses (
          id,
          slug,
          title,
          description,
          duration_minutes
        )
      ),
      payments (
        id,
        razorpay_payment_id,
        status,
        amount_paise,
        created_at
      )
    `
    );

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      bookingIdOrReference
    );

  if (isUUID) {
    query = query.eq("id", bookingIdOrReference);
  } else {
    query = query.eq("booking_reference", bookingIdOrReference);
  }

  const { data: booking, error: bookingErr } = await query.maybeSingle();

  if (bookingErr || !booking) {
    return {
      success: false,
      error: "Booking record not found.",
      code: "BOOKING_NOT_FOUND",
    };
  }

  // 2. Strict Confirmation State Guard
  if (booking.status !== "confirmed") {
    return {
      success: false,
      error: `Booking status is '${booking.status}'. Confirmation emails can only be sent for confirmed bookings.`,
      code: "BOOKING_NOT_CONFIRMED",
    };
  }

  const customer = (booking as any).customers;
  const batch = (booking as any).cohort_batches;
  const course = batch?.courses;

  if (!customer?.email) {
    return {
      success: false,
      error: "Customer has no registered email address.",
      code: "MISSING_CUSTOMER_EMAIL",
    };
  }

  // 3. Concurrency Lock: Prevent simultaneous executions for the same booking
  if (inFlightConfirmations.has(booking.id)) {
    return {
      success: true,
      alreadySent: false,
      code: "IN_FLIGHT_DISPATCH",
    };
  }

  inFlightConfirmations.add(booking.id);

  try {
    // 4. Idempotency Check via notification_logs
    const { data: previousLogs } = await adminClient
      .from("notification_logs")
      .select("id, status, provider_message_id, retry_count, sent_at")
      .eq("booking_id", booking.id)
      .eq("channel", "email")
      .eq("message_type", "booking-confirmation-email")
      .order("created_at", { ascending: false });

    const existingSuccess = previousLogs?.find((l) =>
      ["sent", "delivered", "read"].includes(l.status)
    );

    if (existingSuccess && !options?.forceRetry) {
      return {
        success: true,
        alreadySent: true,
        providerMessageId: existingSuccess.provider_message_id || undefined,
      };
    }

    const previousFailedCount =
      previousLogs?.filter((l) => l.status === "failed").length || 0;

    // Resolve payment reference if available
    const capturedPayment = (booking as any).payments?.find(
      (p: any) => p.status === "captured"
    );
    const paymentId = capturedPayment?.razorpay_payment_id || null;

    // Resolve course duration and schedule details safely
    let durationText = "90 Minutes Each";
    if (course?.slug && course?.description) {
      const parsed = parseCourseDetails(course.slug, course.description);
      durationText =
        parsed.sessionDurationText ||
        parsed.cardSubtitle ||
        (course.duration_minutes ? `${course.duration_minutes} Mins` : "90 Minutes Each");
    } else if (course?.duration_minutes) {
      durationText = `${course.duration_minutes} Mins`;
    }

    const startDateText =
      batch?.start_date && batch.start_date.trim() ? batch.start_date : "To be announced";
    const startTimeText =
      batch?.start_time && batch.start_time.trim() ? batch.start_time : "To be announced";
    const endTimeText =
      batch?.end_time && batch.end_time.trim() ? batch.end_time : "";

    // 5. Evaluate Dynamic Course Upgrade Credit Benefit
    const discountBenefit = getCourseDiscountBenefit(
      {
        id: course?.id,
        slug: course?.slug,
        title: course?.title,
        offer_price_paise: course?.offer_price_paise,
      },
      {
        booking_reference: booking.booking_reference,
        amount_paise: booking.amount_paise,
        original_amount_paise: (booking as any).original_amount_paise,
      }
    );

    // 6. Render Template
    const rendered = await renderBookingConfirmationEmail({
      customerName: customer.full_name || "Valued Student",
      customerEmail: customer.email,
      customerPhone: customer.whatsapp_phone || customer.phone || null,
      bookingReference: booking.booking_reference,
      courseTitle: course?.title || "Masterclass",
      courseSlug: course?.slug || null,
      courseDescription: course?.description || null,
      batchName: batch?.batch_name || "Upcoming Batch",
      startDate: startDateText,
      endDate: batch?.end_date || null,
      startTime: startTimeText,
      endTime: endTimeText,
      timezone: batch?.timezone || "Asia/Kolkata",
      duration: durationText,
      amountPaise: booking.amount_paise,
      currency: booking.currency,
      paymentId,
      zoomJoinUrl: batch?.zoom_join_url || null,
      zoomPasscode: batch?.zoom_passcode || null,
      isEligibleForDiscount: discountBenefit.isEligible,
      discountReferenceId: discountBenefit.discountReferenceId,
      discountAmountPaise: discountBenefit.creditAmountPaise,
      discountTargetCourseTitle: discountBenefit.targetCourseTitle,
    });

    const appSettings = await getSettings();

    // 6. Dispatch Email via Provider
    const sendResult = await sendTransactionalEmail({
      to: customer.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: appSettings.replyToEmail || undefined,
    });

    const nowIso = new Date().toISOString();

    // 7. Record Attempt in notification_logs (audit isolation)
    if (sendResult.success) {
      await adminClient.from("notification_logs").insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        channel: "email",
        message_type: "booking-confirmation-email",
        provider_message_id: sendResult.providerMessageId || null,
        status: "sent",
        retry_count: previousFailedCount,
        sent_at: nowIso,
      });

      return {
        success: true,
        alreadySent: false,
        providerMessageId: sendResult.providerMessageId,
      };
    } else {
      await adminClient.from("notification_logs").insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        channel: "email",
        message_type: "booking-confirmation-email",
        provider_message_id: null,
        status: "failed",
        error_message: sendResult.error || "Email delivery failed",
        retry_count: previousFailedCount + 1,
        sent_at: nowIso,
      });

      return {
        success: false,
        error: sendResult.error,
        code: "DELIVERY_FAILED",
      };
    }
  } catch (err: any) {
    const errorMsg = err?.message || "Unexpected exception during notification processing.";
    try {
      await adminClient.from("notification_logs").insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        channel: "email",
        message_type: "booking-confirmation-email",
        status: "failed",
        error_message: errorMsg,
        sent_at: new Date().toISOString(),
      });
    } catch {
      // Ignore database logging failure to avoid unhandled crash
    }

    return {
      success: false,
      error: errorMsg,
      code: "INTERNAL_NOTIFICATION_ERROR",
    };
  } finally {
    inFlightConfirmations.delete(booking.id);
  }
}
