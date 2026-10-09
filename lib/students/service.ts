import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { StudentListQuery } from "@/lib/validations/student";

export interface EnrolledCourseInfo {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  batchName: string;
  bookingReference: string;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "refunded";
  paymentStatus: string | null;
  amountPaise: number;
  currency: string;
  createdAt: string;
}

export interface StudentListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  whatsappPhone: string | null;
  totalBookings: number;
  confirmedBookings: number;
  enrolledCourses: EnrolledCourseInfo[];
  latestCourseTitle: string | null;
  latestBookingReference: string | null;
  latestBookingStatus: string | null;
  latestPaymentStatus: string | null;
  latestAmountPaise: number;
  latestCurrency: string;
  latestBookingDate: string | null;
  createdAt: string;
}

export interface CourseCategorySummary {
  id: string;
  slug: string;
  title: string;
  studentCount: number;
}

export interface StudentListSummary {
  totalStudents: number;
  masterclassStudents: number;
  foundationStudents: number;
  artistryStudents: number;
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
  summary: StudentListSummary;
  courses: CourseCategorySummary[];
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
 * Retrieves paginated, searchable, and filtered list of registered students categorized by course.
 */
export async function getStudentsList(
  query: StudentListQuery
): Promise<{ success: true; data: StudentListResult } | { success: false; error: string; statusCode: number }> {
  try {
    const adminClient = createAdminClient();
    const { page, limit, search, status, paymentStatus, courseId } = query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 1. Fetch all authoritative courses from Supabase dynamically
    const { data: dbCourses, error: coursesErr } = await adminClient
      .from("courses")
      .select("id, slug, title")
      .order("created_at", { ascending: true });

    if (coursesErr) {
      console.error("Error retrieving courses for students directory:", coursesErr);
    }

    // 2. Fetch overall customers count and booking enrollments to calculate summary counts
    const [{ count: totalCustomerCount }, { data: allEnrollments }] = await Promise.all([
      adminClient.from("customers").select("*", { count: "exact", head: true }),
      adminClient.from("bookings").select("customer_id, cohort_batches(course_id)")
    ]);

    const courseCustomerMap: Record<string, Set<string>> = {};
    (dbCourses || []).forEach((c) => {
      courseCustomerMap[c.id] = new Set<string>();
    });

    (allEnrollments || []).forEach((item: any) => {
      const cId = item.customer_id;
      const bCourseId = item.cohort_batches?.course_id;
      if (cId && bCourseId && courseCustomerMap[bCourseId]) {
        courseCustomerMap[bCourseId].add(cId);
      }
    });

    const courseCategories: CourseCategorySummary[] = (dbCourses || []).map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      studentCount: courseCustomerMap[c.id]?.size || 0,
    }));

    // Identify 3 standard courses for the top metric cards
    const masterclassCourse = (dbCourses || []).find(
      (c) =>
        c.id === "11111111-1111-1111-1111-111111111111" ||
        c.slug === "the-watercolour" ||
        c.slug.includes("roadmap") ||
        c.title.toLowerCase().includes("masterclass")
    );
    const foundationCourse = (dbCourses || []).find(
      (c) =>
        c.id === "e1111111-2222-3333-4444-555555555555" ||
        c.slug === "watercolour-foundation"
    );
    const artistryCourse = (dbCourses || []).find(
      (c) =>
        c.id === "e2222222-2222-3333-4444-555555555555" ||
        c.slug === "watercolour-artistry-foundation"
    );

    const summary: StudentListSummary = {
      totalStudents: totalCustomerCount || 0,
      masterclassStudents: masterclassCourse ? (courseCustomerMap[masterclassCourse.id]?.size || 0) : 0,
      foundationStudents: foundationCourse ? (courseCustomerMap[foundationCourse.id]?.size || 0) : 0,
      artistryStudents: artistryCourse ? (courseCustomerMap[artistryCourse.id]?.size || 0) : 0,
    };

    // 3. Build PostgREST query with appropriate inner/outer joins
    const hasCourseFilter = courseId && courseId !== "all";
    const hasStatusFilter = status && status !== "all";
    const hasPaymentFilter = paymentStatus && paymentStatus !== "all";

    let bookingSelector = "bookings";
    if (hasCourseFilter || hasStatusFilter || hasPaymentFilter) {
      bookingSelector = "bookings!inner";
    }

    let batchSelector = "cohort_batches";
    if (hasCourseFilter) {
      batchSelector = "cohort_batches!inner";
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
          currency,
          created_at,
          batch:${batchSelector} (
            id,
            course_id,
            batch_name,
            course:courses (
              id,
              slug,
              title
            )
          ),
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

    // Course filter
    if (hasCourseFilter) {
      supabaseQuery = supabaseQuery.eq("bookings.batch.course_id", courseId);
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
      const rawBookings = Array.isArray(row.bookings) ? [...row.bookings] : [];

      // Sort bookings by created_at desc to find latest
      rawBookings.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const enrolledCourses: EnrolledCourseInfo[] = rawBookings.map((b: any) => {
        const course = b.batch?.course;
        const paymentsList = Array.isArray(b.payments) ? [...b.payments] : [];
        paymentsList.sort(
          (p1, p2) => new Date(p2.created_at).getTime() - new Date(p1.created_at).getTime()
        );
        const latestPaymentStatus = paymentsList[0]?.status || null;

        return {
          courseId: course?.id || b.batch?.course_id || "",
          courseSlug: course?.slug || "",
          courseTitle: course?.title || b.batch?.batch_name || "Workshop Course",
          batchName: b.batch?.batch_name || "Upcoming Batch",
          bookingReference: b.booking_reference,
          bookingStatus: b.status,
          paymentStatus: latestPaymentStatus,
          amountPaise: b.amount_paise,
          currency: b.currency || "INR",
          createdAt: b.created_at,
        };
      });

      const latestBooking = rawBookings[0] || null;
      const latestCourse = latestBooking?.batch?.course;
      let latestPaymentStatus: string | null = null;

      if (latestBooking && Array.isArray(latestBooking.payments) && latestBooking.payments.length > 0) {
        const sortedPayments = [...latestBooking.payments].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        latestPaymentStatus = sortedPayments[0]?.status || null;
      }

      const totalBookings = rawBookings.length;
      const confirmedBookings = rawBookings.filter((b) => b.status === "confirmed").length;

      return {
        id: row.id,
        fullName: row.full_name || "Valued Student",
        email: row.email,
        phone: row.phone || null,
        whatsappPhone: row.whatsapp_phone || null,
        totalBookings,
        confirmedBookings,
        enrolledCourses,
        latestCourseTitle: latestCourse?.title || null,
        latestBookingReference: latestBooking?.booking_reference || null,
        latestBookingStatus: latestBooking?.status || null,
        latestPaymentStatus,
        latestAmountPaise: latestBooking?.amount_paise || 0,
        latestCurrency: latestBooking?.currency || "INR",
        latestBookingDate: latestBooking?.created_at || null,
        createdAt: row.created_at,
      };
    });

    return {
      success: true,
      data: {
        students,
        summary,
        courses: courseCategories,
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
