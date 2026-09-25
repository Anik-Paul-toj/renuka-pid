import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPaymentsQuery } from "@/lib/validations/payment-admin";

export interface AdminPaymentListItem {
  id: string;
  razorpayPaymentId: string | null;
  razorpayOrderId: string;
  bookingReference: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  courseTitle: string;
  courseId: string;
  batchName: string;
  batchId: string;
  amountPaise: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "failed" | "refunded";
  createdAt: string;
  updatedAt: string;
  bookingStatus: string;
  bookingAmountPaise: number;
  hasDiscrepancy: boolean;
  discrepancyReasons: string[];
}

export interface AdminPaymentDetail {
  id: string;
  razorpayPaymentId: string | null;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "failed" | "refunded";
  createdAt: string;
  updatedAt: string;
  failureReason: string | null;
  providerPaymentMethod: string | null;
  acquirerData: {
    rrn?: string;
    bankTransactionId?: string;
    upiTransactionId?: string;
  } | null;
  booking: {
    id: string;
    bookingReference: string;
    status: string;
    amountPaise: number;
    currency: string;
    createdAt: string;
    expiresAt: string;
  };
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
    startTime: string;
    endTime: string;
    timezone: string;
  };
  reconciliation: {
    hasDiscrepancy: boolean;
    warnings: string[];
  };
}

export interface AdminReconciliationSummary {
  totalCount: number;
  capturedCount: number;
  failedCount: number;
  pendingCount: number;
  refundedCount: number;
  totalCapturedAmountPaise: number;
  discrepancyCount: number;
}

export interface AdminPaymentsListResult {
  payments: AdminPaymentListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  summary: AdminReconciliationSummary;
  availableCourses: Array<{ id: string; title: string }>;
  availableBatches: Array<{ id: string; batchName: string; startDate: string }>;
}

/**
 * Format integer paise into INR currency display safely without float drift
 */
export function formatPaiseToInr(amountPaise: number): string {
  const integerPart = Math.floor(amountPaise / 100);
  const fractionalPart = (amountPaise % 100).toString().padStart(2, "0");
  const formattedInteger = integerPart.toLocaleString("en-IN");
  return `₹${formattedInteger}.${fractionalPart}`;
}

/**
 * Evaluates payment-booking state consistency.
 * Flags discrepancies for audit review. Does NOT auto-mutate database state.
 */
export function evaluatePaymentDiscrepancy(
  paymentStatus: string,
  paymentAmountPaise: number,
  bookingStatus?: string | null,
  bookingAmountPaise?: number | null
): { hasDiscrepancy: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (bookingStatus) {
    // 1. Payment captured but booking not confirmed
    if (paymentStatus === "captured" && bookingStatus !== "confirmed") {
      reasons.push(
        `Payment is captured, but associated booking is currently '${bookingStatus}' instead of 'confirmed'.`
      );
    }

    // 2. Booking confirmed but payment not captured
    if (bookingStatus === "confirmed" && paymentStatus !== "captured") {
      reasons.push(
        `Booking is marked 'confirmed', but payment record status is '${paymentStatus}'.`
      );
    }
  }

  // 3. Amount mismatch
  if (bookingAmountPaise !== undefined && bookingAmountPaise !== null) {
    if (paymentAmountPaise !== bookingAmountPaise) {
      reasons.push(
        `Amount mismatch: Payment recorded ${formatPaiseToInr(
          paymentAmountPaise
        )}, but booking expects ${formatPaiseToInr(bookingAmountPaise)}.`
      );
    }
  }

  return {
    hasDiscrepancy: reasons.length > 0,
    reasons,
  };
}

/**
 * Retrieves paginated, searchable, and filtered list of payments with reconciliation summary.
 */
export async function getPaymentsList(
  query: AdminPaymentsQuery
): Promise<
  | { success: true; data: AdminPaymentsListResult }
  | { success: false; error: string; statusCode: number }
