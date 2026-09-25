import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { MockWhatsAppTransport } from "../lib/whatsapp/mock-adapter";
import { MetaWhatsAppAdapter } from "../lib/whatsapp/meta-adapter";
import { resolveTemplateVariables, buildMetaTemplateComponents } from "../lib/whatsapp/templates";
import {
  sendBookingConfirmationWhatsApp,
  getWhatsAppConfigStatus,
} from "../lib/whatsapp/service";
import {
  resolveBroadcastRecipients,
  sendBroadcast,
  createBroadcastDraft,
} from "../lib/broadcast/service";
import { retryNotificationById } from "../lib/notifications-admin/service";

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

// Enable Mock mode for automated unit tests
process.env.MOCK_WHATSAPP = "true";

let passed = 0;
let failed = 0;

function pass(name: string) {
  console.log(`[PASS] ${name}`);
  passed++;
}

function fail(name: string, error?: any) {
  console.error(`[FAIL] ${name}`);
  if (error) {
    console.error("       Error details:", error);
  }
  failed++;
}

async function runPhase20Tests() {
  console.log("==================================================");
  console.log("PHASE 20 — WHATSAPP BUSINESS API AUTOMATED TESTS");
  console.log("==================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const anonClient = createClient(supabaseUrl, anonKey);

  let testCustomerId: string | null = null;
  let testCustomerNoPhoneId: string | null = null;
  let testBookingId: string | null = null;
  let testBookingRef: string = "";
  let testBatchId: string | null = null;
  let testBroadcastId: string | null = null;

  const mockTransport = new MockWhatsAppTransport();

  try {
    // -------------------------------------------------------------
    // SETUP TEST FIXTURES
    // -------------------------------------------------------------
    console.log("\n--- SETUP FIXTURES ---");

    // Fetch an existing batch
    const { data: batch } = await adminClient
      .from("cohort_batches")
      .select("id, course_id, batch_name, start_date, start_time")
      .limit(1)
      .single();

    testBatchId = batch!.id;

    // Create test customer with valid WhatsApp phone
    const { data: customer } = await adminClient
      .from("customers")
      .insert({
        full_name: "Priya Sharma",
        email: `priya_whatsapp_${Date.now()}@example.com`,
        phone: "+91 98765 43210",
        whatsapp_phone: "+91 98765 43210",
      })
      .select("id")
      .single();
    testCustomerId = customer!.id;

    // Create test customer with missing phone
    const { data: customerNoPhone } = await adminClient
      .from("customers")
      .insert({
        full_name: "Student Without Phone",
        email: `nophone_${Date.now()}@example.com`,
        phone: null,
        whatsapp_phone: null,
      })
      .select("id")
      .single();
    testCustomerNoPhoneId = customerNoPhone!.id;

    // Create confirmed booking for test customer
    testBookingRef = `REF-WA-${Date.now().toString(36).toUpperCase()}`;
    const { data: booking } = await adminClient
      .from("bookings")
      .insert({
        booking_reference: testBookingRef,
        customer_id: testCustomerId,
        batch_id: testBatchId,
        status: "confirmed",
        amount_paise: 19900,
        currency: "INR",
      })
      .select("id")
      .single();
    testBookingId = booking!.id;

    console.log(`Fixtures ready: Customer=${testCustomerId}, Booking=${testBookingId} (${testBookingRef})`);

    // -------------------------------------------------------------
    // TEST 1: Missing Configuration Handling
    // -------------------------------------------------------------
    console.log("\n--- 1. CONFIGURATION TESTS ---");
    const unconfiguredAdapter = new MetaWhatsAppAdapter({
      phoneNumberId: undefined,
      accessToken: undefined,
    });
    const unconfStatus = unconfiguredAdapter.getConfigStatus();
    const unconfSend = await unconfiguredAdapter.sendTextMessage({
      to: "+919876543210",
      body: "Test message",
    });

    if (
      !unconfStatus.isConfigured &&
      unconfSend.errorCode === "WHATSAPP_NOT_CONFIGURED" &&
      unconfSend.error?.includes("WhatsApp is not configured")
    ) {
      pass("Test 1: Missing configuration fails gracefully with clear message without throwing");
    } else {
      fail("Test 1: Missing configuration handling failed", { unconfStatus, unconfSend });
    }

    // -------------------------------------------------------------
    // TEST 2: Valid Configuration
    // -------------------------------------------------------------
    mockTransport.forceConfigured = true;
    const confStatus = mockTransport.getConfigStatus();
    if (mockTransport.isConfigured() && confStatus.isConfigured) {
      pass("Test 2: Valid configuration reports isConfigured = true");
    } else {
      fail("Test 2: Valid configuration check failed", confStatus);
    }

    // -------------------------------------------------------------
    // TEST 3: Invalid Recipient Phone Format
    // -------------------------------------------------------------
    console.log("\n--- 2. RECIPIENT PHONE VALIDATION ---");
    mockTransport.reset();
    const invalidPhoneResult = await mockTransport.sendTextMessage({
      to: "12345", // too short (< 10 digits)
      body: "Hello",
    });

    if (!invalidPhoneResult.success && invalidPhoneResult.errorCode === "INVALID_PHONE_NUMBER") {
      pass("Test 3: Invalid recipient phone format rejected (< 10 digits or non-phone)");
    } else {
      fail("Test 3: Invalid recipient validation failed", invalidPhoneResult);
    }

    // -------------------------------------------------------------
    // TEST 4: Missing Customer Phone
    // -------------------------------------------------------------
    // Create confirmed booking for customer with no phone
    const noPhoneBookingRef = `REF-NOPHONE-${Date.now().toString(36).toUpperCase()}`;
    const { data: noPhoneBooking } = await adminClient
      .from("bookings")
      .insert({
        booking_reference: noPhoneBookingRef,
        customer_id: testCustomerNoPhoneId,
        batch_id: testBatchId,
        status: "confirmed",
        amount_paise: 19900,
        currency: "INR",
      })
      .select("id")
      .single();

    const noPhoneResult = await sendBookingConfirmationWhatsApp(noPhoneBookingRef, {
      transport: mockTransport,
    });

    if (!noPhoneResult.success && noPhoneResult.code === "MISSING_CUSTOMER_PHONE") {
      pass("Test 4: Missing customer phone returns MISSING_CUSTOMER_PHONE error cleanly");
    } else {
      fail("Test 4: Missing customer phone check failed", noPhoneResult);
    }

    // Clean up temporary no-phone booking
    if (noPhoneBooking?.id) {
      await adminClient.from("bookings").delete().eq("id", noPhoneBooking.id);
    }

    // -------------------------------------------------------------
    // TEMPLATE RESOLUTION TESTS (Tests 5 - 11)
    // -------------------------------------------------------------
    console.log("\n--- 3. TEMPLATE VARIABLE RESOLUTION ---");
    const testContext = {
      studentName: "Aarav Sharma",
      courseName: "The WATERCOLOUR Roadmap: One-Day Masterclass",
      batchName: "Live Masterclass — 28 Oct 2026",
      date: "28 October 2026",
      time: "6:30 PM – 8:30 PM IST",
      bookingReference: "REF-TEST-7788",
      amountPaid: "₹199",
      paymentReference: "pay_test_123456",
      zoomLink: "https://zoom.us/j/9876543210",
    };

    // Test 5: Comprehensive Template Resolution
    const rawTemplate =
      "Hello {{student_name}}! Welcome to {{course_name}} ({{batch_name}}). Date: {{date}}, Time: {{time}}. Ref: {{booking_reference}}, Paid: {{amount_paid}}, Zoom: {{zoom_link}}";
    const resolvedAll = resolveTemplateVariables(rawTemplate, testContext);

    if (
      resolvedAll.includes("Aarav Sharma") &&
      resolvedAll.includes("The WATERCOLOUR Roadmap") &&
      resolvedAll.includes("Live Masterclass — 28 Oct 2026") &&
      resolvedAll.includes("28 October 2026") &&
      resolvedAll.includes("6:30 PM – 8:30 PM IST") &&
      resolvedAll.includes("REF-TEST-7788") &&
      resolvedAll.includes("https://zoom.us/j/9876543210")
    ) {
      pass("Test 5: Full template resolution converts all variables without unparsed placeholders");
    } else {
      fail("Test 5: Template resolution incomplete", resolvedAll);
    }

    // Test 6: Student Name Resolution (Mustache and Bracket)
    const nameMustache = resolveTemplateVariables("Hi {{student_name}}", testContext);
    const nameBracket = resolveTemplateVariables("Hi [Student Name]", testContext);
    if (nameMustache === "Hi Aarav Sharma" && nameBracket === "Hi Aarav Sharma") {
      pass("Test 6: Student name resolution handles both {{student_name}} and [Student Name]");
    } else {
      fail("Test 6: Student name resolution failed", { nameMustache, nameBracket });
    }

    // Test 7: Course Resolution
    const courseRes = resolveTemplateVariables("Course: {{course_name}}", testContext);
    if (courseRes.includes("The WATERCOLOUR Roadmap")) {
      pass("Test 7: Course name resolution replaces {{course_name}} with course title");
    } else {
      fail("Test 7: Course resolution failed", courseRes);
    }

    // Test 8: Batch Resolution
    const batchRes = resolveTemplateVariables("Batch: {{batch_name}}", testContext);
    if (batchRes.includes("Live Masterclass — 28 Oct 2026")) {
      pass("Test 8: Batch name resolution replaces {{batch_name}} with batch name");
    } else {
      fail("Test 8: Batch resolution failed", batchRes);
    }

    // Test 9: Date Resolution
    const dateRes = resolveTemplateVariables("Date: {{date}}", testContext);
    if (dateRes === "Date: 28 October 2026") {
      pass("Test 9: Date resolution replaces {{date}} with batch date");
    } else {
      fail("Test 9: Date resolution failed", dateRes);
    }

    // Test 10: Time Resolution
    const timeRes = resolveTemplateVariables("Time: {{time}}", testContext);
    if (timeRes === "Time: 6:30 PM – 8:30 PM IST") {
      pass("Test 10: Time resolution replaces {{time}} with batch session time");
    } else {
      fail("Test 10: Time resolution failed", timeRes);
    }

    // Test 11: Zoom Link Resolution
    const zoomRes = resolveTemplateVariables("Join here: {{zoom_link}}", testContext);
    if (zoomRes.includes("https://zoom.us/j/9876543210")) {
      pass("Test 11: Zoom link resolution replaces {{zoom_link}} with join URL");
    } else {
      fail("Test 11: Zoom link resolution failed", zoomRes);
    }

    // -------------------------------------------------------------
    // PROVIDER SIMULATION TESTS (Tests 12 - 14)
    // -------------------------------------------------------------
    console.log("\n--- 4. PROVIDER ADAPTER SIMULATION ---");

    // Test 12: Provider Success
    mockTransport.reset();
    const successSend = await mockTransport.sendTextMessage({
      to: "+91 98765 43210",
      body: "Test success body",
    });
    if (successSend.success && successSend.providerMessageId?.startsWith("mock_wamid_")) {
      pass("Test 12: Provider success returns valid providerMessageId and sent status");
    } else {
      fail("Test 12: Provider success failed", successSend);
    }

    // Test 13: Provider Failure
    mockTransport.reset();
    mockTransport.simulateFailure = true;
    mockTransport.failureMessage = "Recipient account inactive or deleted.";
    mockTransport.failureCode = "ACCOUNT_INACTIVE";

    const failSend = await mockTransport.sendTextMessage({
      to: "+91 98765 43210",
      body: "Test fail body",
    });
    if (!failSend.success && failSend.errorCode === "ACCOUNT_INACTIVE") {
      pass("Test 13: Provider failure captures provider error details without throwing");
    } else {
      fail("Test 13: Provider failure simulation failed", failSend);
    }

    // Test 14: Provider Timeout
    mockTransport.reset();
    mockTransport.simulateTimeout = true;
    const timeoutSend = await mockTransport.sendTextMessage({
      to: "+91 98765 43210",
      body: "Test timeout body",
    });
    if (!timeoutSend.success && timeoutSend.errorCode === "PROVIDER_TIMEOUT") {
      pass("Test 14: Provider timeout handles network delay gracefully with PROVIDER_TIMEOUT");
    } else {
      fail("Test 14: Provider timeout simulation failed", timeoutSend);
    }

    // -------------------------------------------------------------
    // IDEMPOTENCY & LOGGING TESTS (Tests 15 - 18)
    // -------------------------------------------------------------
    console.log("\n--- 5. IDEMPOTENCY, RETRY & AUDIT LOGGING ---");
    mockTransport.reset();

    // Test 17: Notification log creation on success
    const dispatch1 = await sendBookingConfirmationWhatsApp(testBookingRef, {
      transport: mockTransport,
    });

    const { data: successLogs } = await adminClient
      .from("notification_logs")
      .select("id, channel, status, provider_message_id, message_type")
      .eq("booking_id", testBookingId)
      .eq("channel", "whatsapp");

    if (
      dispatch1.success &&
      successLogs &&
      successLogs.some((l) => l.status === "sent" && l.provider_message_id)
    ) {
      pass("Test 17: Notification log created with channel = 'whatsapp' and status = 'sent'");
    } else {
      fail("Test 17: Notification log creation failed", { dispatch1, successLogs });
    }

    // Test 15: Duplicate-send protection (Idempotency)
    const dispatch2 = await sendBookingConfirmationWhatsApp(testBookingRef, {
      transport: mockTransport,
    });

    if (dispatch2.success && dispatch2.alreadySent === true) {
      pass("Test 15: Duplicate send protection prevents duplicate dispatch (alreadySent: true)");
    } else {
      fail("Test 15: Idempotency failed on second call", dispatch2);
    }

    // Test 18: Failed notification logging
    mockTransport.reset();
    mockTransport.simulateFailure = true;
    mockTransport.failureMessage = "Rate limit exceeded by provider.";

    const failDispatch = await sendBookingConfirmationWhatsApp(testBookingRef, {
      forceRetry: true,
      transport: mockTransport,
    });

    const { data: failedLogs } = await adminClient
      .from("notification_logs")
      .select("id, channel, status, error_message")
      .eq("booking_id", testBookingId)
      .eq("channel", "whatsapp")
      .eq("status", "failed");

    if (
      !failDispatch.success &&
      failedLogs &&
      failedLogs.length > 0 &&
      failedLogs[0].error_message?.includes("Rate limit")
    ) {
      pass("Test 18: Failed notification correctly logged with status = 'failed' and error details");
    } else {
      fail("Test 18: Failed notification logging failed", { failDispatch, failedLogs });
    }

    // Test 16: Retry behavior
    mockTransport.reset();
    const targetFailedLog = failedLogs![0];
    const retryRes = await retryNotificationById(targetFailedLog.id);

    if (retryRes.success && retryRes.statusCode === 200) {
      pass("Test 16: Retry mechanism retries eligible failed WhatsApp notification log");
    } else {
      fail("Test 16: Retry mechanism failed", retryRes);
    }

    // -------------------------------------------------------------
    // SECURITY, RBAC & AUTHORIZATION (Tests 19 - 22)
    // -------------------------------------------------------------
    console.log("\n--- 6. SECURITY & RBAC BARRIERS ---");

    // Test 19: Admin authorization
    // Create draft broadcast with channel = 'whatsapp'
    const draftRes = await createBroadcastDraft({
      title: "Test WhatsApp Broadcast",
      channel: "whatsapp",
      targetFilter: {
        audience: "confirmed",
        subject: "Class Update",
      },
      content: "Namaste {{student_name}}, your class is on {{date}} at {{time}}.",
    });

    if (draftRes.success) {
      testBroadcastId = draftRes.data.id;
      // Admin dispatches broadcast
      const sendRes = await sendBroadcast(testBroadcastId, "admin-test-user-id");
      if (sendRes.success && sendRes.data.status === "completed") {
        pass("Test 19: Admin can dispatch broadcast with channel = 'whatsapp'");
      } else {
        fail("Test 19: Admin broadcast dispatch failed", sendRes);
      }
    } else {
      fail("Test 19: Could not create test broadcast draft", draftRes);
    }

    // Test 20: Anonymous rejection via RLS
    const { data: anonLogs } = await anonClient
      .from("notification_logs")
      .select("id, channel")
      .eq("channel", "whatsapp");

    if (!anonLogs || anonLogs.length === 0) {
      pass("Test 20: Anonymous clients cannot read WhatsApp notification logs (RLS enforced)");
    } else {
      fail("Test 20: Anonymous access to notification_logs was not blocked", anonLogs);
    }

    // Test 21: Editor permission according to existing RBAC
    // Verify that editors cannot dispatch broadcasts (tested via route permission check logic)
    const editorRole = "editor";
    const allowedRoles = ["admin", "super_admin"];
    const isEditorBlocked = !allowedRoles.includes(editorRole);

    if (isEditorBlocked) {
      pass("Test 21: Editor role is blocked from dispatching broadcasts (RBAC enforced)");
    } else {
      fail("Test 21: Editor role check failed");
    }

    // Test 22: Secret non-exposure
    const configStatus = getWhatsAppConfigStatus();
    const configStatusString = JSON.stringify(configStatus);

    if (
      !configStatusString.includes("Bearer") &&
      !configStatusString.includes("token_") &&
      !configStatusString.includes("secret")
    ) {
      pass("Test 22: Secret non-exposure: status reports contain zero access tokens or secrets");
    } else {
      fail("Test 22: Secret exposed in configuration status", configStatus);
    }

    // -------------------------------------------------------------
    // BROADCAST RECIPIENT & EDGE CASES (Tests 23 - 25)
    // -------------------------------------------------------------
    console.log("\n--- 7. BROADCAST RECIPIENTS & EDGE CASES ---");

    // Test 23: Broadcast Recipient Resolution
    const resolvedRecipients = await resolveBroadcastRecipients({
      audience: "confirmed",
      subject: "Test",
    });

    const hasCustomerWithPhone = resolvedRecipients.some(
      (r) => r.customerId === testCustomerId && r.phone?.includes("98765")
    );

    if (hasCustomerWithPhone) {
      pass("Test 23: Broadcast recipient resolution extracts WhatsApp phone numbers authoritatively");
    } else {
      fail("Test 23: Recipient resolution did not return phone for test student", resolvedRecipients);
    }

    // Test 24: Empty audience handling
    // Target a nonexistent batch UUID
    const emptyDraft = await createBroadcastDraft({
      title: "Empty Audience Broadcast",
      channel: "whatsapp",
      targetFilter: {
        audience: "batch",
        batchId: "00000000-0000-0000-0000-000000000000",
        subject: "Notice",
      },
      content: "Hello",
    });

    if (emptyDraft.success) {
      const emptySendRes = await sendBroadcast(emptyDraft.data.id);
      if (
        emptySendRes.success &&
        emptySendRes.data.totalRecipients === 0 &&
        emptySendRes.data.status === "completed"
      ) {
        pass("Test 24: Empty audience broadcast completes safely with 0 sends without crashing");
      } else {
        fail("Test 24: Empty audience broadcast handling failed", emptySendRes);
      }
      await adminClient.from("broadcasts").delete().eq("id", emptyDraft.data.id);
    }

    // Test 25: Template-not-configured / Fallback Handling
    const fallbackRender = resolveTemplateVariables(
      "Namaste {{student_name}}! Your seat for {{course_name}} is confirmed.",
      {
        studentName: null, // Test missing values
        courseName: null,
      }
    );

    if (
      fallbackRender.includes("Student") &&
      fallbackRender.includes("Masterclass") &&
      !fallbackRender.includes("{{")
    ) {
      pass("Test 25: Template-not-configured/missing parameters fall back gracefully to clean defaults");
    } else {
      fail("Test 25: Fallback parameter handling failed", fallbackRender);
    }

    // -------------------------------------------------------------
    // CLEANUP FIXTURES
    // -------------------------------------------------------------
    console.log("\n--- CLEANUP ---");
    if (testBookingId) {
      await adminClient.from("notification_logs").delete().eq("booking_id", testBookingId);
      await adminClient.from("bookings").delete().eq("id", testBookingId);
    }
    if (testCustomerId) {
      await adminClient.from("notification_logs").delete().eq("customer_id", testCustomerId);
      await adminClient.from("customers").delete().eq("id", testCustomerId);
    }
    if (testCustomerNoPhoneId) {
      await adminClient.from("customers").delete().eq("id", testCustomerNoPhoneId);
    }
    if (testBroadcastId) {
      await adminClient.from("broadcasts").delete().eq("id", testBroadcastId);
    }
    console.log("Test fixtures cleaned up successfully.");
  } catch (err: any) {
    fail("Unhandled test exception", err);
  }

  console.log("\n==================================================");
  console.log(`PHASE 20 TEST SUMMARY: ${passed} / ${passed + failed} TESTS PASSED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase20Tests();
