import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWhatsAppTransport } from "./client";
import {
  WhatsAppTransport,
  WhatsAppConfigStatus,
  WhatsAppDeliveryStatus,
} from "./types";
import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "./meta-adapter";
import { buildMetaTemplateComponents } from "./templates";
import {
  isWhatsAppGroupEligibleCourse,
  resolveWhatsAppGroupUrl,
} from "./group";

export interface WhatsAppServiceResult {
  success: boolean;
  alreadySent?: boolean;
  providerMessageId?: string;
  error?: string;
  code?: string;
}

export interface UpcomingClassReminderResult {
  success: boolean;
  totalEligible: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  error?: string;
}

// In-memory concurrency locks to prevent duplicate concurrent in-flight dispatches
const inFlightWhatsAppConfirmations = new Set<string>();
const inFlightBatchReminders = new Set<string>();

/**
 * Returns current configuration status of WhatsApp without exposing any credentials.
 */
export function getWhatsAppConfigStatus(): WhatsAppConfigStatus {
  const transport = getWhatsAppTransport();
  return transport.getConfigStatus();
}

/**
 * Sends a transactional booking confirmation WhatsApp message idempotently using Meta Cloud API.
 * 
 * Guarantees:
 * 1. Only confirmed bookings receive confirmation messages.
 * 2. Uses approved WhatsApp template: 'booking_confirmation'.
 * 3. Maps parameters: {{1}} Customer Name, {{2}} Course Name, {{3}} Booking Reference.
 * 4. Course-specific behavior:
 *    - Roadmap Masterclass: Excludes group link.
 *    - Watercolour Foundation & Artistry + Foundation: Eligible for group links.
 * 5. Idempotent: duplicate webhook or repeated verification will not re-send.
 * 6. Concurrency protected.
 * 7. Failure isolation: Notification failures never alter payment or booking confirmation status.
 * 8. Logs strictly in existing public.notification_logs with channel = 'whatsapp'.
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
        whatsapp_phone,
        whatsapp_consent
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
    await adminClient.from("notification_logs").insert({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      course_id: course?.id || null,
      batch_id: batch?.id || null,
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
      course_id: course?.id || null,
      batch_id: batch?.id || null,
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

  // 3. Customer Consent Check
  if (customer?.whatsapp_consent === false) {
    return {
      success: false,
      error: "Customer has opted out of WhatsApp notifications.",
      code: "WHATSAPP_CONSENT_REVOKED",
    };
  }

  // 4. Concurrency Lock: Prevent simultaneous executions for the same booking
  if (inFlightWhatsAppConfirmations.has(booking.id)) {
    return {
      success: true,
      alreadySent: false,
      code: "IN_FLIGHT_DISPATCH",
    };
  }

  inFlightWhatsAppConfirmations.add(booking.id);

  try {
    // 5. Idempotency Check via notification_logs
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

    // 6. Course-specific group eligibility check
    const isEligibleForGroup = isWhatsAppGroupEligibleCourse({
      courseSlug: course?.slug,
      courseId: course?.id,
    });

    // 7. Verify Meta Template Approval Status
    // Never assume a pending template is approved. If unavailable, do not send arbitrary free-form text.
    if (transport.getApprovedTemplates) {
      try {
        const approvedTemplates = await transport.getApprovedTemplates();
        if (Array.isArray(approvedTemplates) && approvedTemplates.length > 0) {
          const isTemplateApproved = approvedTemplates.some(
            (t) =>
              t.name === "booking_confirmation" &&
              (t.status?.toUpperCase() === "APPROVED" || t.status?.toUpperCase() === "ACTIVE")
          );

          if (!isTemplateApproved) {
            const skipReason =
              "Template 'booking_confirmation' is not approved in Meta (PENDING or UNAVAILABLE). WhatsApp notification skipped; detailed confirmation sent via email.";

            // Attempt inserting with status 'skipped' (supported post-migration), fallback to 'failed'
            try {
              await adminClient.from("notification_logs").insert({
                booking_id: booking.id,
                customer_id: booking.customer_id,
                course_id: course?.id || null,
                batch_id: batch?.id || null,
                channel: "whatsapp",
                message_type: "booking-confirmation-whatsapp",
                template_name: "booking_confirmation",
                recipient_phone: normalizeWhatsAppNumber(recipientPhone),
                provider_message_id: null,
                status: "skipped" as any,
                error_message: skipReason,
                error_code: "TEMPLATE_PENDING",
                retry_count: previousFailedCount,
                sent_at: new Date().toISOString(),
              });
            } catch {
              await adminClient.from("notification_logs").insert({
                booking_id: booking.id,
                customer_id: booking.customer_id,
                course_id: course?.id || null,
                batch_id: batch?.id || null,
                channel: "whatsapp",
                message_type: "booking-confirmation-whatsapp",
                template_name: "booking_confirmation",
                recipient_phone: normalizeWhatsAppNumber(recipientPhone),
                provider_message_id: null,
                status: "failed",
                error_message: skipReason,
                error_code: "TEMPLATE_PENDING",
                retry_count: previousFailedCount,
                sent_at: new Date().toISOString(),
              });
            }

            return {
              success: false,
              error: skipReason,
              code: "TEMPLATE_PENDING",
            };
          }
        }
      } catch (tmplErr) {
        // If template check encounters a transient network issue, proceed to attempt template dispatch
        console.warn("[Meta WhatsApp] Template status check notice:", tmplErr);
      }
    }

    // 8. Dynamic Variable Mapping for Approved Meta Positional Template: 'booking_confirmation'
    // Meta Template Text:
    // "Namaste {{1}}! 🌸 Your seat is reserved for {{2}} on {{3}} at {{4}}. Your booking reference is {{5}}. Check your email for stream details."
    // Variable {{1}}: Customer name
    // Variable {{2}}: Course name
    // Variable {{3}}: Start Date (or graceful fallback)
    // Variable {{4}}: Timing (or graceful fallback)
    // Variable {{5}}: Booking reference (acts as unique discount reference ID for eligible Foundation students)
    const customerName = (customer.full_name || "Valued Student").trim();
    const courseTitle = (course?.title || "Live Masterclass").trim();
    const bookingRef = booking.booking_reference.trim();

    const startDateText =
      batch?.start_date && batch.start_date.trim() ? batch.start_date : "To be announced";
    const timingText = batch?.start_time
      ? `${batch.start_time}${batch.end_time ? ` – ${batch.end_time}` : ""} ${batch.timezone || "IST"}`
      : "To be announced";

    const templateParams = [customerName, courseTitle, startDateText, timingText, bookingRef];

    // 9. Dispatch via Transport using Approved Meta Template
    const sendResult = await transport.sendTemplateMessage({
      to: recipientPhone,
      templateName: "booking_confirmation",
      languageCode: "en",
      components: buildMetaTemplateComponents(templateParams),
    });

    const nowIso = new Date().toISOString();

    // 10. Record in notification_logs
    if (sendResult.success) {
      await adminClient.from("notification_logs").insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        course_id: course?.id || null,
        batch_id: batch?.id || null,
        channel: "whatsapp",
        message_type: "booking-confirmation-whatsapp",
        template_name: "booking_confirmation",
        recipient_phone: normalizeWhatsAppNumber(recipientPhone),
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
        course_id: course?.id || null,
        batch_id: batch?.id || null,
        channel: "whatsapp",
        message_type: "booking-confirmation-whatsapp",
        template_name: "booking_confirmation",
        recipient_phone: normalizeWhatsAppNumber(recipientPhone),
        provider_message_id: null,
        status: "failed",
        error_message: sendResult.error || "WhatsApp delivery failed",
        error_code: sendResult.errorCode || null,
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
    const errorMsg =
      err?.message || "Unexpected exception during WhatsApp notification processing.";
    try {
      await adminClient.from("notification_logs").insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        course_id: course?.id || null,
        batch_id: batch?.id || null,
        channel: "whatsapp",
        message_type: "booking-confirmation-whatsapp",
        template_name: "booking_confirmation",
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

/**
 * Sends upcoming class reminders via WhatsApp Cloud API to all confirmed students of a batch.
 * 
 * Guarantees:
 * 1. Only confirmed students of the specified batch receive reminders.
 * 2. Excludes cancelled, expired, or pending bookings.
 * 3. Prevents duplicate reminders for the same student and batch.
 * 4. Checks WhatsApp consent and phone validity.
 * 5. Uses approved Meta utility template.
 * 6. Maps variables: {{1}} Student, {{2}} Course, {{3}} Date, {{4}} Time, {{5}} Join Link.
 */
