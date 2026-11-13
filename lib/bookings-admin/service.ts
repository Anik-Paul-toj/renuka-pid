import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminBookingsQuery } from "@/lib/validations/booking-admin";

export interface AdminBookingListItem {
  id: string;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerWhatsapp: string | null;
  courseTitle: string;
  batchName: string;
  batchId: string;
  startDate: string;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "refunded";
  amountPaise: number;
  currency: string;
  seatReleased: boolean;
  paymentStatus: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AdminBookingDetail {
  id: string;
  bookingReference: string;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "refunded";
  amountPaise: number;
  currency: string;
  seatReleased: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    whatsappPhone: string | null;
  };
  course: {
    id: string;
    title: string;
    slug: string;
  };
  batch: {
    id: string;
    batchName: string;
    startDate: string;
    endDate: string | null;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  payments: Array<{
    id: string;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    amountPaise: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  discountBenefit?: {
    isEligible: boolean;
    referenceIdIssued: string | null;
    originalCoursePricePaise?: number;
    creditAmountPaise?: number;
    creditOwner?: string;
    redemptionStatus: "not_eligible" | "available" | "reserved" | "redeemed";
    redeemedAt?: string | null;
    targetBookingReference?: string | null;
  };
  notifications?: {
    email: {
      status: string;
      sentAt: string | null;
      errorMessage: string | null;
      providerMessageId: string | null;
    } | null;
    whatsapp: {
      status: string;
      sentAt: string | null;
      errorMessage: string | null;
      errorCode: string | null;
      providerMessageId: string | null;
    } | null;
  };
}

export interface AdminBookingsListResult {
  bookings: AdminBookingListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  availableBatches: Array<{
    id: string;
    batchName: string;
    startDate: string;
  }>;
}

/**
 * Retrieves paginated, searchable, and filtered list of bookings for the Admin Dashboard.
 */
export async function getBookingsList(
  query: AdminBookingsQuery
): Promise<{ success: true; data: AdminBookingsListResult } | { success: false; error: string; statusCode: number }> {
  try {
    const adminClient = createAdminClient();
    const { page, limit, search, status, paymentStatus, batchId } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 1. Fetch available cohort batches for filter dropdown
    const { data: batchesList } = await adminClient
      .from("cohort_batches")
      .select("id, batch_name, start_date")
      .order("start_date", { ascending: false });

    const availableBatches = (batchesList || []).map((b) => ({
      id: b.id,
      batchName: b.batch_name,
      startDate: b.start_date,
    }));

    // 2. Multi-column Search Resolution across customer name/email/phone
    let matchingCustomerIds: string[] = [];
    if (search && search.trim()) {
      const sanitized = search.trim();
      const { data: matchingCustomers } = await adminClient
        .from("customers")
        .select("id")
        .or(
          `full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,whatsapp_phone.ilike.%${sanitized}%`
        )
        .limit(100);

      if (matchingCustomers && matchingCustomers.length > 0) {
        matchingCustomerIds = matchingCustomers.map((c) => c.id);
      }
    }

    // 3. Build PostgREST Bookings Query
    const hasPaymentFilter = paymentStatus && paymentStatus !== "all";
    const paymentSelector = hasPaymentFilter ? "payments!inner" : "payments";

    let supabaseQuery = adminClient
      .from("bookings")
      .select(
        `
        id,
        booking_reference,
        status,
        amount_paise,
        currency,
        seat_released,
        expires_at,
        created_at,
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
          courses (
            id,
            title
          )
        ),
        ${paymentSelector} (
          id,
          razorpay_order_id,
          razorpay_payment_id,
          amount_paise,
          status,
          created_at
        )
      `,
        { count: "exact" }
      );

    // Apply Search
    if (search && search.trim()) {
      const sanitized = search.trim();
      if (matchingCustomerIds.length > 0) {
        supabaseQuery = supabaseQuery.or(
          `booking_reference.ilike.%${sanitized}%,customer_id.in.(${matchingCustomerIds.join(",")})`
        );
      } else {
        supabaseQuery = supabaseQuery.ilike("booking_reference", `%${sanitized}%`);
      }
    }

    // Apply Booking Status Filter
    if (status && status !== "all") {
      supabaseQuery = supabaseQuery.eq("status", status);
    }

    // Apply Batch Filter
    if (batchId && batchId !== "all") {
      supabaseQuery = supabaseQuery.eq("batch_id", batchId);
    }

    // Apply Payment Status Filter
    if (hasPaymentFilter) {
      supabaseQuery = supabaseQuery.eq("payments.status", paymentStatus);
    }

    // Order & Paginate
    supabaseQuery = supabaseQuery
      .order("created_at", { ascending: false })
      .range(from, to);

    const { data: rows, count, error } = await supabaseQuery;

    if (error) {
      console.error("Error querying bookings list:", error);
      return {
        success: false,
        error: "Failed to retrieve booking records.",
        statusCode: 500,
      };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const bookings: AdminBookingListItem[] = (rows || []).map((row: any) => {
      const customer = row.customers;
      const batch = row.cohort_batches;
      const course = batch?.courses;
      const paymentsList = Array.isArray(row.payments) ? [...row.payments] : [];

      paymentsList.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const latestPayment = paymentsList[0] || null;

      return {
        id: row.id,
        bookingReference: row.booking_reference,
        customerName: customer?.full_name || "Valued Student",
        customerEmail: customer?.email || "",
        customerPhone: customer?.phone || null,
        customerWhatsapp: customer?.whatsapp_phone || null,
        courseTitle: course?.title || "Masterclass",
        batchName: batch?.batch_name || "Upcoming Batch",
        batchId: row.batch_id,
        startDate: batch?.start_date || "",
        bookingStatus: row.status,
        amountPaise: row.amount_paise,
        currency: row.currency,
        seatReleased: row.seat_released,
        paymentStatus: latestPayment?.status || null,
        razorpayPaymentId: latestPayment?.razorpay_payment_id || null,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      };
    });

    return {
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasPrevious: page > 1,
          hasNext: page < totalPages,
        },
        availableBatches,
      },
    };
  } catch (err: any) {
    console.error("Unexpected error in getBookingsList:", err);
    return {
      success: false,
      error: "Internal server error querying booking directory.",
      statusCode: 500,
    };
  }
}

/**
 * Retrieves comprehensive details for a single booking with safe customer and payment records.
 * Omits any sensitive cryptographic signatures or internal secrets.
 */
export async function getBookingDetailsById(
  bookingIdOrRef: string
): Promise<{ success: true; data: AdminBookingDetail } | { success: false; error: string; statusCode: number }> {
  try {
    const adminClient = createAdminClient();
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingIdOrRef);

    let query = adminClient
      .from("bookings")
      .select(
        `
        id,
        booking_reference,
        status,
        amount_paise,
        currency,
        seat_released,
        expires_at,
        created_at,
        updated_at,
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
          courses (
            id,
            title,
            slug
          )
        ),
        payments (
          id,
          razorpay_order_id,
          razorpay_payment_id,
          amount_paise,
          currency,
          status,
          created_at
        )
      `
      );

    if (isUUID) {
      query = query.eq("id", bookingIdOrRef);
    } else {
      query = query.eq("booking_reference", bookingIdOrRef);
    }

    const { data: booking, error } = await query.maybeSingle();

    if (error) {
      console.error("Error retrieving booking details:", error);
      return {
        success: false,
        error: "Failed to retrieve booking record.",
        statusCode: 500,
      };
    }

    if (!booking) {
      return {
        success: false,
        error: "Booking record not found.",
        statusCode: 404,
      };
    }

    const customer = (booking as any).customers;
    const batch = (booking as any).cohort_batches;
    const course = batch?.courses;
    const paymentsList = Array.isArray((booking as any).payments)
      ? [...(booking as any).payments]
      : [];

    paymentsList.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Safe payments list only - zero signatures or raw snapshots
    const safePayments = paymentsList.map((p: any) => ({
      id: p.id,
      razorpayOrderId: p.razorpay_order_id,
      razorpayPaymentId: p.razorpay_payment_id || null,
      amountPaise: p.amount_paise,
      currency: p.currency,
      status: p.status,
      createdAt: p.created_at,
    }));

    // Fetch Notification Statuses
    let emailNotif: {
      status: string;
      sentAt: string | null;
      errorMessage: string | null;
      providerMessageId: string | null;
    } | null = null;

    let whatsappNotif: {
      status: string;
      sentAt: string | null;
      errorMessage: string | null;
      errorCode: string | null;
      providerMessageId: string | null;
    } | null = null;

    try {
      const { data: logs } = await adminClient
        .from("notification_logs")
        .select("id, channel, status, sent_at, error_message, error_code, provider_message_id")
        .eq("booking_id", booking.id)
        .order("sent_at", { ascending: false });

      if (logs && logs.length > 0) {
        const emailLog = logs.find((l) => l.channel === "email");
        if (emailLog) {
          emailNotif = {
            status: emailLog.status,
            sentAt: emailLog.sent_at,
            errorMessage: emailLog.error_message || null,
            providerMessageId: emailLog.provider_message_id || null,
          };
        }

        const whatsappLog = logs.find((l) => l.channel === "whatsapp");
        if (whatsappLog) {
          whatsappNotif = {
            status: whatsappLog.status,
            sentAt: whatsappLog.sent_at,
            errorMessage: whatsappLog.error_message || null,
            errorCode: whatsappLog.error_code || null,
            providerMessageId: whatsappLog.provider_message_id || null,
          };
        }
      }
    } catch {
      // Ignore if logs query fails
    }

    // Determine Discount Benefit & Redemption Status
    const isFoundation =
      course?.slug === "watercolour-foundation" ||
      course?.id === "e1111111-2222-3333-4444-555555555555";

    let discountBenefit: AdminBookingDetail["discountBenefit"] = {
      isEligible: false,
      referenceIdIssued: null,
      redemptionStatus: "not_eligible",
    };

    if (isFoundation) {
      let redemptionStatus: "available" | "reserved" | "redeemed" = "available";
      let targetBookingRef: string | null = null;
      let redeemedAt: string | null = null;

      const originalCoursePricePaise =
        (course as any)?.price_paise ||
        (course as any)?.offer_price_paise ||
        booking.amount_paise;
      let creditAmountPaise =
        booking.amount_paise ||
        (booking as any).original_amount_paise ||
        (course as any)?.offer_price_paise;

      try {
        const { data: creditRow } = await adminClient
          .from("booking_credits")
          .select(
            `
            id,
            credit_amount_paise,
            status,
            updated_at,
            bookings!booking_credits_target_booking_id_fkey (
              booking_reference
            )
          `
          )
          .eq("source_booking_id", booking.id)
          .in("status", ["reserved", "consumed"])
          .maybeSingle();

        if (creditRow) {
          if (creditRow.credit_amount_paise) {
            creditAmountPaise = creditRow.credit_amount_paise;
          }
          if (creditRow.status === "consumed") {
            redemptionStatus = "redeemed";
            redeemedAt = creditRow.updated_at;
            targetBookingRef = (creditRow as any).bookings?.booking_reference || null;
          } else if (creditRow.status === "reserved") {
            redemptionStatus = "reserved";
          }
        }
      } catch {
        // Fallback if table not present
      }

      const creditOwner = customer?.full_name
        ? `${customer.full_name} (${customer.email || customer.phone || "Student"})`
        : customer?.email || customer?.phone || "Student";

      discountBenefit = {
        isEligible: true,
        referenceIdIssued: booking.booking_reference,
        originalCoursePricePaise,
        creditAmountPaise,
        creditOwner,
        redemptionStatus,
        redeemedAt,
        targetBookingReference: targetBookingRef,
      };
    }

    return {
      success: true,
      data: {
        id: booking.id,
        bookingReference: booking.booking_reference,
        bookingStatus: booking.status,
        amountPaise: booking.amount_paise,
        currency: booking.currency,
        seatReleased: booking.seat_released,
        expiresAt: booking.expires_at,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        customer: {
          id: customer?.id || "",
          fullName: customer?.full_name || "Valued Student",
          email: customer?.email || "",
          phone: customer?.phone || null,
          whatsappPhone: customer?.whatsapp_phone || null,
        },
        course: {
          id: course?.id || "",
          title: course?.title || "Masterclass",
          slug: course?.slug || "",
        },
        batch: {
          id: batch?.id || "",
          batchName: batch?.batch_name || "Upcoming Batch",
          startDate: batch?.start_date || "",
          endDate: batch?.end_date || null,
          startTime: batch?.start_time || "",
          endTime: batch?.end_time || "",
          timezone: batch?.timezone || "Asia/Kolkata",
        },
        payments: safePayments,
        discountBenefit,
        notifications: {
          email: emailNotif,
          whatsapp: whatsappNotif,
        },
      },
    };
  } catch (err: any) {
    console.error("Unexpected error in getBookingDetailsById:", err);
    return {
      success: false,
      error: "Internal error retrieving booking details.",
      statusCode: 500,
    };
  }
}

