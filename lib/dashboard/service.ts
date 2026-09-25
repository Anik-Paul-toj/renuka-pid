import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DashboardMetrics {
  totalStudents: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalCapturedRevenuePaise: number;
  upcomingBatch: {
    id: string;
    courseTitle: string;
    batchName: string;
    startDate: string;
    totalSeats: number;
    seatsBooked: number;
    seatsRemaining: number;
  } | null;
  failedNotificationsCount: number;
  recentBookings: Array<{
    id: string;
    bookingReference: string;
    customerName: string;
    customerEmail: string;
    batchName: string;
    status: string;
    amountPaise: number;
    createdAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    razorpayPaymentId: string | null;
    bookingReference: string;
    amountPaise: number;
    status: string;
    createdAt: string;
  }>;
  recentFailedNotifications: Array<{
    id: string;
    customerEmail: string;
    channel: string;
    messageType: string;
    errorMessage: string;
    createdAt: string;
  }>;
}

/**
 * Retrieves authoritative real-time metrics for the admin dashboard.
 * All monetary calculations use strict integer paise arithmetic.
 * Never exposes secrets or client-side tokens.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const adminClient = createAdminClient();

  const [
    { count: totalStudents },
    { count: confirmedBookings },
    { count: pendingBookings },
    { data: paymentsData },
    { data: batchRow },
    { data: recentBookingsData },
    { data: recentPaymentsData },
    { count: failedLogsCount, data: failedLogsData },
  ] = await Promise.all([
    adminClient.from("customers").select("id", { count: "exact", head: true }),
    adminClient.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    adminClient.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("payments").select("amount_paise").eq("status", "captured"),
    adminClient
      .from("cohort_batches")
      .select("id, batch_name, start_date, total_seats, seats_booked, courses(title)")
      .eq("is_enrollment_open", true)
      .order("start_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    adminClient
      .from("bookings")
      .select("id, booking_reference, status, amount_paise, created_at, customers(full_name, email), cohort_batches(batch_name)")
      .order("created_at", { ascending: false })
      .limit(5),
    adminClient
      .from("payments")
      .select("id, razorpay_payment_id, status, amount_paise, created_at, bookings(booking_reference)")
      .order("created_at", { ascending: false })
      .limit(5),
    adminClient
      .from("notification_logs")
      .select("id, channel, message_type, status, error_message, created_at, customers(full_name, email)", { count: "exact" })
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  // Integer paise accumulation
  const totalCapturedRevenuePaise = (paymentsData || []).reduce(
    (acc, p) => acc + (p.amount_paise || 0),
    0
  );

  let upcomingBatch: DashboardMetrics["upcomingBatch"] = null;
  if (batchRow) {
    const coursesRel = Array.isArray(batchRow.courses) ? batchRow.courses[0] : batchRow.courses;
    const courseTitle = coursesRel?.title || "Masterclass";
    const totalSeats = batchRow.total_seats || 0;
    const seatsBooked = batchRow.seats_booked || 0;
    upcomingBatch = {
      id: batchRow.id,
      courseTitle,
      batchName: batchRow.batch_name,
      startDate: batchRow.start_date,
      totalSeats,
      seatsBooked,
      seatsRemaining: Math.max(0, totalSeats - seatsBooked),
    };
  }

  const recentBookings = (recentBookingsData || []).map((b: any) => {
    const cust = Array.isArray(b.customers) ? b.customers[0] : b.customers;
    const batch = Array.isArray(b.cohort_batches) ? b.cohort_batches[0] : b.cohort_batches;
    return {
      id: b.id,
      bookingReference: b.booking_reference,
      customerName: cust?.full_name || "Guest Attendee",
      customerEmail: cust?.email || "N/A",
      batchName: batch?.batch_name || "Upcoming Batch",
      status: b.status,
      amountPaise: b.amount_paise || 0,
      createdAt: b.created_at,
    };
  });

  const recentPayments = (recentPaymentsData || []).map((p: any) => {
    const booking = Array.isArray(p.bookings) ? p.bookings[0] : p.bookings;
    return {
      id: p.id,
      razorpayPaymentId: p.razorpay_payment_id || null,
      bookingReference: booking?.booking_reference || "N/A",
      amountPaise: p.amount_paise || 0,
      status: p.status,
      createdAt: p.created_at,
    };
  });

  const recentFailedNotifications = (failedLogsData || []).map((log: any) => {
    const cust = Array.isArray(log.customers) ? log.customers[0] : log.customers;
    return {
      id: log.id,
      customerEmail: cust?.email || "Unknown Recipient",
      channel: log.channel,
      messageType: log.message_type,
      errorMessage: log.error_message || "Delivery failed",
      createdAt: log.created_at,
    };
  });

  return {
    totalStudents: totalStudents || 0,
    confirmedBookings: confirmedBookings || 0,
    pendingBookings: pendingBookings || 0,
    totalCapturedRevenuePaise,
    upcomingBatch,
    failedNotificationsCount: failedLogsCount || 0,
    recentBookings,
    recentPayments,
    recentFailedNotifications,
  };
}