> {
  try {
    const adminClient = createAdminClient();
    const { page, limit, search, status, courseId, batchId, from, to } = query;
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    // 1. Fetch filter metadata: available courses and batches
    const [coursesRes, batchesRes] = await Promise.all([
      adminClient.from("courses").select("id, title").order("title"),
      adminClient
        .from("cohort_batches")
        .select("id, batch_name, start_date")
        .order("start_date", { ascending: false }),
    ]);

    const availableCourses = (coursesRes.data || []).map((c) => ({
      id: c.id,
      title: c.title,
    }));

    const availableBatches = (batchesRes.data || []).map((b) => ({
      id: b.id,
      batchName: b.batch_name,
      startDate: b.start_date,
    }));

    // 2. System-wide Reconciliation Summary (Integer paise arithmetic)
    const { data: allPaymentsSummary } = await adminClient
      .from("payments")
      .select("id, status, amount_paise, booking_id, bookings(status, amount_paise)");

    let totalCapturedAmountPaise = 0;
    let capturedCount = 0;
    let failedCount = 0;
    let pendingCount = 0;
    let refundedCount = 0;
    let discrepancyCount = 0;

    if (allPaymentsSummary && allPaymentsSummary.length > 0) {
      for (const p of allPaymentsSummary) {
        if (p.status === "captured") {
          capturedCount++;
          // Integer addition
          totalCapturedAmountPaise += Math.round(p.amount_paise || 0);
        } else if (p.status === "failed") {
          failedCount++;
        } else if (p.status === "created" || p.status === "authorized") {
          pendingCount++;
        } else if (p.status === "refunded") {
          refundedCount++;
        }

        const b = p.bookings as any;
        const disc = evaluatePaymentDiscrepancy(
          p.status,
          p.amount_paise,
          b?.status,
          b?.amount_paise
        );
        if (disc.hasDiscrepancy) {
          discrepancyCount++;
        }
      }
    }

    const summary: AdminReconciliationSummary = {
      totalCount: allPaymentsSummary ? allPaymentsSummary.length : 0,
      capturedCount,
      failedCount,
      pendingCount,
      refundedCount,
      totalCapturedAmountPaise,
      discrepancyCount,
    };

    // 3. Resolve Batch / Course booking IDs if filtered
    let targetBookingIds: string[] | null = null;

    if (batchId && batchId !== "all") {
      const { data: batchBookings } = await adminClient
        .from("bookings")
        .select("id")
        .eq("batch_id", batchId);
      const ids = (batchBookings || []).map((b) => b.id);
      targetBookingIds = ids;
    }

    if (courseId && courseId !== "all") {
      // Find batches for this course
      const { data: courseBatches } = await adminClient
        .from("cohort_batches")
        .select("id")
        .eq("course_id", courseId);
      const batchIds = (courseBatches || []).map((cb) => cb.id);

      if (batchIds.length > 0) {
        const { data: courseBookings } = await adminClient
          .from("bookings")
          .select("id")
          .in("batch_id", batchIds);
        const courseBookingIds = (courseBookings || []).map((b) => b.id);

        if (targetBookingIds === null) {
          targetBookingIds = courseBookingIds;
        } else {
          // Intersect if both batch and course filters applied
          const setB = new Set(courseBookingIds);
          targetBookingIds = targetBookingIds.filter((id) => setB.has(id));
        }
      } else {
        targetBookingIds = [];
      }
    }

    // 4. Resolve Search Filter across Customer / Booking Reference / Razorpay IDs
    let searchMatchingBookingIds: string[] = [];
    let isSearchActive = false;

    if (search && search.trim()) {
      isSearchActive = true;
      const sanitized = search.trim();

      // Find matching customers
      const { data: matchingCustomers } = await adminClient
        .from("customers")
        .select("id")
        .or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
        .limit(100);

      const customerIds = (matchingCustomers || []).map((c) => c.id);

      // Find matching bookings by reference or customer IDs
      let bookingSearchQuery = adminClient.from("bookings").select("id");
      if (customerIds.length > 0) {
        bookingSearchQuery = bookingSearchQuery.or(
          `booking_reference.ilike.%${sanitized}%,customer_id.in.(${customerIds.join(
            ","
          )})`
        );
      } else {
        bookingSearchQuery = bookingSearchQuery.ilike(
          "booking_reference",
          `%${sanitized}%`
        );
      }

      const { data: matchingBookings } = await bookingSearchQuery.limit(100);
      searchMatchingBookingIds = (matchingBookings || []).map((b) => b.id);
    }

    // 5. Build Payments Query
    let queryBuilder = adminClient
      .from("payments")
      .select(
        `
        id,
        razorpay_order_id,
        razorpay_payment_id,
        amount_paise,
        currency,
        status,
        created_at,
        updated_at,
        booking_id,
        bookings (
          id,
          booking_reference,
          status,
          amount_paise,
          batch_id,
          customers (
            id,
            full_name,
            email
          ),
          cohort_batches (
            id,
            batch_name,
            course_id,
            courses (
              id,
              title
            )
          )
        )
      `,
        { count: "exact" }
      );

    // Filter by Payment Status
    if (status && status !== "all") {
      queryBuilder = queryBuilder.eq("status", status);
    }

    // Filter by Date Range
    if (from && from.trim()) {
      queryBuilder = queryBuilder.gte("created_at", `${from.trim()}T00:00:00.000Z`);
    }
    if (to && to.trim()) {
      queryBuilder = queryBuilder.lte("created_at", `${to.trim()}T23:59:59.999Z`);
    }

    // Apply Course/Batch filter via booking_id
    if (targetBookingIds !== null) {
      if (targetBookingIds.length === 0) {
        // No bookings match the selected batch/course
        return {
          success: true,
          data: {
            payments: [],
            pagination: {
              page,
              limit,
              totalCount: 0,
              totalPages: 1,
              hasPrevious: false,
              hasNext: false,
            },
            summary,
            availableCourses,
            availableBatches,
          },
        };
      }
      queryBuilder = queryBuilder.in("booking_id", targetBookingIds);
    }

    // Apply Search
    if (isSearchActive) {
      const sanitized = search.trim();
      const orClauses: string[] = [
        `razorpay_payment_id.ilike.%${sanitized}%`,
        `razorpay_order_id.ilike.%${sanitized}%`,
      ];
      if (searchMatchingBookingIds.length > 0) {
        orClauses.push(`booking_id.in.(${searchMatchingBookingIds.join(",")})`);
      }
      queryBuilder = queryBuilder.or(orClauses.join(","));
    }

    // Order and Paginate
    queryBuilder = queryBuilder
      .order("created_at", { ascending: false })
      .range(fromIndex, toIndex);

    const { data: paymentsData, count, error } = await queryBuilder;

    if (error) {
      console.error("Admin Payments Query Error:", error);
      return {
        success: false,
        error: "Failed to retrieve payment records.",
        statusCode: 500,
      };
    }

    const totalCount = count ?? (paymentsData ? paymentsData.length : 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Map payments into sanitized DTOs
    const payments: AdminPaymentListItem[] = (paymentsData || []).map((p: any) => {
      const booking = p.bookings;
      const customer = booking?.customers;
      const batch = booking?.cohort_batches;
      const course = batch?.courses;

      const discrepancy = evaluatePaymentDiscrepancy(
        p.status,
        p.amount_paise,
        booking?.status,
        booking?.amount_paise
      );

      return {
        id: p.id,
        razorpayPaymentId: p.razorpay_payment_id || null,
        razorpayOrderId: p.razorpay_order_id,
        bookingReference: booking?.booking_reference || "N/A",
        bookingId: p.booking_id,
        customerName: customer?.full_name || "Unknown",
        customerEmail: customer?.email || "Unknown",
        courseTitle: course?.title || "Masterclass",
        courseId: course?.id || "",
        batchName: batch?.batch_name || "Active Batch",
        batchId: batch?.id || "",
        amountPaise: p.amount_paise,
        currency: p.currency,
        status: p.status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        bookingStatus: booking?.status || "unknown",
        bookingAmountPaise: booking?.amount_paise ?? p.amount_paise,
        hasDiscrepancy: discrepancy.hasDiscrepancy,
        discrepancyReasons: discrepancy.reasons,
      };
    });

    return {
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasPrevious: page > 1,
          hasNext: page < totalPages,
        },
        summary,
        availableCourses,
        availableBatches,
      },
    };
  } catch (err: any) {
    console.error("getPaymentsList Exception:", err);
    return {
      success: false,
      error: "Internal server error fetching payments.",
      statusCode: 500,
    };
  }
}