/**
 * Safely cancels a booking using the existing atomic seat release database function.
 * Preserves seat count bounds (seats_booked <= total_seats) and guarantees idempotency.
 */
export async function cancelBookingById(
  bookingIdOrRef: string,
  reason: string = "cancelled"
): Promise<{ success: boolean; alreadyReleased?: boolean; message?: string; error?: string; statusCode: number }> {
  try {
    const adminClient = createAdminClient();
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingIdOrRef);

    let query = adminClient.from("bookings").select("id, status, seat_released");
    if (isUUID) {
      query = query.eq("id", bookingIdOrRef);
    } else {
      query = query.eq("booking_reference", bookingIdOrRef);
    }

    const { data: booking, error: findErr } = await query.maybeSingle();

    if (findErr || !booking) {
      return {
        success: false,
        error: "Booking not found.",
        statusCode: 404,
      };
    }

    // Call existing atomic release function
    const { data: rpcResult, error: rpcErr } = await adminClient.rpc(
      "release_seat_atomic",
      {
        p_booking_id: booking.id,
        p_reason: reason,
      }
    );

    if (rpcErr) {
      console.error("RPC release_seat_atomic error:", rpcErr);
      return {
        success: false,
        error: "Failed to release seat atomically.",
        statusCode: 500,
      };
    }

    return {
      success: true,
      alreadyReleased: rpcResult?.already_released || false,
      message: rpcResult?.message || "Booking cancelled successfully.",
      statusCode: 200,
    };
  } catch (err: any) {
    console.error("Unexpected error in cancelBookingById:", err);
    return {
      success: false,
      error: "Internal error during booking cancellation.",
      statusCode: 500,
    };
  }
}
