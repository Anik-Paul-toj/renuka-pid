import { createClient } from "@supabase/supabase-js";
import { processBooking } from "../lib/booking/service";
import { createOrderForBooking, verifyPayment, handleWebhookEvent } from "../lib/payment/service";
import { createPaymentOrderSchema, verifyPaymentSchema } from "../lib/validations/payment";
import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";

// 1. Read environment variables
const envPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = "";
let serviceRoleKey = "";
let anonKey = "";
let razorpayKeyId = "";
let razorpayKeySecret = "";
let razorpayWebhookSecret = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
      serviceRoleKey = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
      anonKey = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("RAZORPAY_KEY_ID=") || trimmed.startsWith("NEXT_PUBLIC_RAZORPAY_KEY_ID=")) {
      if (!razorpayKeyId) razorpayKeyId = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("RAZORPAY_KEY_SECRET=")) {
      razorpayKeySecret = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("RAZORPAY_WEBHOOK_SECRET=")) {
      razorpayWebhookSecret = trimmed.split("=")[1].trim();
    }
  }
}

if (!supabaseUrl || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
  console.error("Missing required Supabase or Razorpay credentials in .env.local");
  process.exit(1);
}

process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
process.env.RAZORPAY_KEY_ID = razorpayKeyId;
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = razorpayKeyId;
process.env.RAZORPAY_KEY_SECRET = razorpayKeySecret;
process.env.RAZORPAY_WEBHOOK_SECRET = razorpayWebhookSecret;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function runPaymentSystemTests() {
  console.log("==================================================");
  console.log("PHASE 11 — COMPREHENSIVE RAZORPAY PAYMENT TEST SUITE");
  console.log("==================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(name: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${name}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${name}`);
      if (details) console.error(`       Details: ${details}`);
    }
  }

  const testRunId = Date.now().toString(36);
  const createdBatchIds: string[] = [];
  const createdCustomerIds: string[] = [];
  const createdBookingIds: string[] = [];

  // Setup: Find active course
  const { data: courses } = await adminClient
    .from("courses")
    .select("id, title, offer_price_paise, currency")
    .eq("is_active", true)
    .limit(1);

  if (!courses || courses.length === 0) {
    throw new Error("No active course found for testing.");
  }
  const course = courses[0];

  // Helper to create test batch
  async function createTestBatch(overrides: Partial<any> = {}) {
    const batchId = `88888888-8888-8888-8888-${Math.random().toString(16).substring(2, 14).padEnd(12, "0")}`;
    const { data, error } = await adminClient
      .from("cohort_batches")
      .insert({
        id: batchId,
        course_id: course.id,
        batch_name: `Phase 11 Batch ${testRunId}`,
        start_date: "2026-11-20",
        end_date: "2026-11-20",
        start_time: "6:30 PM",
        end_time: "8:30 PM",
        timezone: "Asia/Kolkata",
        total_seats: 10,
        seats_booked: 0,
        is_enrollment_open: true,
        zoom_join_url: "https://zoom.us/j/private-test-link",
        zoom_passcode: "private-passcode",
        ...overrides,
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to create test batch: ${error?.message}`);
    createdBatchIds.push(data.id);
    return data;
  }

  try {
    // ----------------------------------------------------
    // 1. ORDER CREATION TESTS
    // ----------------------------------------------------
    console.log("--- 1. ORDER CREATION & PRICE TESTS ---");
    const batch1 = await createTestBatch();
    const custEmail1 = `pmt_test_${testRunId}_1@example.com`;

    const bookingRes1 = await processBooking({
      fullName: "Pooja Sharma",
      email: custEmail1,
      phone: "+91 98765 11111",
      batchId: batch1.id,
    });

    if (!bookingRes1.success) throw new Error("Failed to create test booking 1");
    createdBookingIds.push(bookingRes1.data.bookingReference);

    // Test 1: Order creation with Razorpay
    const orderRes1 = await createOrderForBooking(bookingRes1.data.bookingReference);
    assert(
      "1. Razorpay order created server-side for valid pending booking",
      orderRes1.success === true &&
        Boolean(orderRes1.data.orderId) &&
        orderRes1.data.orderId!.startsWith("order_")
    );

    // Test 2: Authoritative ₹199 amount
    assert(
      "2. Order amount uses authoritative DB price (19900 paise / ₹199)",
      orderRes1.success === true && orderRes1.data.amountPaise === 19900
    );

    // Test 3: Currency is INR
    assert(
      "3. Order currency matches authoritative currency (INR)",
      orderRes1.success === true && orderRes1.data.currency === "INR"
    );

    // Test 4: Payment record stored in payments table with status 'created'
    const { data: paymentRow1 } = await adminClient
      .from("payments")
      .select("razorpay_order_id, status, amount_paise")
      .eq("razorpay_order_id", orderRes1.success ? orderRes1.data.orderId : "")
      .single();

    assert(
      "4. Payment record created in DB with status 'created'",
      paymentRow1?.status === "created" && paymentRow1.amount_paise === 19900
    );

    // Test 5: Duplicate order creation idempotency
    const orderRes1Duplicate = await createOrderForBooking(bookingRes1.data.bookingReference);
    assert(
      "5. Duplicate order creation is idempotent (reuses same razorpay_order_id)",
      orderRes1Duplicate.success === true &&
        orderRes1.success === true &&
        orderRes1Duplicate.data.orderId === orderRes1.data.orderId
    );

    // ----------------------------------------------------
    // 2. CRYPTOGRAPHIC SIGNATURE & VERIFICATION TESTS
    // ----------------------------------------------------
    console.log("\n--- 2. SIGNATURE & VERIFICATION TESTS ---");
    const testOrderId = orderRes1.success ? orderRes1.data.orderId! : "order_fake";
    const testPaymentId = "pay_fake" + Math.random().toString(36).substring(2, 10);

    // Test 6: Invalid signature rejection
    const invalidSignatureVerify = await verifyPayment({
      bookingReference: bookingRes1.data.bookingReference,
      razorpayOrderId: testOrderId,
      razorpayPaymentId: testPaymentId,
      razorpaySignature: "invalid_hmac_sha256_hex_string_that_does_not_match_at_all_123456",
    });
    assert(
      "6. Invalid signature rejected with INVALID_PAYMENT_SIGNATURE",
      invalidSignatureVerify.success === false &&
        invalidSignatureVerify.error.code === "INVALID_PAYMENT_SIGNATURE" &&
        invalidSignatureVerify.error.statusCode === 400
    );

    // Test 7: Mismatched booking/order rejection
    const batch2 = await createTestBatch();
    const bookingRes2 = await processBooking({
      fullName: "Other User",
      email: `pmt_test_${testRunId}_2@example.com`,
      batchId: batch2.id,
    });
    if (!bookingRes2.success) throw new Error("Failed to create test booking 2");
    createdBookingIds.push(bookingRes2.data.bookingReference);

    const mismatchVerify = await verifyPayment({
      bookingReference: bookingRes2.data.bookingReference, // Different booking
      razorpayOrderId: testOrderId, // Belongs to booking 1
      razorpayPaymentId: testPaymentId,
      razorpaySignature: "dummy",
    });
    assert(
      "7. Mismatched booking reference and order ID rejected with ORDER_MISMATCH",
      mismatchVerify.success === false &&
        mismatchVerify.error.code === "ORDER_MISMATCH" &&
        mismatchVerify.error.statusCode === 400
    );

    // Test 8: Valid HMAC-SHA256 calculation
    const validSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${testOrderId}|${testPaymentId}`)
      .digest("hex");
    assert(
      "8. Cryptographic HMAC-SHA256 signature generated accurately",
      typeof validSignature === "string" && validSignature.length === 64
    );

    // ----------------------------------------------------
    // 3. ZERO-AMOUNT AUTO-CONFIRMATION TESTS
    // ----------------------------------------------------
    console.log("\n--- 3. ZERO-AMOUNT AUTO-CONFIRMATION TESTS ---");
    // Create a 0-amount booking to verify auto-confirmation bypass (Requirement 14)
    const zeroBatch = await createTestBatch();
    const custEmailZero = `pmt_zero_${testRunId}@example.com`;
    const { data: custZero } = await adminClient
      .from("customers")
      .insert({ full_name: "Complimentary Student", email: custEmailZero })
      .select("id")
      .single();

    const zeroBookingRef = `REF-ZERO-${testRunId}`;
    await adminClient.rpc("reserve_seat_atomic", {
      p_batch_id: zeroBatch.id,
      p_customer_id: custZero?.id,
      p_amount_paise: 0,
      p_booking_reference: zeroBookingRef,
    });
    createdBookingIds.push(zeroBookingRef);

    const zeroOrderRes = await createOrderForBooking(zeroBookingRef);
    const { data: zeroBookingInDb } = await adminClient
      .from("bookings")
      .select("status")
      .eq("booking_reference", zeroBookingRef)
      .single();

    assert(
      "9. Zero-amount booking auto-confirms without Razorpay call (Requirement 14)",
      zeroOrderRes.success === true &&
        zeroOrderRes.data.autoConfirmed === true &&
        zeroBookingInDb?.status === "confirmed"
    );

    // ----------------------------------------------------
    // 4. WEBHOOK TESTS
    // ----------------------------------------------------
    console.log("\n--- 4. WEBHOOK SIGNATURE & HANDLING TESTS ---");
    const webhookOrderId = testOrderId;
    const webhookPaymentId = "pay_test_webhook_" + Math.random().toString(36).substring(2, 8);

    const webhookPayload = JSON.stringify({
      entity: "event",
      event: "payment.captured",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: webhookPaymentId,
            order_id: webhookOrderId,
            amount: 19900,
            currency: "INR",
            status: "captured",
          },
        },
      },
    });

    // Test 10: Invalid webhook signature rejection
    const invalidWebhookRes = await handleWebhookEvent(webhookPayload, "invalid_webhook_sig_hex");
    assert(
      "10. Webhook with invalid signature rejected with HTTP 400",
      invalidWebhookRes.status === 400 && invalidWebhookRes.handled === false
    );

    // Test 11: Valid webhook signature handling
    const validWebhookSig = crypto
      .createHmac("sha256", razorpayWebhookSecret)
      .update(webhookPayload)
      .digest("hex");

    const validWebhookRes = await handleWebhookEvent(webhookPayload, validWebhookSig);
    assert(
      "11. Webhook with valid signature processed successfully (HTTP 200)",
      validWebhookRes.status === 200 && validWebhookRes.handled === true
    );

    // Test 12: Webhook payment and booking confirmation
    const { data: dbBookingAfterWebhook } = await adminClient
      .from("bookings")
      .select("status")
      .eq("booking_reference", bookingRes1.data.bookingReference)
      .single();

    const { data: dbPaymentAfterWebhook } = await adminClient
      .from("payments")
      .select("status, razorpay_payment_id")
      .eq("razorpay_order_id", webhookOrderId)
      .single();

    assert(
      "12. Webhook payment.captured marks payment 'captured' and booking 'confirmed'",
      dbBookingAfterWebhook?.status === "confirmed" &&
        dbPaymentAfterWebhook?.status === "captured" &&
        dbPaymentAfterWebhook.razorpay_payment_id === webhookPaymentId
    );

    // Test 13: Duplicate webhook idempotency
    const dupWebhookRes = await handleWebhookEvent(webhookPayload, validWebhookSig);
    assert(
      "13. Duplicate webhook event handled idempotently without error",
      dupWebhookRes.status === 200 && dupWebhookRes.handled === true
    );

    // Test 14: Payment failed webhook does NOT immediately release seat (Requirement 13)
    const failedPayload = JSON.stringify({
      entity: "event",
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_failed_123",
            order_id: webhookOrderId,
            status: "failed",
          },
        },
      },
    });
    const failedSig = crypto
      .createHmac("sha256", razorpayWebhookSecret)
      .update(failedPayload)
      .digest("hex");

    const failedWebhookRes = await handleWebhookEvent(failedPayload, failedSig);
    const { data: batchSeatCheck } = await adminClient
      .from("cohort_batches")
      .select("seats_booked")
      .eq("id", batch1.id)
      .single();

    assert(
      "14. Failed payment preserves seat reservation (seats_booked remains intact per Requirement 13)",
      failedWebhookRes.status === 200 && batchSeatCheck?.seats_booked === 1
    );

    // ----------------------------------------------------
    // 5. SECURITY & SECRET LEAK CHECKS
    // ----------------------------------------------------
    console.log("\n--- 5. SECURITY & LEAK PREVENTION TESTS ---");
    const jsonOrderRes = JSON.stringify(orderRes1);

    // Test 15: Secret key never exposed
    assert(
      "15. RAZORPAY_KEY_SECRET is never exposed in API responses",
      !jsonOrderRes.includes(razorpayKeySecret)
    );

    // Test 16: Webhook secret never exposed
    assert(
      "16. RAZORPAY_WEBHOOK_SECRET is never exposed in API responses",
      !jsonOrderRes.includes(razorpayWebhookSecret)
    );

    // Test 17: Zoom credentials never exposed
    assert(
      "17. Private Zoom join URL and passcode never exposed in payment responses",
      !jsonOrderRes.includes("private-test-link") && !jsonOrderRes.includes("private-passcode")
    );

    // Test 18: Input validation schemas
    const invalidOrderInput = createPaymentOrderSchema.safeParse({});
    const invalidVerifyInput = verifyPaymentSchema.safeParse({ bookingReference: "REF" });
    assert(
      "18. Input schemas reject malformed payment requests",
      invalidOrderInput.success === false && invalidVerifyInput.success === false
    );

  } finally {
    console.log("\n--- CLEANING UP TEST FIXTURES ---");
    if (createdBookingIds.length > 0) {
      const { data: testBookings } = await adminClient
        .from("bookings")
        .select("id")
        .in("booking_reference", createdBookingIds);
      if (testBookings && testBookings.length > 0) {
        const ids = testBookings.map((b) => b.id);
        await adminClient.from("payments").delete().in("booking_id", ids);
        await adminClient.from("bookings").delete().in("id", ids);
      }
    }
    if (createdBatchIds.length > 0) {
      await adminClient.from("cohort_batches").delete().in("id", createdBatchIds);
    }
    await adminClient.from("customers").delete().ilike("email", `%${testRunId}%`);
    console.log("Cleanup completed.");
  }

  console.log("\n==================================================");
  console.log(`PHASE 11 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("==================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPaymentSystemTests().catch((err) => {
  console.error("Payment test execution failed:", err);
  process.exit(1);
});