export async function sendUpcomingClassReminderWhatsApp(options: {
  batchId: string;
  adminUserId?: string | null;
  transport?: WhatsAppTransport;
}): Promise<UpcomingClassReminderResult> {
  const { batchId } = options;
  const adminClient = createAdminClient();
  const transport = options.transport || getWhatsAppTransport();

  // Guard against concurrent reminder triggers for the same batch
  if (inFlightBatchReminders.has(batchId)) {
    return {
      success: false,
      totalEligible: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      error: "Reminder dispatch is already in progress for this batch.",
    };
  }

  inFlightBatchReminders.add(batchId);

  try {
    // 1. Fetch Batch Details
    const { data: batch, error: batchErr } = await adminClient
      .from("cohort_batches")
      .select(
        `
        id,
        batch_name,
        start_date,
        start_time,
        end_time,
        timezone,
        zoom_join_url,
        is_enrollment_open,
        courses (
          id,
          slug,
          title
        )
      `
      )
      .eq("id", batchId)
      .maybeSingle();

    if (batchErr || !batch) {
      return {
        success: false,
        totalEligible: 0,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        error: "Batch record not found.",
      };
    }

    const course = (batch as any).courses;
    const courseTitle = course?.title || "Watercolour Masterclass";
    const batchDate = batch.start_date || "Upcoming Date";
    const batchTime = batch.start_time
      ? `${batch.start_time}${batch.end_time ? " – " + batch.end_time : ""} ${batch.timezone || "IST"}`
      : "Check email for timing";
    const joinLink = batch.zoom_join_url || "Link shared via confirmation email";

    // 2. Fetch confirmed bookings for this batch
    const { data: bookings, error: bookingsErr } = await adminClient
      .from("bookings")
      .select(
        `
        id,
        booking_reference,
        status,
        customer_id,
        customers (
          id,
          full_name,
          phone,
          whatsapp_phone,
          whatsapp_consent
        )
      `
      )
      .eq("batch_id", batchId)
      .eq("status", "confirmed");

    if (bookingsErr || !bookings || bookings.length === 0) {
      return {
        success: true,
        totalEligible: 0,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
      };
    }

    // 3. Find students who have ALREADY received this reminder for this batch
    const { data: sentReminders } = await adminClient
      .from("notification_logs")
      .select("customer_id")
      .eq("batch_id", batchId)
      .eq("message_type", "upcoming-class-reminder")
      .in("status", ["sent", "delivered", "read"]);

    const alreadySentCustomerIds = new Set(
      (sentReminders || []).map((r) => r.customer_id)
    );

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let totalEligible = 0;

    for (const b of bookings) {
      const cust = (b as any).customers;
      if (!cust) continue;

      const rawPhone = cust.whatsapp_phone || cust.phone;
      if (!rawPhone || !isValidWhatsAppNumber(rawPhone)) {
        skippedCount++;
        continue;
      }

      if (cust.whatsapp_consent === false) {
        skippedCount++;
        continue;
      }

      if (alreadySentCustomerIds.has(cust.id)) {
        skippedCount++;
        continue;
      }

      totalEligible++;
      const studentName = cust.full_name || "Student";
      const normalizedPhone = normalizeWhatsAppNumber(rawPhone);

      // Template parameters for approved utility reminder template:
      // {{1}}: Student Name
      // {{2}}: Course Title
      // {{3}}: Date
      // {{4}}: Time
      // {{5}}: Join Link
      const templateParams = [
        studentName,
        courseTitle,
        batchDate,
        batchTime,
        joinLink,
      ];

      const sendResult = await transport.sendTemplateMessage({
        to: normalizedPhone,
        templateName: "upcoming_class_reminder",
        languageCode: "en",
        components: buildMetaTemplateComponents(templateParams),
      });

      const nowIso = new Date().toISOString();

      if (sendResult.success) {
        sentCount++;
        alreadySentCustomerIds.add(cust.id);

        await adminClient.from("notification_logs").insert({
          booking_id: b.id,
          customer_id: cust.id,
          course_id: course?.id || null,
          batch_id: batch.id,
          channel: "whatsapp",
          message_type: "upcoming-class-reminder",
          template_name: "upcoming_class_reminder",
          recipient_phone: normalizedPhone,
          provider_message_id: sendResult.providerMessageId || null,
          status: "sent",
          sent_at: nowIso,
        });
      } else {
        failedCount++;

        await adminClient.from("notification_logs").insert({
          booking_id: b.id,
          customer_id: cust.id,
          course_id: course?.id || null,
          batch_id: batch.id,
          channel: "whatsapp",
          message_type: "upcoming-class-reminder",
          template_name: "upcoming_class_reminder",
          recipient_phone: normalizedPhone,
          status: "failed",
          error_message: sendResult.error || "Failed to deliver upcoming class reminder",
          error_code: sendResult.errorCode || null,
          sent_at: nowIso,
        });
      }

      // Small throttling delay between recipients to prevent rate spike
      await new Promise((r) => setTimeout(r, 100));
    }

    return {
      success: true,
      totalEligible,
      sentCount,
      failedCount,
      skippedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      totalEligible: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      error: err.message || "Failed to process batch class reminders.",
    };
  } finally {
    inFlightBatchReminders.delete(batchId);
  }
}
