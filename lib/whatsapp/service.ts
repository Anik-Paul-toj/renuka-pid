import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWhatsAppTransport } from "./client";
import { WhatsAppTransport, WhatsAppSendResult, WhatsAppConfigStatus } from "./types";
import { isValidWhatsAppNumber } from "./meta-adapter";
import { resolveTemplateVariables } from "./templates";

export interface WhatsAppServiceResult {
  success: boolean;
  alreadySent?: boolean;
  providerMessageId?: string;
  error?: string;
  code?: string;
}

// In-memory concurrency lock to prevent duplicate concurrent in-flight dispatches
const inFlightWhatsAppConfirmations = new Set<string>();

/**
 * Returns current configuration status of WhatsApp without exposing any credentials.
 */
export function getWhatsAppConfigStatus(): WhatsAppConfigStatus {
  const transport = getWhatsAppTransport();
  return transport.getConfigStatus();
}

/**
 * Sends a transactional booking confirmation WhatsApp message idempotently.
 * 
 * Guarantees:
 * - Only confirmed bookings receive confirmation messages.
 * - Recipient phone derived entirely server-side from customer record (whatsapp_phone || phone).
 * - Idempotent: duplicate webhook, page reload, or repeated verification will not re-send.
 * - Concurrency protected: simultaneous requests for the same booking are serialized/deduped.
 * - Failure isolation: Notification failures never alter payment or booking confirmation status.
 * - Logs strictly in existing public.notification_logs with channel = 'whatsapp'.
 */
export async function sendBookingConfirmationWhatsApp(
  bookingIdOrReference: string,
  options?: { forceRetry?: boolean; transport?: WhatsAppTransport }
): Promise<WhatsAppServiceResult> {
  const adminClient = createAdminClient();
  const transport = options?.transport || getWhatsAppTransport();

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
        start_time,
        end_time,
        timezone,
        zoom_join_url,
        zoom_passcode,
        courses (
          id,
          title
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
      error: `Booking status is '${booking.status}'. WhatsApp confirmations can only be sent for confirmed bookings.`,
      code: "BOOKING_NOT_CONFIRMED",
    };
  }

  const customer = (booking as any).customers;
  const batch = (booking as any).cohort_batches;
  const course = batch?.courses;

  // Resolve customer WhatsApp phone strictly server-side
  const recipientPhone = customer?.whatsapp_phone || customer?.phone;

  if (!recipientPhone || !recipientPhone.trim()) {
    // Record failed attempt in notification_logs for audit
    await adminClient.from("notification_logs").insert({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      channel: "whatsapp",
      message_type: "booking-confirmation-whatsapp",
      status: "failed",
      error_message: "Customer has no registered WhatsApp phone number.",
      sent_at: new Date().toISOString(),
    });

    return {
      success: false,
      error: "Customer has no registered WhatsApp phone number.",
      code: "MISSING_CUSTOMER_PHONE",
    };
  }

  if (!isValidWhatsAppNumber(recipientPhone)) {
    await adminClient.from("notification_logs").insert({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      channel: "whatsapp",
      message_type: "booking-confirmation-whatsapp",
      status: "failed",
      error_message: "Customer phone number format is invalid for WhatsApp.",
      sent_at: new Date().toISOString(),
    });

    return {
      success: false,
      error: "Invalid recipient phone number format. Please provide a valid phone number with country code.",
      code: "INVALID_PHONE_NUMBER",
    };
  }

  // 3. Concurrency Lock: Prevent simultaneous executions for the same booking
  if (inFlightWhatsAppConfirmations.has(booking.id)) {
    return {
      success: true,
      alreadySent: false,
      code: "IN_FLIGHT_DISPATCH",
    };
  }

  inFlightWhatsAppConfirmations.add(booking.id);

  try {
    // 4. Idempotency Check via notification_logs
    const { data: previousLogs } = await adminClient
      .from("notification_logs")
      .select("id, status, provider_message_id, retry_count, sent_at")
      .eq("booking_id", booking.id)
      .eq("channel", "whatsapp")
      .eq("message_type", "booking-confirmation-whatsapp")
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

    // Resolve payment reference
    const capturedPayment = (booking as any).payments?.find(
      (p: any) => p.status === "captured"
    );
    const paymentId = capturedPayment?.razorpay_payment_id || "N/A";
    const formattedAmount = `₹${((booking.amount_paise || 0) / 100).toLocaleString("en-IN")}`;

    // 5. Fetch template from existing message_templates table
    const { data: templateRecord } = await adminClient
      .from("message_templates")
      .select("body, variables")
      .eq("slug", "booking-confirmation-whatsapp")
      .eq("channel", "whatsapp")
      .maybeSingle();

    const fallbackBody =
      "Namaste {{student_name}}! 🌸 Your seat is reserved for {{course_name}} on {{date}} at {{time}}. Your booking reference is {{booking_reference}}. Check your email for stream details.";

    const templateText = templateRecord?.body || fallbackBody;

    // 6. Resolve variables server-side
    const resolvedBody = resolveTemplateVariables(templateText, {
      studentName: customer.full_name || "Valued Student",
      courseName: course?.title || "Masterclass",
      batchName: batch?.batch_name || "Upcoming Batch",
      date: batch?.start_date || "Upcoming",
      time: batch?.start_time ? `${batch.start_time} ${batch?.timezone || "IST"}` : "TBA",
      bookingReference: booking.booking_reference,
      amountPaid: formattedAmount,
      paymentReference: paymentId,
      zoomLink: batch?.zoom_join_url || "Link will be shared prior to session",
    });

    // 7. Dispatch via Transport
    const sendResult = await transport.sendTextMessage({
      to: recipientPhone,
      body: resolvedBody,
    });

    const nowIso = new Date().toISOString();

    // 8. Record in notification_logs
    if (sendResult.success) {
      await adminClient.from("notification_logs").insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        channel: "whatsapp",
        message_type: "booking-confirmation-whatsapp",
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
        channel: "whatsapp",
        message_type: "booking-confirmation-whatsapp",
        provider_message_id: null,
        status: "failed",
        error_message: sendResult.error || "WhatsApp delivery failed",
        retry_count: previousFailedCount + 1,
        sent_at: nowIso,
      });

      return {
        success: false,
        error: sendResult.error,
        code: sendResult.errorCode || "DELIVERY_FAILED",
      };
    }
  } catch (err: any) {
    const errorMsg = err?.message || "Unexpected exception during WhatsApp notification processing.";
    try {
      await adminClient.from("notification_logs").insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        channel: "whatsapp",
        message_type: "booking-confirmation-whatsapp",
        status: "failed",
        error_message: errorMsg,
        sent_at: new Date().toISOString(),
      });
    } catch {
      // Ignore database logging failure to avoid crash
    }

    return {
      success: false,
      error: errorMsg,
      code: "INTERNAL_NOTIFICATION_ERROR",
    };
  } finally {
    inFlightWhatsAppConfirmations.delete(booking.id);
  }
}
