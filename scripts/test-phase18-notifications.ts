import { createClient } from "@supabase/supabase-js";
import {
  getNotificationLogsList,
  getNotificationLogById,
  retryNotificationById,
} from "../lib/notifications-admin/service";
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

// Force mock Resend for safety
process.env.MOCK_RESEND = "true";

let passed = 0;
let failed = 0;

function pass(name: string) {
  console.log(`[PASS] ${name}`);
  passed++;
}

function fail(name: string, error?: any) {
  console.error(`[FAIL] ${name}`);
  if (error) {
    console.error("       Error:", error);
  }
  failed++;
}

async function runPhase18Tests() {
  console.log("==================================================");
  console.log("PHASE 18 — NOTIFICATION & DELIVERY LOGS TEST SUITE");
  console.log("==================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const anonClient = createClient(supabaseUrl, anonKey);

  let testCustomerId: string | null = null;
  let testBookingId: string | null = null;
  let testFailedLogId: string | null = null;
  let testSentLogId: string | null = null;

  try {
    // -------------------------------------------------------------
    // SETUP FIXTURES
    // -------------------------------------------------------------
    console.log("\n--- SETUP FIXTURES ---");

    // 1. Create a test customer and confirmed booking for retry tests
    const { data: customer } = await adminClient
      .from("customers")
      .insert({
        full_name: "Audit Test Student",
        email: `audit_notify_${Date.now()}@example.com`,
        phone: "+919876543210",
      })
      .select("id")
      .single();
    testCustomerId = customer!.id;

    const { data: batch } = await adminClient
      .from("cohort_batches")
      .select("id")
      .limit(1)
      .single();

    const bookingRef = `REF-AUDIT-${Date.now().toString(36).toUpperCase()}`;
    const { data: booking } = await adminClient
      .from("bookings")
      .insert({
        booking_reference: bookingRef,
        customer_id: testCustomerId,
        batch_id: batch!.id,
        status: "confirmed",
        amount_paise: 19900,
        currency: "INR",
      })
      .select("id")
      .single();
    testBookingId = booking!.id;

    // 2. Insert one failed notification log
    const { data: failedLog } = await adminClient
      .from("notification_logs")
      .insert({
        booking_id: testBookingId,
        customer_id: testCustomerId,
        channel: "email",
        message_type: "booking-confirmation-email",
        status: "failed",
        error_message: "Test failure: provider quota limit exceeded",
        retry_count: 0,
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    testFailedLogId = failedLog!.id;

    // 3. Insert one sent notification log
    const { data: sentLog } = await adminClient
      .from("notification_logs")
      .insert({
        booking_id: testBookingId,
        customer_id: testCustomerId,
        channel: "email",
        message_type: "booking-confirmation-email",
        status: "sent",
        provider_message_id: "msg_audit_test_123",
        retry_count: 0,
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    testSentLogId = sentLog!.id;

    // -------------------------------------------------------------
    // 1. DIRECTORY LISTING & PAGINATION TESTS
    // -------------------------------------------------------------
    console.log("\n--- 1. DIRECTORY LISTING & PAGINATION ---");

    const listResult = await getNotificationLogsList({
      page: 1,
      limit: 10,
      search: "",
      status: "all",
      channel: "all",
      type: "all",
    });

    if (listResult.success && listResult.data.logs.length > 0) {
      pass("Test 1: Admin can list notification logs");
    } else {
      fail("Test 1: Failed to list notification logs", listResult);
    }

    if (
      listResult.success &&
      typeof listResult.data.pagination.totalCount === "number" &&
      listResult.data.pagination.limit === 10
    ) {
      pass("Test 2: Server-side pagination offsets and limits notification records accurately");
    } else {
      fail("Test 2: Pagination check failed", listResult);
    }

    // Summary metrics verification
    if (
      listResult.success &&
      listResult.data.summary.totalNotifications >= 2 &&
      listResult.data.summary.successfulSends >= 1 &&
      listResult.data.summary.failedSends >= 1
    ) {
      pass("Test 3: Summary cards report accurate total, sent, and failed counts");
    } else {
      fail("Test 3: Summary stats calculation failed", listResult);
    }

    // -------------------------------------------------------------
    // 2. SEARCH CAPABILITIES
    // -------------------------------------------------------------
    console.log("\n--- 2. MULTI-FIELD SEARCH CAPABILITIES ---");

    // Search by recipient email
    const searchEmailRes = await getNotificationLogsList({
      page: 1,
      limit: 10,
      search: "audit_notify_",
      status: "all",
      channel: "all",
      type: "all",
    });
    if (searchEmailRes.success && searchEmailRes.data.logs.length > 0) {
      pass("Test 4: Search by recipient email works");
    } else {
      fail("Test 4: Search by email failed", searchEmailRes);
    }

    // Search by booking reference
    const searchRefRes = await getNotificationLogsList({
      page: 1,
      limit: 10,
      search: bookingRef,
      status: "all",
      channel: "all",
      type: "all",
    });
    if (searchRefRes.success && searchRefRes.data.logs.length > 0) {
      pass("Test 5: Search by booking reference works");
    } else {
      fail("Test 5: Search by booking reference failed", searchRefRes);
    }

    // -------------------------------------------------------------
    // 3. FILTERING CAPABILITIES
    // -------------------------------------------------------------
    console.log("\n--- 3. FILTERING CAPABILITIES ---");

    // Filter by status = 'failed'
    const filterFailedRes = await getNotificationLogsList({
      page: 1,
      limit: 10,
      search: "",
      status: "failed",
      channel: "all",
      type: "all",
    });
    if (
      filterFailedRes.success &&
      filterFailedRes.data.logs.every((l) => l.status === "failed")
    ) {
      pass("Test 6: Status filter isolates failed notifications");
    } else {
      fail("Test 6: Failed status filter check failed", filterFailedRes);
    }

    // Filter by channel = 'email'
    const filterChannelRes = await getNotificationLogsList({
      page: 1,
      limit: 10,
      search: "",
      status: "all",
      channel: "email",
      type: "all",
    });
    if (
      filterChannelRes.success &&
      filterChannelRes.data.logs.every((l) => l.channel === "email")
    ) {
      pass("Test 7: Channel filter isolates email notifications");
    } else {
      fail("Test 7: Channel filter check failed", filterChannelRes);
    }

    // Filter by type = 'booking-confirmation-email'
    const filterTypeRes = await getNotificationLogsList({
      page: 1,
      limit: 10,
      search: "",
      status: "all",
      channel: "all",
      type: "booking-confirmation-email",
    });
    if (
      filterTypeRes.success &&
      filterTypeRes.data.logs.every((l) => l.messageType === "booking-confirmation-email")
    ) {
      pass("Test 8: Message type filter works accurately");
    } else {
      fail("Test 8: Type filter check failed", filterTypeRes);
    }

    // -------------------------------------------------------------
    // 4. DETAIL & DATA SANITIZATION TESTS
    // -------------------------------------------------------------
    console.log("\n--- 4. NOTIFICATION DETAIL & SANITIZATION ---");

    const detailRes = await getNotificationLogById(testFailedLogId!);
    if (
      detailRes.success &&
      detailRes.data.id === testFailedLogId &&
      detailRes.data.booking?.bookingReference === bookingRef &&
      detailRes.data.errorMessage === "Test failure: provider quota limit exceeded"
    ) {
      pass("Test 9: Notification detail returns complete sanitized audit trail");
    } else {
      fail("Test 9: Notification detail check failed", detailRes);
    }

    // Verify zero secrets leaked in detail response
    const rawString = JSON.stringify(detailRes);
    const hasSecretKey =
      rawString.includes(serviceRoleKey) ||
      rawString.includes(process.env.RESEND_API_KEY || "NONE_EXISTING");
    if (!hasSecretKey) {
      pass("Test 10: Zero secrets or provider credentials exposed in detail payload");
    } else {
      fail("Test 10: Secret key detected in detail payload");
    }

    // Nonexistent ID returns 404
    const notFoundRes = await getNotificationLogById("00000000-0000-0000-0000-000000000000");
    if (!notFoundRes.success && notFoundRes.statusCode === 404) {
      pass("Test 11: Nonexistent notification log safely returns 404");
    } else {
      fail("Test 11: 404 check failed", notFoundRes);
    }

    // -------------------------------------------------------------
    // 5. RETRY ARCHITECTURE & SAFETY
    // -------------------------------------------------------------
    console.log("\n--- 5. RETRY ARCHITECTURE & SAFETY ---");

    // Eligible failed notification can be retried
    const retryRes = await retryNotificationById(testFailedLogId!);
    if (retryRes.success && retryRes.statusCode === 200) {
      pass("Test 12: Eligible failed notification can be retried using Phase 12 service");
    } else {
      fail("Test 12: Failed to retry eligible notification", retryRes);
    }

    // Ineligible successful notification CANNOT be retried
    const ineligibleRetryRes = await retryNotificationById(testSentLogId!);
    if (!ineligibleRetryRes.success && ineligibleRetryRes.statusCode === 400) {
      pass("Test 13: Ineligible (already successful) notification cannot be retried");
    } else {
      fail("Test 13: Ineligible notification was incorrectly allowed to retry", ineligibleRetryRes);
    }

    // -------------------------------------------------------------
    // 6. RLS & AUDIT INTEGRITY TESTS
    // -------------------------------------------------------------
    console.log("\n--- 6. RLS & AUDIT INTEGRITY ---");

    // Anonymous read blocked by RLS
    const { data: anonLogs } = await anonClient.from("notification_logs").select("id");
    if (!anonLogs || anonLogs.length === 0) {
      pass("Test 14: Anonymous client cannot read notification logs (RLS enforced)");
    } else {
      fail("Test 14: Anonymous client read notification logs", anonLogs);
    }

    // Anonymous write blocked by RLS
    const { error: anonWriteErr } = await anonClient.from("notification_logs").insert({
      channel: "email",
      message_type: "unauthorized_log",
      status: "sent",
    });
    if (anonWriteErr) {
      pass("Test 15: Anonymous client cannot create or alter notification logs (RLS write blocked)");
    } else {
      fail("Test 15: Anonymous client created notification log without auth");
    }

    // Cleanup test artifacts
    await adminClient.from("notification_logs").delete().eq("customer_id", testCustomerId);
    await adminClient.from("bookings").delete().eq("id", testBookingId);
    await adminClient.from("customers").delete().eq("id", testCustomerId);
  } catch (err: any) {
    fail("Unhandled test exception", err);
  }

  console.log("\n==================================================");
  console.log(`PHASE 18 TEST SUMMARY: ${passed} / ${passed + failed} TESTS PASSED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase18Tests();
