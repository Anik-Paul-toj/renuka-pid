import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { StudentListQuery } from "@/lib/validations/student";

export interface StudentListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  whatsappPhone: string | null;
  totalBookings: number;
  confirmedBookings: number;
  latestBookingDate: string | null;
  latestBookingStatus: string | null;
  latestPaymentStatus: string | null;
  createdAt: string;
}

export interface StudentBookingDetail {
  id: string;
  bookingReference: string;
  courseTitle: string;
  batchName: string;
  startDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  status: "pending" | "confirmed" | "cancelled" | "refunded";
  amountPaise: number;
  currency: string;
  seatReleased: boolean;
  createdAt: string;
  latestPaymentStatus: string | null;
  payments: Array<{
    id: string;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    amountPaise: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

export interface StudentDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  whatsappPhone: string | null;
  createdAt: string;
  updatedAt: string;
  totalBookings: number;
  confirmedBookings: number;
  bookings: StudentBookingDetail[];
}

export interface StudentListResult {
  students: StudentListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

/**
 * Retrieves paginated, searchable, and filtered list of registered students.
 */
export async function getStudentsList(
  query: StudentListQuery
): Promise<{ success: true; data: StudentListResult } | { success: false; error: string; statusCode: number }> {
  try {
    const adminClient = createAdminClient();
    const { page, limit, search, status, paymentStatus } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build PostgREST query
    const hasStatusFilter = status && status !== "all";
    const hasPaymentFilter = paymentStatus && paymentStatus !== "all";

    // Formulate joined relation selector
    let bookingSelector = "bookings";
    if (hasStatusFilter || hasPaymentFilter) {
      bookingSelector = "bookings!inner";
    }

    let paymentSelector = "payments";
    if (hasPaymentFilter) {
      paymentSelector = "payments!inner";
    }

    let supabaseQuery = adminClient
      .from("customers")
      .select(
        `
        id,
        full_name,
        email,
        phone,
        whatsapp_phone,
        created_at,
        ${bookingSelector} (
          id,
          booking_reference,
          status,
          amount_paise,
          created_at,
          ${paymentSelector} (
            id,
            razorpay_order_id,
            razorpay_payment_id,
            status,
            amount_paise,
            created_at
          )
        )
      `,
        { count: "exact" }
      );

    // Search filter across name, email, phone, whatsapp
    if (search && search.trim()) {
      const sanitized = search.trim();
      supabaseQuery = supabaseQuery.or(
        `full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,whatsapp_phone.ilike.%${sanitized}%`
      );
    }

    // Status filter on booking status
    if (hasStatusFilter) {
      supabaseQuery = supabaseQuery.eq("bookings.status", status);
    }

    // Payment status filter
    if (hasPaymentFilter) {
      supabaseQuery = supabaseQuery.eq("bookings.payments.status", paymentStatus);
    }

    // Order and paginate
    supabaseQuery = supabaseQuery
      .order("created_at", { ascending: false })
      .range(from, to);

    const { data: rows, count, error } = await supabaseQuery;

    if (error) {
      console.error("Error querying students list:", error);
      return {
        success: false,
        error: "Failed to retrieve students records.",
        statusCode: 500,
      };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const students: StudentListItem[] = (rows || []).map((row: any) => {
      const bookingsList = Array.isArray(row.bookings) ? [...row.bookings] : [];

      // Sort bookings by created_at desc to find latest
      bookingsList.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const latestBooking = bookingsList[0] || null;
      let latestPaymentStatus: string | null = null;

      if (latestBooking && Array.isArray(latestBooking.payments) && latestBooking.payments.length > 0) {
        const sortedPayments = [...latestBooking.payments].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        latestPaymentStatus = sortedPayments[0]?.status || null;
      }

      const totalBookings = bookingsList.length;
      const confirmedBookings = bookingsList.filter((b) => b.status === "confirmed").length;

      return {
        id: row.id,
        fullName: row.full_name || "Valued Student",
        email: row.email,
        phone: row.phone || null,
        whatsappPhone: row.whatsapp_phone || null,
        totalBookings,
        confirmedBookings,
        latestBookingDate: latestBooking?.created_at || null,
        latestBookingStatus: latestBooking?.status || null,
        latestPaymentStatus,
        createdAt: row.created_at,
      };
    });

    return {
      success: true,
      data: {
        students,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasPrevious: page > 1,
          hasNext: page < totalPages,
        },
      },
    };
  } catch (err: any) {
    console.error("Unexpected error in getStudentsList:", err);
    return {
      success: false,
      error: "Internal server error querying student records.",
      statusCode: 500,
    };
  }
}

/**
 * Retrieves comprehensive details for a specific student, including booking and payment history.
 * Ensures zero sensitive credentials (signatures, webhook secrets, service role keys) are exposed.
 */
export async function getStudentById(
  studentId: string
): Promise<{ success: true; data: StudentDetail } | { success: false; error: string; statusCode: number }> {
  try {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);

    if (!isUUID) {
      return {
        success: false,
        error: "Invalid student identifier format.",
        statusCode: 404,
      };
    }

    const adminClient = createAdminClient();

    const { data: customer, error } = await adminClient
      .from("customers")
      .select(
        `
        id,
        full_name,
        email,
        phone,
        whatsapp_phone,
        created_at,
        updated_at,
        bookings (
          id,
          booking_reference,
          status,
          amount_paise,
          currency,
          seat_released,
          created_at,
          expires_at,
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
        )
      `
      )
      .eq("id", studentId)
      .maybeSingle();

    if (error) {
      console.error("Error retrieving student by ID:", error);
      return {
        success: false,
        error: "Failed to retrieve student record.",
        statusCode: 500,
      };
    }

    if (!customer) {
      return {
        success: false,
        error: "Student record not found.",
        statusCode: 404,
      };
    }

    const rawBookings = Array.isArray(customer.bookings) ? [...customer.bookings] : [];

    // Sort bookings descending by creation date
    rawBookings.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const formattedBookings: StudentBookingDetail[] = rawBookings.map((b: any) => {
      const batch = b.cohort_batches;
      const course = batch?.courses;
      const paymentsList = Array.isArray(b.payments) ? [...b.payments] : [];

      // Sort payments by creation date desc
      paymentsList.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const latestPaymentStatus = paymentsList[0]?.status || null;

      // Extract safe payment details only - zero signatures or raw snapshots
      const safePayments = paymentsList.map((p: any) => ({
        id: p.id,
        razorpayOrderId: p.razorpay_order_id,
        razorpayPaymentId: p.razorpay_payment_id || null,
        amountPaise: p.amount_paise,
        currency: p.currency,
        status: p.status,
        createdAt: p.created_at,
      }));

      return {
        id: b.id,
        bookingReference: b.booking_reference,
        courseTitle: course?.title || "Masterclass",
        batchName: batch?.batch_name || "Upcoming Batch",
        startDate: batch?.start_date || "",
        startTime: batch?.start_time || "",
        endTime: batch?.end_time || "",
        timezone: batch?.timezone || "Asia/Kolkata",
        status: b.status,
        amountPaise: b.amount_paise,
        currency: b.currency,
        seatReleased: b.seat_released,
        createdAt: b.created_at,
        latestPaymentStatus,
        payments: safePayments,
      };
    });

    const confirmedCount = formattedBookings.filter((b) => b.status === "confirmed").length;

    const studentDetail: StudentDetail = {
      id: customer.id,
      fullName: customer.full_name || "Valued Student",
      email: customer.email,
      phone: customer.phone || null,
      whatsappPhone: customer.whatsapp_phone || null,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      totalBookings: formattedBookings.length,
      confirmedBookings: confirmedCount,
      bookings: formattedBookings,
    };

    return {
      success: true,
      data: studentDetail,
    };
  } catch (err: any) {
    console.error("Unexpected error in getStudentById:", err);
    return {
      success: false,
      error: "Internal error retrieving student details.",
      statusCode: 500,
    };
  }
}
