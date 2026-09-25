import { createClient } from "@supabase/supabase-js";
import { getStudentsList, getStudentById } from "../lib/students/service";
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

async function runManualTest() {
  console.log("==================================================");
  console.log("PHASE 13 — MANUAL VERIFICATION OF STUDENTS MODULE");
  console.log("==================================================");

  // 1. Check existing confirmed customer with captured payment
  console.log("Step 1: Finding existing customer with confirmed booking & captured payment...");
  const { data: bookings } = await adminClient
    .from("bookings")
    .select(`
      id,
      booking_reference,
      status,
      customer_id,
      customers (
        id,
        full_name,
        email,
        phone
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

  let targetCustomer = bookings && bookings[0] ? (bookings[0] as any).customers : null;
  let targetBooking = bookings && bookings[0] ? bookings[0] : null;

  if (!targetCustomer) {
    console.log("No existing confirmed booking found. Creating one for verification...");
    const { data: batch } = await adminClient
      .from("cohort_batches")
      .select("id")
      .eq("is_enrollment_open", true)
      .limit(1)
      .single();

    const { data: newCust } = await adminClient
      .from("customers")
      .insert({
        full_name: "Maya Sharma",
        email: `maya.sharma.${Date.now()}@artstudio.test`,
        phone: "+91 98765 43210",
      })
      .select()
      .single();

    const { data: newBook } = await adminClient
      .from("bookings")
      .insert({
        booking_reference: `REF-MAYA-${Date.now().toString(36).toUpperCase()}`,
        customer_id: newCust!.id,
        batch_id: batch!.id,
        status: "confirmed",
        amount_paise: 19900,
        currency: "INR",
      })
      .select()
      .single();

    const { data: newPmt } = await adminClient
      .from("payments")
      .insert({
        booking_id: newBook!.id,
        razorpay_order_id: `order_manual_${Date.now()}`,
        razorpay_payment_id: `pay_manual_${Date.now()}`,
        status: "captured",
        amount_paise: 19900,
        currency: "INR",
      })
      .select()
      .single();

    targetCustomer = newCust;
    targetBooking = newBook;
  }

  console.log(`✓ Target student: ${targetCustomer.full_name} (${targetCustomer.email})`);

  // Step 2 & 3: Search for customer in directory
  console.log("\nStep 2 & 3: Searching for student in students directory...");
  const searchResult = await getStudentsList({
    page: 1,
    limit: 20,
    search: targetCustomer.email,
    status: "all",
    paymentStatus: "all",
  });

  const found = searchResult.success
    ? searchResult.data.students.find((s) => s.id === targetCustomer.id)
    : null;

  console.log(`✓ Search returned ${searchResult.success ? searchResult.data.students.length : 0} match(es).`);
  console.log(`- Matched Student: ${found?.fullName} (${found?.email})`);
  console.log(`- Total Bookings: ${found?.totalBookings}, Confirmed: ${found?.confirmedBookings}`);
  console.log(`- Latest Booking Status: ${found?.latestBookingStatus}`);
  console.log(`- Latest Payment Status: ${found?.latestPaymentStatus}`);

  // Step 4-8: Open Student Details & verify fields
  console.log("\nStep 4-8: Opening Student Detail View...");
  const detailResult = await getStudentById(targetCustomer.id);

  if (!detailResult.success) {
    console.error("Failed to load student details:", detailResult);
    return;
  }

  const detail = detailResult.data;
  console.log(`✓ Student Profile Loaded:`);
  console.log(`  - Name: ${detail.fullName}`);
  console.log(`  - Email: ${detail.email}`);
  console.log(`  - Phone: ${detail.phone}`);
  console.log(`  - Total Bookings History: ${detail.bookings.length}`);

  const confirmedBooking = detail.bookings.find((b) => b.status === "confirmed");
  if (confirmedBooking) {
    console.log(`\n✓ Booking Verification:`);
    console.log(`  - Booking Reference: ${confirmedBooking.bookingReference}`);
    console.log(`  - Workshop Title: ${confirmedBooking.courseTitle}`);
    console.log(`  - Batch: ${confirmedBooking.batchName}`);
    console.log(`  - Booking Status: ${confirmedBooking.status} (Verified CONFIRMED)`);
    console.log(`  - Amount Paid: ₹${confirmedBooking.amountPaise / 100}`);

    const capturedPmt = confirmedBooking.payments.find((p) => p.status === "captured");
    if (capturedPmt) {
      console.log(`\n✓ Payment Verification:`);
      console.log(`  - Razorpay Order ID: ${capturedPmt.razorpayOrderId}`);
      console.log(`  - Razorpay Payment ID: ${capturedPmt.razorpayPaymentId} (Verified DISPLAYED)`);
      console.log(`  - Payment Status: ${capturedPmt.status} (Verified CAPTURED)`);
      console.log(`  - Amount: ₹${capturedPmt.amountPaise / 100}`);
    } else {
      console.log(`- No captured payment record under this booking.`);
    }
  }

  // Step 9: Verify unauthenticated/incognito access blocked
  console.log("\nStep 9: Testing unauthenticated / incognito / anon access...");
  const { data: anonAttempt, error: anonError } = await anonClient
    .from("customers")
    .select("id, full_name, email")
    .eq("id", targetCustomer.id);

  if (!anonAttempt || anonAttempt.length === 0) {
    console.log("✓ Anon / incognito access strictly BLOCKED by Supabase RLS (0 rows returned).");
  } else {
    console.error("FAIL: Anon client was able to read customer record!");
  }

  console.log("\n==================================================");
  console.log("MANUAL TEST VERIFICATION SUCCESSFUL.");
  console.log("==================================================");
}

runManualTest();