/**
 * Retrieves detailed, sanitized payment record for audit inspection.
 * Strips all sensitive credentials (secrets, signatures, raw payload).
 */
export async function getPaymentDetailsById(
  id: string
): Promise<
  | { success: true; data: AdminPaymentDetail }
  | { success: false; error: string; statusCode: number }
> {
  try {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return { success: false, error: "Invalid payment ID format.", statusCode: 400 };
    }

    const adminClient = createAdminClient();

    const { data: payment, error } = await adminClient
      .from("payments")
      .select(
        `
        id,
        razorpay_order_id,
        razorpay_payment_id,
        amount_paise,
        currency,
        status,
        payload_snapshot,
        created_at,
        updated_at,
        booking_id,
        bookings (
          id,
          booking_reference,
          status,
          amount_paise,
          currency,
          created_at,
          expires_at,
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
            courses (
              id,
              title,
              slug
            )
          )
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("getPaymentDetailsById query error:", error);
      return { success: false, error: "Failed to load payment detail.", statusCode: 500 };
    }

    if (!payment) {
      return { success: false, error: "Payment record not found.", statusCode: 404 };
    }

    const booking = payment.bookings as any;
    const customer = booking?.customers;
    const batch = booking?.cohort_batches;
    const course = batch?.courses;

    // Sanitize payload snapshot: extract only safe diagnostics
    const snapshot = payment.payload_snapshot as any;
    const failureReason =
      payment.status === "failed"
        ? snapshot?.error?.description ||
          snapshot?.error_description ||
          snapshot?.description ||
          null
        : snapshot?.error?.description || null;

    const providerPaymentMethod = snapshot?.method || null;

    let acquirerData: {
      rrn?: string;
      bankTransactionId?: string;
      upiTransactionId?: string;
    } | null = null;

    if (snapshot?.acquirer_data && typeof snapshot.acquirer_data === "object") {
      acquirerData = {
        rrn: snapshot.acquirer_data.rrn || undefined,
        bankTransactionId: snapshot.acquirer_data.bank_transaction_id || undefined,
        upiTransactionId: snapshot.acquirer_data.upi_transaction_id || undefined,
      };
    }

    const discrepancy = evaluatePaymentDiscrepancy(
      payment.status,
      payment.amount_paise,
      booking?.status,
      booking?.amount_paise
    );

    const safeDetail: AdminPaymentDetail = {
      id: payment.id,
      razorpayPaymentId: payment.razorpay_payment_id || null,
      razorpayOrderId: payment.razorpay_order_id,
      amountPaise: payment.amount_paise,
      currency: payment.currency,
      status: payment.status as any,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      failureReason,
      providerPaymentMethod,
      acquirerData,
      booking: {
        id: booking?.id || payment.booking_id,
        bookingReference: booking?.booking_reference || "N/A",
        status: booking?.status || "unknown",
        amountPaise: booking?.amount_paise ?? payment.amount_paise,
        currency: booking?.currency || payment.currency,
        createdAt: booking?.created_at || payment.created_at,
        expiresAt: booking?.expires_at || payment.created_at,
      },
      customer: {
        id: customer?.id || "",
        fullName: customer?.full_name || "Unknown Customer",
        email: customer?.email || "Unknown Email",
        phone: customer?.phone || null,
        whatsappPhone: customer?.whatsapp_phone || null,
      },
      course: {
        id: course?.id || "",
        title: course?.title || "Art & Soul Masterclass",
        slug: course?.slug || "masterclass",
      },
      batch: {
        id: batch?.id || "",
        batchName: batch?.batch_name || "Cohort Batch",
        startDate: batch?.start_date || "",
        startTime: batch?.start_time || "",
        endTime: batch?.end_time || "",
        timezone: batch?.timezone || "Asia/Kolkata",
      },
      reconciliation: {
        hasDiscrepancy: discrepancy.hasDiscrepancy,
        warnings: discrepancy.reasons,
      },
    };

    return { success: true, data: safeDetail };
  } catch (err: any) {
    console.error("getPaymentDetailsById Exception:", err);
    return {
      success: false,
      error: "Internal server error fetching payment detail.",
      statusCode: 500,
    };
  }
}
