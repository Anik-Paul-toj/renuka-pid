import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { NotificationQuery } from "@/lib/validations/notification";
import { sendBookingConfirmationEmail } from "@/lib/notifications/service";

export interface AdminNotificationRecipient {
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

export interface AdminNotificationBooking {
  id: string | null;
  bookingReference: string | null;
  courseTitle: string | null;
  batchName: string | null;
}

export interface AdminNotificationListItem {
  id: string;
  channel: "email" | "whatsapp";
  messageType: string;
  status: "sent" | "delivered" | "read" | "failed";
  errorMessage: string | null;
  retryCount: number;
  sentAt: string;
  providerMessageId: string | null;
  recipient: AdminNotificationRecipient;
  booking: AdminNotificationBooking | null;
  canRetry: boolean;
}

export interface NotificationLogsSummary {
  totalNotifications: number;
  successfulSends: number;
  failedSends: number;
}

export interface NotificationLogsListResult {
  logs: AdminNotificationListItem[];
  summary: NotificationLogsSummary;
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

/**
 * Lists notification logs with server-side filtering, multi-field search,
 * pagination, and summary statistics.
 */
export async function getNotificationLogsList(
  query: NotificationQuery
): Promise<{ success: true; data: NotificationLogsListResult } | { success: false; error: string }> {
  try {
    const adminClient = createAdminClient();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 1. Fetch Global Summary Stats
    const [{ count: totalAll }, { count: sentAll }, { count: failedAll }] =
      await Promise.all([
        adminClient.from("notification_logs").select("id", { count: "exact", head: true }),
        adminClient
          .from("notification_logs")
          .select("id", { count: "exact", head: true })
          .in("status", ["sent", "delivered", "read"]),
        adminClient
          .from("notification_logs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed"),
      ]);

    const summary: NotificationLogsSummary = {
      totalNotifications: totalAll || 0,
      successfulSends: sentAll || 0,
      failedSends: failedAll || 0,
    };

    // 2. Resolve Multi-Field Search (Across customers and bookings)
    let matchingCustomerIds: string[] = [];
    let matchingBookingIds: string[] = [];

    if (query.search && query.search.trim()) {
      const sanitized = query.search.trim();

      const [{ data: matchingCustomers }, { data: matchingBookings }] =
        await Promise.all([
          adminClient
            .from("customers")
            .select("id")
            .or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`),
          adminClient
            .from("bookings")
            .select("id")
            .ilike("booking_reference", `%${sanitized}%`),
        ]);

      matchingCustomerIds = (matchingCustomers || []).map((c) => c.id);
      matchingBookingIds = (matchingBookings || []).map((b) => b.id);
    }

    // 3. Build Filtered Query
    let dbQuery = adminClient
      .from("notification_logs")
      .select(
        `
        id,
        channel,
        message_type,
        status,
        error_message,
        retry_count,
        sent_at,
        provider_message_id,
        customers (
          id,
          full_name,
          email,
          phone
        ),
        bookings (
          id,
          booking_reference,
          cohort_batches (
            batch_name,
            courses (
              title
            )
          )
        )
      `,
        { count: "exact" }
      )
      .order("sent_at", { ascending: false });

    // Status filter
    if (query.status && query.status !== "all") {
      if (query.status === "sent") {
        dbQuery = dbQuery.in("status", ["sent", "delivered", "read"]);
      } else {
        dbQuery = dbQuery.eq("status", query.status);
      }
    }

    // Channel filter
    if (query.channel && query.channel !== "all") {
      dbQuery = dbQuery.eq("channel", query.channel);
    }

    // Type filter
    if (query.type && query.type !== "all") {
      dbQuery = dbQuery.eq("message_type", query.type);
    }

    // Search filter across provider message ID, error message, or matched customers/bookings
    if (query.search && query.search.trim()) {
      const sanitized = query.search.trim();
      const orConditions: string[] = [
        `provider_message_id.ilike.%${sanitized}%`,
        `error_message.ilike.%${sanitized}%`,
      ];

      if (matchingCustomerIds.length > 0) {
        orConditions.push(`customer_id.in.(${matchingCustomerIds.join(",")})`);
      }
      if (matchingBookingIds.length > 0) {
        orConditions.push(`booking_id.in.(${matchingBookingIds.join(",")})`);
      }

      dbQuery = dbQuery.or(orConditions.join(","));
    }

    // Apply pagination
    dbQuery = dbQuery.range(from, to);

    const { data: rows, count: filteredCount, error } = await dbQuery;

    if (error) {
      console.error("Error querying notification logs:", error);
      return { success: false, error: error.message };
    }

    const totalCount = filteredCount || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    // 4. Map & Sanitize Results
    const logs: AdminNotificationListItem[] = (rows || []).map((row: any) => {
      const cust = row.customers;
      const bkg = row.bookings;
      const batch = bkg?.cohort_batches;
      const course = batch?.courses;

      return {
        id: row.id,
        channel: row.channel,
        messageType: row.message_type,
        status: row.status,
        errorMessage: row.error_message || null,
        retryCount: row.retry_count || 0,
        sentAt: row.sent_at,
        providerMessageId: row.provider_message_id || null,
        recipient: {
          fullName: cust?.full_name || null,
          email: cust?.email || null,
          phone: cust?.phone || null,
        },
        booking: bkg
          ? {
              id: bkg.id,
              bookingReference: bkg.booking_reference,
              courseTitle: course?.title || null,
              batchName: batch?.batch_name || null,
            }
          : null,
        canRetry: row.status === "failed",
      };
    });

    return {
      success: true,
      data: {
        logs,
        summary,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages,
          hasPrevious: page > 1,
          hasNext: page < totalPages,
        },
      },
    };
  } catch (err: any) {
    console.error("getNotificationLogsList unhandled error:", err);
    return { success: false, error: err.message || "Failed to list notification logs." };
  }
}

/**
 * Retrieves full sanitized details for a single notification log.
 */
export async function getNotificationLogById(
  id: string
): Promise<{ success: true; data: AdminNotificationListItem } | { success: false; error: string; statusCode: number }> {
  try {
    const adminClient = createAdminClient();

    const { data: row, error } = await adminClient
      .from("notification_logs")
      .select(
        `
        id,
        channel,
        message_type,
        status,
        error_message,
        retry_count,
        sent_at,
        provider_message_id,
        customers (
          id,
          full_name,
          email,
          phone
        ),
        bookings (
          id,
          booking_reference,
          status,
          cohort_batches (
            batch_name,
            courses (
              title
            )
          )
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !row) {
      return { success: false, error: "Notification log not found", statusCode: 404 };
    }

    const cust = (row as any).customers;
    const bkg = (row as any).bookings;
    const batch = bkg?.cohort_batches;
    const course = batch?.courses;

    const log: AdminNotificationListItem = {
      id: row.id,
      channel: row.channel as any,
      messageType: row.message_type,
      status: row.status as any,
      errorMessage: row.error_message || null,
      retryCount: row.retry_count || 0,
      sentAt: row.sent_at,
      providerMessageId: row.provider_message_id || null,
      recipient: {
        fullName: cust?.full_name || null,
        email: cust?.email || null,
        phone: cust?.phone || null,
      },
      booking: bkg
        ? {
            id: bkg.id,
            bookingReference: bkg.booking_reference,
            courseTitle: course?.title || null,
            batchName: batch?.batch_name || null,
          }
        : null,
      canRetry: row.status === "failed",
    };

    return { success: true, data: log };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to get notification details", statusCode: 500 };
  }
}

/**
 * Retries a failed notification log using the existing Phase 12 notification service.
 * Enforces retry eligibility (only failed records may be retried).
 */
export async function retryNotificationById(
  id: string
): Promise<{ success: boolean; error?: string; statusCode: number; providerMessageId?: string }> {
  try {
    const adminClient = createAdminClient();

    // 1. Fetch notification log and check retry eligibility
    const { data: log, error: fetchErr } = await adminClient
      .from("notification_logs")
      .select("id, status, booking_id, customer_id, channel, message_type")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !log) {
      return { success: false, error: "Notification log not found.", statusCode: 404 };
    }

    // Eligibility check: Only failed notifications can be retried
    if (log.status !== "failed") {
      return {
        success: false,
        error: `Notification is not eligible for retry. Current status is '${log.status}'. Only failed notifications can be retried.`,
        statusCode: 400,
      };
    }

    // 2. Dispatch retry through authoritative notification pipeline
    if (log.booking_id) {
      // Find booking reference
      const { data: booking } = await adminClient
        .from("bookings")
        .select("booking_reference")
        .eq("id", log.booking_id)
        .maybeSingle();

      if (!booking?.booking_reference) {
        return { success: false, error: "Associated booking record not found.", statusCode: 404 };
      }

      // Re-use Phase 12 sendBookingConfirmationEmail with forceRetry = true
      const result = await sendBookingConfirmationEmail(booking.booking_reference, {
        forceRetry: true,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Retry delivery attempt failed.",
          statusCode: 500,
        };
      }

      return {
        success: true,
        statusCode: 200,
        providerMessageId: result.providerMessageId,
      };
    } else {
      return {
        success: false,
        error: "Direct notification retries without an associated booking are not supported.",
        statusCode: 400,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred during retry.",
      statusCode: 500,
    };
  }
}
