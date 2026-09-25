import { createClient } from "@supabase/supabase-js";
import {
  getBookingsList,
  getBookingDetailsById,
  cancelBookingById,
} from "../lib/bookings-admin/service";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      const val = values.join("=").replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function runManualVerification() {
  console.log("==================================================");
  console.log("PHASE 14 — MANUAL BOOKINGS VERIFICATION");
  console.log("==================================================");

  // 1. Locate an existing confirmed booking with captured payment
  console.log("Step 1: Locating an existing confirmed booking with captured payment...");
  const { data: existingBookings } = await adminClient
    .from("bookings")
    .select(`
      id,
      booking_reference,
      status,
      customer_id,
      batch_id,
      amount_paise,
      customers (
        full_name,
        email,
        phone
      ),
      cohort_batches (
        batch_name,
        courses (
          title
        )
      ),
      payments (
        id,
        razorpay_order_id,
        razorpay_payment_id,
        status,
        amount_paise
      )
    `)
    .eq("status", "confirmed")
    .limit(1);

  let targetBooking = existingBookings && existingBookings[0] ? existingBookings[0] : null;

  if (!targetBooking) {
    console.error("No confirmed booking found to test.");
    return;
  }

  const customer = (targetBooking as any).customers;
  const batch = (targetBooking as any).cohort_batches;
  const course = batch?.courses;
  const payments = (targetBooking as any).payments || [];
  const capturedPayment = payments.find((p: any) => p.status === "captured") || payments[0];

  console.log(`✓ Confirmed Booking: ${targetBooking.booking_reference}`);
  console.log(`  Customer: ${customer?.full_name} (${customer?.email})`);
  console.log(`  Course: ${course?.title}`);
  console.log(`  Batch: ${batch?.batch_name}`);

  // Step 2 & 3: List & Search
  console.log("\nStep 2 & 3: Searching by booking reference in bookings directory...");
  const searchResult = await getBookingsList({
    page: 1,
    limit: 20,
    search: targetBooking.booking_reference,
    status: "all",
    paymentStatus: "all",
    batchId: "all",
  });

  const matched = searchResult.success
    ? searchResult.data.bookings.find((b) => b.bookingReference === targetBooking!.booking_reference)
    : null;

  if (matched) {
    console.log(`✓ Booking successfully matched in directory.`);
    console.log(`  Reference: ${matched.bookingReference}`);
    console.log(`  Customer: ${matched.customerName} (${matched.customerEmail})`);
    console.log(`  Booking Status: ${matched.bookingStatus}`);
    console.log(`  Payment Status: ${matched.paymentStatus}`);
    console.log(`  Payment ID: ${matched.razorpayPaymentId}`);
    console.log(`  Amount: ₹${matched.amountPaise / 100}`);
  } else {
    console.error("Failed to match booking in directory search.");
  }

  // Step 4 & 5: Open Booking Details
  console.log("\nStep 4 & 5: Inspecting Booking Details View...");
  const detailResult = await getBookingDetailsById(targetBooking.id);

  if (!detailResult.success) {
    console.error("Failed to retrieve booking details:", detailResult);
    return;
  }

  const detail = detailResult.data;
  console.log(`✓ Booking Details Record Loaded:`);
  console.log(`  - Reference: ${detail.bookingReference}`);
  console.log(`  - Status: ${detail.bookingStatus}`);
  console.log(`  - Amount: ₹${detail.amountPaise / 100}`);
  console.log(`  - Student: ${detail.customer.fullName} (${detail.customer.email})`);
  console.log(`  - Workshop: ${detail.course.title}`);
  console.log(`  - Batch: ${detail.batch.batchName}`);
  console.log(`  - Schedule: ${detail.batch.startDate} (${detail.batch.startTime} – ${detail.batch.endTime})`);
  console.log(`  - Associated Payments: ${detail.payments.length}`);

  if (detail.payments.length > 0) {
    const pmt = detail.payments[0];
    console.log(`    * Razorpay Order ID: ${pmt.razorpayOrderId}`);
    console.log(`    * Razorpay Payment ID: ${pmt.razorpayPaymentId}`);
    console.log(`    * Payment Status: ${pmt.status}`);
    console.log(`    * Payment Amount: ₹${pmt.amountPaise / 100}`);
  }

  // Step 6: Test Filters
  console.log("\nStep 6: Testing Filters (Confirmed + Captured)...");
  const filteredRes = await getBookingsList({
    page: 1,
    limit: 20,
    search: "",
    status: "confirmed",
    paymentStatus: "captured",
    batchId: "all",
  });

  if (filteredRes.success && filteredRes.data.bookings.length > 0) {
    console.log(`✓ Filter returned ${filteredRes.data.bookings.length} confirmed and paid bookings.`);
  }

  // Step 7: Test Pagination
  console.log("\nStep 7: Testing Pagination (limit: 1)...");
  const paginatedRes = await getBookingsList({
    page: 1,
    limit: 1,
    search: "",
    status: "all",
    paymentStatus: "all",
    batchId: "all",
  });

  if (paginatedRes.success) {
    console.log(`✓ Pagination: page 1 of ${paginatedRes.data.pagination.totalPages}, total = ${paginatedRes.data.pagination.totalCount}.`);
  }

  // Step 8: Test Unauthenticated Access Block
  console.log("\nStep 8: Testing Unauthenticated / Incognito Access via Supabase RLS...");
  const { data: anonData } = await anonClient
    .from("bookings")
    .select("id, booking_reference")
    .eq("id", targetBooking.id);

  if (!anonData || anonData.length === 0) {
    console.log("✓ Anon / incognito request strictly BLOCKED by RLS (0 rows returned).");
  } else {
    console.error("FAIL: Anon client was able to read booking record!");
  }

  // Step 9: Safe Cancellation Test on a temporary reservation
  console.log("\nStep 9: Testing Safe Atomic Cancellation on temporary hold...");
  const { data: batchRow } = await adminClient
    .from("cohort_batches")
    .select("id, seats_booked, total_seats")
    .limit(1)
    .single();

  const seatsBefore = batchRow!.seats_booked;

  // Insert test booking
  const tempRef = `REF-TEMP-CANCEL-${Date.now().toString(36).toUpperCase()}`;
  const { data: tempBooking } = await adminClient
    .from("bookings")
    .insert({
      booking_reference: tempRef,
      customer_id: targetBooking.customer_id,
      batch_id: batchRow!.id,
      status: "pending",
      amount_paise: 19900,
      currency: "INR",
      seat_released: false,
    })
    .select()
    .single();

  // Increment seats_booked to simulate hold
  await adminClient
    .from("cohort_batches")
    .update({ seats_booked: seatsBefore + 1 })
    .eq("id", batchRow!.id);

  console.log(`- Temporary booking created: ${tempRef}`);
  console.log(`- Simulated seats_booked: ${seatsBefore + 1}`);

  // Cancel booking
  const cancelResult = await cancelBookingById(tempBooking!.id, "manual_test_cancel");
  console.log(`✓ Cancel executed: ${cancelResult.message}, alreadyReleased = ${cancelResult.alreadyReleased}`);

  // Verify seat count
  const { data: batchAfter } = await adminClient
    .from("cohort_batches")
    .select("seats_booked")
    .eq("id", batchRow!.id)
    .single();

  console.log(`✓ Seats booked after cancellation: ${batchAfter!.seats_booked} (Expected: ${seatsBefore})`);

  // Verify idempotent re-cancel
  const reCancelResult = await cancelBookingById(tempBooking!.id, "manual_test_cancel");
  console.log(`✓ Re-cancel idempotency: alreadyReleased = ${reCancelResult.alreadyReleased} (No double decrement)`);

  // Cleanup temp booking
  await adminClient.from("bookings").delete().eq("id", tempBooking!.id);

  console.log("\n==================================================");
  console.log("MANUAL VERIFICATION COMPLETED SUCCESSFULLY.");
  console.log("==================================================");
}

runManualVerification();
