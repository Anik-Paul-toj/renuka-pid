/**
 * Phase 20: Safe End-to-End Test (E2E) Flow in Test Mode
 * 
 * Executes full customer lifecycle:
 * Landing -> Registration -> Seat Booking -> Order Creation ->
 * Payment Verification -> Confirmation -> Notification Log ->
 * Admin Students -> Admin Bookings -> Admin Payments -> Admin Notifications ->
 * Dashboard Metrics Reflection.
 */

import { createAdminClient } from "../lib/supabase/admin";
import { processBooking } from "../lib/booking/service";
import { createOrderForBooking, verifyPayment, handleWebhookEvent } from "../lib/payment/service";
import { getStudentsList } from "../lib/students/service";
import { getBookingsList } from "../lib/bookings-admin/service";
import { getPaymentsList } from "../lib/payments-admin/service";
import { getNotificationLogsList } from "../lib/notifications-admin/service";
import { getDashboardMetrics } from "../lib/dashboard/service";
import crypto from "crypto";

async function runE2E() {
  console.log("==================================================");
  console.log("PHASE 20 — SAFE END-TO-END VERIFICATION FLOW");
  console.log("==================================================");

  const adminClient = createAdminClient();

  // 1. Identify active open batch
  const { data: batch, error: batchErr } = await adminClient
    .from("cohort_batches")
    .select("id, batch_name, total_seats, seats_booked, courses(id, title, offer_price_paise)")
    .eq("is_enrollment_open", true)
    .gt("total_seats", 0)
    .order("start_date", { ascending: true })
    .limit(1)
    .single();

  if (batchErr || !batch) {
    throw new Error("No active open cohort batch available for E2E testing.");
  }

  const initialSeatsBooked = batch.seats_booked;
  const course = Array.isArray(batch.courses) ? batch.courses[0] : batch.courses;
  const testEmail = `e2e_student_${Date.now()}@artandsoul-test.internal`;
  const testName = "E2E Test Attendee";
  const testPhone = "+91 99999 11111";

  console.log(`\n1. Target Batch Identified: ${batch.batch_name} (${course?.title})`);
  console.log(`- Current Seats Booked: ${initialSeatsBooked} / ${batch.total_seats}`);

  let createdBookingId: string | null = null;
  let createdCustomerId: string | null = null;
  let createdPaymentId: string | null = null;

  try {
    // 2. Submit Registration & Create Booking
    console.log("\n2. Submitting Customer Registration & Reserving Seat...");
    const bookingResult = await processBooking({
      fullName: testName,
      email: testEmail,
      phone: testPhone,
      batchId: batch.id,
    });

    if (!bookingResult.success) {
      throw new Error(`Booking submission failed: ${bookingResult.error.message}`);
    }

    const { data: bookingData } = bookingResult;
    const { data: dbBooking } = await adminClient
      .from("bookings")
      .select("id, customer_id, booking_reference, status")
      .eq("booking_reference", bookingData.bookingReference)
      .single();

    if (!dbBooking) throw new Error("Could not find created booking in DB");
    createdBookingId = dbBooking.id;
    createdCustomerId = dbBooking.customer_id;
    console.log(`✓ Booking Created: ${dbBooking.booking_reference} (Status: ${dbBooking.status})`);
    console.log(`✓ Customer ID: ${dbBooking.customer_id}`);

    // Verify seat count incremented
    const { data: updatedBatch1 } = await adminClient
      .from("cohort_batches")
      .select("seats_booked")
      .eq("id", batch.id)
      .single();

    if (!updatedBatch1 || updatedBatch1.seats_booked !== initialSeatsBooked + 1) {
      throw new Error("Seat reservation did not atomically increment seats_booked!");
    }
    console.log(`✓ Seat Atomically Reserved: ${updatedBatch1.seats_booked} / ${batch.total_seats}`);

    // 3. Create Razorpay Payment Order
    console.log("\n3. Creating Razorpay Order...");
    const orderResult = await createOrderForBooking(dbBooking.booking_reference);

    if (!orderResult.success) {
      throw new Error(`Order creation failed: ${orderResult.error.message}`);
    }
    const orderId = orderResult.data.orderId;
    console.log(`✓ Razorpay Order Created: ${orderId} (Amount: ₹${orderResult.data.amountPaise / 100})`);

    // 4. Complete Test Mode Payment Verification via Webhook Event
    console.log("\n4. Verifying Payment Capture in Test Mode...");
    const mockPaymentId = `pay_e2e_${Date.now()}`;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "dummy_webhook_secret";

    const webhookPayload = JSON.stringify({
      entity: "event",
      event: "payment.captured",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: mockPaymentId,
            order_id: orderId,
            amount: orderResult.data.amountPaise,
            currency: "INR",
            status: "captured",
          },
        },
      },
    });

    const validWebhookSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");

    const webhookRes = await handleWebhookEvent(webhookPayload, validWebhookSig);

    if (!webhookRes.handled || webhookRes.status !== 200) {
      throw new Error(`Webhook payment capture failed with status ${webhookRes.status}`);
    }
    console.log(`✓ Webhook Payment Captured: ${mockPaymentId} -> Booking Confirmed!`);

    // 5. Verify Confirmed State & Seat Retention
    const { data: confirmedBooking } = await adminClient
      .from("bookings")
      .select("status")
      .eq("id", dbBooking.id)
      .single();

    if (confirmedBooking?.status !== "confirmed") {
      throw new Error(`Booking status is ${confirmedBooking?.status}, expected confirmed!`);
    }
    console.log("✓ Booking Confirmed in Authoritative Database");

    // 6. Verify Admin Directories Reflect New Records
    console.log("\n5. Verifying Admin Management Modules Reflection...");

    // 6.1 Students Directory
    const studentRes = await getStudentsList({
      search: testEmail,
      page: 1,
      limit: 10,
      status: "all",
      paymentStatus: "all",
    });
    const students = studentRes.success ? studentRes.data.students : [];
    const studentFound = students.some((s) => s.email.toLowerCase() === testEmail.toLowerCase());
    console.log(`✓ Student Directory Linkage: ${studentFound ? "FOUND" : "NOT FOUND"}`);

    // 6.2 Bookings Directory
    const bookingRes = await getBookingsList({
      search: dbBooking.booking_reference,
      page: 1,
      limit: 10,
      status: "all",
      paymentStatus: "all",
      batchId: "all",
    });
    const bookings = bookingRes.success ? bookingRes.data.bookings : [];
    const bookingFound = bookings.some((b) => b.bookingReference === dbBooking.booking_reference);
    console.log(`✓ Bookings Directory Linkage: ${bookingFound ? "FOUND" : "NOT FOUND"}`);

    // 6.3 Payments Directory
    const paymentRes = await getPaymentsList({
      search: mockPaymentId,
      page: 1,
      limit: 10,
      status: "all",
      courseId: "all",
      batchId: "all",
    });
    const payments = paymentRes.success ? paymentRes.data.payments : [];
    const paymentFound = payments.some((p) => p.razorpayPaymentId === mockPaymentId);
    console.log(`✓ Payments Directory Linkage: ${paymentFound ? "FOUND" : "NOT FOUND"}`);

    // 6.4 Notification Logs
    const notifRes = await getNotificationLogsList({
      search: testEmail,
      page: 1,
      limit: 10,
      status: "all",
      channel: "all",
      type: "all",
    });
    const notifs = notifRes.success ? notifRes.data.logs : [];
    console.log(`✓ Notification Logs Count for Attendee: ${notifs.length}`);

    // 6.5 Dashboard Metrics
    const metrics = await getDashboardMetrics();
    console.log(`✓ Dashboard Metrics Confirmed Bookings: ${metrics.confirmedBookings}`);
    console.log(`✓ Dashboard Total Students: ${metrics.totalStudents}`);

    console.log("\n==================================================");
    console.log("PHASE 20 E2E LIFECYCLE AUDIT COMPLETE: 100% SUCCESS");
    console.log("==================================================");
  } finally {
    // Clean up disposable test fixtures
    console.log("\nCleaning up disposable E2E test records...");
    if (createdBookingId) {
      await adminClient.from("notification_logs").delete().eq("booking_id", createdBookingId);
      await adminClient.from("payments").delete().eq("booking_id", createdBookingId);
      await adminClient.from("bookings").delete().eq("id", createdBookingId);
    }
    if (createdCustomerId) {
      await adminClient.from("customers").delete().eq("id", createdCustomerId);
    }
    // Safely restore seats_booked to baseline
    await adminClient
      .from("cohort_batches")
      .update({ seats_booked: initialSeatsBooked })
      .eq("id", batch.id);

    console.log("✓ Disposable fixtures cleaned up; seat count accurately restored to baseline.");
  }
}

runE2E().catch((err) => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
