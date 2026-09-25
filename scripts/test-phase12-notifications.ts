import { createClient } from "@supabase/supabase-js";
import { sendBookingConfirmationEmail } from "../lib/notifications/service";
import { renderBookingConfirmationEmail } from "../lib/notifications/templates";
import { verifyPayment, handleWebhookEvent } from "../lib/payment/service";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
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

// Enable test mock mode for Resend to run automated suite without external email dispatch
process.env.MOCK_RESEND = "true";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, serviceRoleKey);

let passedCount = 0;
let failedCount = 0;

function pass(name: string) {
  passedCount++;
  console.log(`[PASS] Test ${passedCount}: ${name}`);
}

function fail(name: string, error: any) {
  failedCount++;
  console.error(`[FAIL] ${name}:`, error);
}

async function runTests() {
  console.log("==================================================");
  console.log("PHASE 12 — NOTIFICATION & TRANSACTIONAL EMAIL TEST SUITE");
  console.log("==================================================");

  const testIdsToCleanup: {
    customerIds: string[];
    bookingIds: string[];
    paymentIds: string[];
    notificationLogIds: string[];
  } = {
    customerIds: [],
    bookingIds: [],
    paymentIds: [],
    notificationLogIds: [],
  };

  try {
    // Resolve active course and batch for testing
    const { data: batch } = await adminClient
      .from("cohort_batches")
      .select("id, course_id, batch_name, start_date, start_time, end_time, timezone, courses(id, title)")
      .eq("is_enrollment_open", true)
      .limit(1)
      .single();

    if (!batch) {
      throw new Error("No active cohort batch found for tests.");
    }

    // Helper to create test customer
    async function createTestCustomer(emailPrefix: string) {
      const email = `test.${emailPrefix}.${Date.now()}@artstudio.test`;
      const { data: customer, error } = await adminClient
        .from("customers")
        .insert({
          full_name: "Notification Test Student",
          email,
          phone: "+919876543210",
        })
        .select()
        .single();

      if (error || !customer) throw error;
      testIdsToCleanup.customerIds.push(customer.id);
      return customer;
    }

    // Helper to create test booking
    async function createTestBooking(customerId: string, status: "pending" | "confirmed" | "cancelled" = "pending") {
      const ref = `REF-NOTIF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const { data: booking, error } = await adminClient
        .from("bookings")
        .insert({
          booking_reference: ref,
          customer_id: customerId,
          batch_id: batch!.id,
          status,
          amount_paise: 19900,
          currency: "INR",
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error || !booking) throw error;
      testIdsToCleanup.bookingIds.push(booking.id);
      return booking;
    }

    // --------------------------------------------------------------------------
    // 1. CONFIRMED BOOKING TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 1. CONFIRMED BOOKING TESTS ---");
    const cust1 = await createTestCustomer("confirmed");
    const booking1 = await createTestBooking(cust1.id, "confirmed");

    const result1 = await sendBookingConfirmationEmail(booking1.id);
    if (result1.success && result1.providerMessageId && !result1.alreadySent) {
      pass("1. Confirmed booking triggers email notification and receives provider ID");
    } else {
      fail("1. Confirmed booking failed to trigger email", result1);
    }

    // Check notification_logs in database
    const { data: logs1 } = await adminClient
      .from("notification_logs")
      .select("*")
      .eq("booking_id", booking1.id);

    if (logs1 && logs1.length === 1 && logs1[0].status === "sent" && logs1[0].provider_message_id) {
      testIdsToCleanup.notificationLogIds.push(logs1[0].id);
      pass("2. Notification attempt recorded in notification_logs with status 'sent'");
    } else {
      fail("2. notification_logs record missing or invalid", logs1);
    }

    // --------------------------------------------------------------------------
    // 2. STATUS RESTRICTION TESTS (PENDING / CANCELLED / FAILED)
    // --------------------------------------------------------------------------
    console.log("\n--- 2. STATUS RESTRICTION TESTS ---");
    const custPending = await createTestCustomer("pending");
    const bookingPending = await createTestBooking(custPending.id, "pending");

    const pendingResult = await sendBookingConfirmationEmail(bookingPending.id);
    if (!pendingResult.success && pendingResult.code === "BOOKING_NOT_CONFIRMED") {
      pass("3. Pending booking rejected without sending confirmation email");
    } else {
      fail("3. Pending booking should NOT receive confirmation email", pendingResult);
    }

    const custCancelled = await createTestCustomer("cancelled");
    const bookingCancelled = await createTestBooking(custCancelled.id, "cancelled");

    const cancelledResult = await sendBookingConfirmationEmail(bookingCancelled.id);
    if (!cancelledResult.success && cancelledResult.code === "BOOKING_NOT_CONFIRMED") {
      pass("4. Cancelled booking rejected without sending confirmation email");
    } else {
      fail("4. Cancelled booking should NOT receive confirmation email", cancelledResult);
    }

    // --------------------------------------------------------------------------
    // 3. IDEMPOTENCY TESTS (NO DUPLICATE EMAILS)
    // --------------------------------------------------------------------------
    console.log("\n--- 3. IDEMPOTENCY TESTS ---");
    // Call send on already confirmed booking1
    const secondCall = await sendBookingConfirmationEmail(booking1.id);
    if (secondCall.success && secondCall.alreadySent) {
      pass("5. Subsequent call for confirmed booking returns alreadySent = true");
    } else {
      fail("5. Duplicate send was not prevented", secondCall);
    }

    // Check that still exactly 1 log exists for booking1
    const { data: logsBooking1 } = await adminClient
      .from("notification_logs")
      .select("id")
      .eq("booking_id", booking1.id)
      .eq("status", "sent");

    if (logsBooking1 && logsBooking1.length === 1) {
      pass("6. notification_logs contains exactly 1 sent entry (no duplicates created)");
    } else {
      fail("6. Duplicate sent logs found", logsBooking1);
    }

    // --------------------------------------------------------------------------
    // 4. WEBHOOK & VERIFICATION INTEGRATION
    // --------------------------------------------------------------------------
    console.log("\n--- 4. WEBHOOK & VERIFICATION INTEGRATION ---");
    const custWebhook = await createTestCustomer("webhook");
    const bookingWebhook = await createTestBooking(custWebhook.id, "pending");

    const orderId = `order_test_${Date.now()}`;
    const paymentId = `pay_test_${Date.now()}`;

    // Insert pending payment record
    const { data: pmtRecord } = await adminClient
      .from("payments")
      .insert({
        booking_id: bookingWebhook.id,
        razorpay_order_id: orderId,
        amount_paise: 19900,
        currency: "INR",
        status: "created",
      })
      .select()
      .single();

    if (pmtRecord) testIdsToCleanup.paymentIds.push(pmtRecord.id);

    // Simulate payment.captured webhook
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "AnikPaul123";
    const webhookPayload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount: 19900,
            currency: "INR",
            status: "captured",
          },
        },
      },
    });

    const webhookSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");

    const webhookRes = await handleWebhookEvent(webhookPayload, webhookSignature);
    if (webhookRes.handled && webhookRes.status === 200) {
      pass("7. Webhook payment.captured handled and confirmed booking");
    } else {
      fail("7. Webhook handling failed", webhookRes);
    }

    // Allow asynchronous notification dispatch to complete (poll up to 3s for network call)
    let webhookLogs: any[] | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((r) => setTimeout(r, 300));
      const { data } = await adminClient
        .from("notification_logs")
        .select("*")
        .eq("booking_id", bookingWebhook.id);
      if (data && data.length > 0) {
        webhookLogs = data;
        break;
      }
    }

    if (webhookLogs && webhookLogs.length === 1 && webhookLogs[0].status === "sent") {
      testIdsToCleanup.notificationLogIds.push(webhookLogs[0].id);
      pass("8. Webhook payment.captured successfully triggered confirmation email");
    } else {
      fail("8. Webhook notification log missing", webhookLogs);
    }

    // Duplicate webhook delivery test
    const dupWebhookRes = await handleWebhookEvent(webhookPayload, webhookSignature);
    await new Promise((r) => setTimeout(r, 300));

    const { data: afterDupLogs } = await adminClient
      .from("notification_logs")
      .select("id")
      .eq("booking_id", bookingWebhook.id)
      .eq("status", "sent");

    if (afterDupLogs && afterDupLogs.length === 1) {
      pass("9. Duplicate Razorpay webhook did NOT send duplicate confirmation email");
    } else {
      fail("9. Duplicate webhook created duplicate email", afterDupLogs);
    }

    // --------------------------------------------------------------------------
    // 5. FAILURE ISOLATION TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 5. FAILURE ISOLATION TESTS ---");
    const custFail = await createTestCustomer("fail_iso");
    const bookingFail = await createTestBooking(custFail.id, "confirmed");

    // Temporarily trigger delivery failure by setting invalid key
    delete process.env.MOCK_RESEND;
    const originalKey = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "re_invalid_test_key_to_force_failure";

    const failDispatch = await sendBookingConfirmationEmail(bookingFail.id);
    if (!failDispatch.success && failDispatch.code === "DELIVERY_FAILED") {
      pass("10. Delivery failure correctly reported by notification service");
    } else {
      fail("10. Delivery failure was not captured", failDispatch);
    }

    // Verify booking status is STILL confirmed
    const { data: postFailBooking } = await adminClient
      .from("bookings")
      .select("status")
      .eq("id", bookingFail.id)
      .single();

    if (postFailBooking?.status === "confirmed") {
      pass("11. Booking status remains 'confirmed' despite email failure (Failure Isolation)");
    } else {
      fail("11. Email failure incorrectly mutated booking status", postFailBooking);
    }

    // Verify notification_logs has status 'failed'
    const { data: failLogs } = await adminClient
      .from("notification_logs")
      .select("*")
      .eq("booking_id", bookingFail.id);

    if (failLogs && failLogs.length === 1 && failLogs[0].status === "failed") {
      testIdsToCleanup.notificationLogIds.push(failLogs[0].id);
      pass("12. notification_logs records failed delivery with error trace");
    } else {
      fail("12. notification_logs failed entry missing", failLogs);
    }

    // --------------------------------------------------------------------------
    // 6. RETRY AFTER FAILED NOTIFICATION
    // --------------------------------------------------------------------------
    console.log("\n--- 6. RETRY AFTER FAILURE TESTS ---");
    // Restore mock mode
    process.env.MOCK_RESEND = "true";
    process.env.RESEND_API_KEY = originalKey;

    const retryResult = await sendBookingConfirmationEmail(bookingFail.id, { forceRetry: true });
    if (retryResult.success && retryResult.providerMessageId) {
      pass("13. Controlled retry after previous failure succeeds");
    } else {
      fail("13. Controlled retry failed", retryResult);
    }

    const { data: retriedLogs } = await adminClient
      .from("notification_logs")
      .select("id, status, retry_count")
      .eq("booking_id", bookingFail.id)
      .order("created_at", { ascending: false });

    if (retriedLogs && retriedLogs.length === 2 && retriedLogs[0].status === "sent") {
      testIdsToCleanup.notificationLogIds.push(retriedLogs[0].id);
      pass("14. Retry increments log history and records successful delivery");
    } else {
      fail("14. Retry history mismatch", retriedLogs);
    }

    // --------------------------------------------------------------------------
    // 7. PRIVACY & ACCESS LINK SAFETY
    // --------------------------------------------------------------------------
    console.log("\n--- 7. PRIVACY & ACCESS LINK SAFETY ---");
    // Test 1: Null Zoom URL
    const nullZoomEmail = await renderBookingConfirmationEmail({
      customerName: "Safety Test",
      customerEmail: "safety@test.com",
      bookingReference: "REF-SAFE-01",
      courseTitle: "Masterclass Title",
      batchName: "Batch 1",
      startDate: "2026-10-28",
      startTime: "6:30 PM",
      endTime: "8:30 PM",
      timezone: "Asia/Kolkata",
      amountPaise: 19900,
      currency: "INR",
      zoomJoinUrl: null,
      zoomPasscode: null,
    });

    if (
      !nullZoomEmail.text.includes("zoom.us") &&
      !nullZoomEmail.html.includes("zoom.us") &&
      nullZoomEmail.text.includes("prior to the session")
    ) {
      pass("15. Null Zoom URL does NOT invent fake link or expose credentials");
    } else {
      fail("15. Null Zoom URL exposed unexpected link", nullZoomEmail);
    }

    // Test 2: Valid Zoom URL
    const validZoomEmail = await renderBookingConfirmationEmail({
      customerName: "Safety Test",
      customerEmail: "safety@test.com",
      bookingReference: "REF-SAFE-02",
      courseTitle: "Masterclass Title",
      batchName: "Batch 1",
      startDate: "2026-10-28",
      startTime: "6:30 PM",
      endTime: "8:30 PM",
      timezone: "Asia/Kolkata",
      amountPaise: 19900,
      currency: "INR",
      zoomJoinUrl: "https://zoom.us/j/999888777",
      zoomPasscode: "ART123",
    });

    if (
      validZoomEmail.text.includes("https://zoom.us/j/999888777") &&
      validZoomEmail.text.includes("Passcode: ART123")
    ) {
      pass("16. Authoritative Zoom link and passcode rendered accurately when present");
    } else {
      fail("16. Valid Zoom link was not rendered correctly", validZoomEmail);
    }

    // --------------------------------------------------------------------------
    // 8. SECURITY & LEAK PREVENTION
    // --------------------------------------------------------------------------
    console.log("\n--- 8. SECURITY & LEAK PREVENTION ---");
    const hasClientLeakedKey = Object.keys(process.env).some(
      (k) => k.startsWith("NEXT_PUBLIC_") && k.includes("RESEND")
    );
    if (!hasClientLeakedKey) {
      pass("17. RESEND_API_KEY is strictly server-only (no NEXT_PUBLIC_ exposure)");
    } else {
      fail("17. RESEND_API_KEY has NEXT_PUBLIC_ exposure", null);
    }

    // Nonexistent booking test
    const nonexistentRes = await sendBookingConfirmationEmail("REF-DOES-NOT-EXIST");
    if (!nonexistentRes.success && nonexistentRes.code === "BOOKING_NOT_FOUND") {
      pass("18. Nonexistent booking reference safely rejected");
    } else {
      fail("18. Nonexistent booking was not rejected", nonexistentRes);
    }
  } catch (err: any) {
    console.error("Test Suite Fatal Error:", err);
  } finally {
    // Cleanup fixtures
    console.log("\n--- CLEANING UP TEST FIXTURES ---");
    if (testIdsToCleanup.notificationLogIds.length > 0) {
      await adminClient
        .from("notification_logs")
        .delete()
        .in("id", testIdsToCleanup.notificationLogIds);
    }
    if (testIdsToCleanup.paymentIds.length > 0) {
      await adminClient
        .from("payments")
        .delete()
        .in("id", testIdsToCleanup.paymentIds);
    }
    if (testIdsToCleanup.bookingIds.length > 0) {
      await adminClient
        .from("bookings")
        .delete()
        .in("id", testIdsToCleanup.bookingIds);
    }
    if (testIdsToCleanup.customerIds.length > 0) {
      await adminClient
        .from("customers")
        .delete()
        .in("id", testIdsToCleanup.customerIds);
    }
    console.log("Cleanup completed.");
  }

  console.log("\n==================================================");
  console.log(`PHASE 12 TEST SUMMARY: ${passedCount} / ${passedCount + failedCount} TESTS PASSED`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
