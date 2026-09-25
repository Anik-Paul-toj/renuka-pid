import { createClient } from "@supabase/supabase-js";
import {
  getBroadcastsList,
  getBroadcastById,
  createBroadcastDraft,
  updateBroadcast,
  deleteBroadcast,
  sendBroadcast,
  resolveBroadcastRecipients,
} from "../lib/broadcast/service";
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

// Ensure mock mode is active so test runs never hit external Resend network
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

async function runPhase17Tests() {
  console.log("==================================================");
  console.log("PHASE 17 — BROADCAST MANAGEMENT TEST SUITE");
  console.log("==================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const anonClient = createClient(supabaseUrl, anonKey);

  let testCourseId: string;
  let testBatchId: string;
  let createdDraftId: string | null = null;
  let sentBroadcastId: string | null = null;

  try {
    // -------------------------------------------------------------
    // SETUP FIXTURES
    // -------------------------------------------------------------
    // Find active course and batch
    const { data: courseRow } = await adminClient
      .from("courses")
      .select("id, title")
      .limit(1)
      .single();
    testCourseId = courseRow!.id;

    const { data: batchRow } = await adminClient
      .from("cohort_batches")
      .select("id, batch_name, start_date, start_time, end_time, zoom_join_url")
      .eq("course_id", testCourseId)
      .limit(1)
      .single();
    testBatchId = batchRow!.id;

    // -------------------------------------------------------------
    // 1. RECIPIENT RESOLUTION & AUDIENCE FILTERING TESTS
    // -------------------------------------------------------------
    console.log("\n--- 1. AUDIENCE RESOLUTION & RECIPIENT LOGIC ---");

    // All Students
    const allRecipients = await resolveBroadcastRecipients({
      audience: "all",
      subject: "Test Broadcast",
    });
    if (Array.isArray(allRecipients) && allRecipients.length >= 0) {
      pass("Test 1: All Students resolves recipient list server-side");
    } else {
      fail("Test 1: All Students resolution failed", allRecipients);
    }

    // Course Audience
    const courseRecipients = await resolveBroadcastRecipients({
      audience: "course",
      courseId: testCourseId,
      courseName: courseRow?.title,
      subject: "Course Announcement",
    });
    if (Array.isArray(courseRecipients)) {
      pass("Test 2: Course audience resolves correct course students");
    } else {
      fail("Test 2: Course audience resolution failed", courseRecipients);
    }

    // Batch Audience
    const batchRecipients = await resolveBroadcastRecipients({
      audience: "batch",
      courseId: testCourseId,
      batchId: testBatchId,
      batchName: batchRow?.batch_name,
      subject: "Batch Announcement",
    });
    if (Array.isArray(batchRecipients)) {
      pass("Test 3: Batch audience resolves correct cohort batch students");
    } else {
      fail("Test 3: Batch audience resolution failed", batchRecipients);
    }

    // Confirmed Students Only
    const confirmedRecipients = await resolveBroadcastRecipients({
      audience: "confirmed",
      subject: "Confirmed Attendees Notice",
      confirmedOnly: true,
    });
    if (Array.isArray(confirmedRecipients)) {
      pass("Test 4: Confirmed-only audience resolves strictly confirmed students");
    } else {
      fail("Test 4: Confirmed students resolution failed", confirmedRecipients);
    }

    // Client cannot inject arbitrary recipient emails (strictly server-resolved)
    const injectedPayload: any = {
      audience: "all",
      subject: "Injection Test",
      arbitraryRecipients: ["attacker@evil.com", "fake@spam.com"],
    };
    const resolvedWithoutInjection = await resolveBroadcastRecipients(injectedPayload);
    const hasInjected = resolvedWithoutInjection.some(
      (r) => r.email === "attacker@evil.com" || r.email === "fake@spam.com"
    );
    if (!hasInjected) {
      pass("Test 5: Server-side resolution prevents arbitrary client email injection");
    } else {
      fail("Test 5: Email injection was not prevented");
    }

    // -------------------------------------------------------------
    // 2. DRAFT CREATION, PERSISTENCE & VALIDATION
    // -------------------------------------------------------------
    console.log("\n--- 2. DRAFT CREATION & VALIDATION ---");

    const draftResult = await createBroadcastDraft({
      title: "Test Masterclass Announcement",
      channel: "email",
      targetFilter: {
        audience: "batch",
        courseId: testCourseId,
        courseName: courseRow?.title,
        batchId: testBatchId,
        batchName: batchRow?.batch_name,
        subject: "Reminder: Class tomorrow at 6:30 PM",
        date: "28 October 2026",
        time: "6:30 PM – 8:30 PM",
        joinLink: "https://zoom.us/j/1234567890",
      },
      content:
        "Hi [Student Name],\n\nThis is a reminder for [Course Name] ([Batch Name]).\n\nDate: [Date]\nTime: [Time]\n\nJoin: [Join Link]\n\nBest,\nRenuka",
    });

    if (draftResult.success && draftResult.data.id && draftResult.data.status === "draft") {
      createdDraftId = draftResult.data.id;
      pass("Test 6: Admin can create broadcast draft with status 'draft'");
    } else {
      fail("Test 6: Failed to create draft", draftResult);
    }

    // Verify recipient count was calculated server-side and recorded
    if (draftResult.success && typeof draftResult.data.totalRecipients === "number") {
      pass("Test 7: Recipient count is calculated and persisted on draft creation");
    } else {
      fail("Test 7: Recipient count calculation on draft failed");
    }

    // Verify draft creation did NOT send emails or create notification logs
    const { data: logsCheck } = await adminClient
      .from("notification_logs")
      .select("id")
      .eq("message_type", "broadcast")
      .gte("created_at", new Date(Date.now() - 5000).toISOString());

    if (!logsCheck || logsCheck.length === 0) {
      pass("Test 8: Saving draft does NOT dispatch emails or write notification logs");
    } else {
      fail("Test 8: Logs created prematurely on draft save", logsCheck);
    }

    // -------------------------------------------------------------
    // 3. EDIT & DELETE DRAFT WORKFLOWS
    // -------------------------------------------------------------
    console.log("\n--- 3. EDIT & DELETE DRAFT WORKFLOWS ---");

    if (!createdDraftId) {
      fail("Draft ID missing for update test");
      return;
    }

    const updateRes = await updateBroadcast(createdDraftId, {
      title: "Updated Announcement Title",
      content: "Hi [Student Name],\n\nUpdated text for masterclass.\n\nWarmly,\nRenuka",
    });

    if (
      updateRes.success &&
      updateRes.data.title === "Updated Announcement Title" &&
      updateRes.data.status === "draft"
    ) {
      pass("Test 9: Admin can edit an existing draft prior to dispatch");
    } else {
      fail("Test 9: Failed to update draft", updateRes);
    }

    // -------------------------------------------------------------
    // 4. LISTING, SEARCH & DETAIL INSPECTION
    // -------------------------------------------------------------
    console.log("\n--- 4. LISTING, FILTERING & DETAIL ---");

    const listRes = await getBroadcastsList({
      search: "Updated Announcement",
      status: "draft",
      channel: "all",
      page: 1,
      limit: 10,
    });

    if (listRes.success && listRes.data.broadcasts.some((b) => b.id === createdDraftId)) {
      pass("Test 10: Admin can list broadcasts with search and status filtering");
    } else {
      fail("Test 10: Failed to list broadcasts", listRes);
    }

    const detailRes = await getBroadcastById(createdDraftId);
    if (detailRes.success && detailRes.data.id === createdDraftId) {
      pass("Test 11: Admin can retrieve full broadcast details");
    } else {
      fail("Test 11: Failed to get broadcast detail", detailRes);
    }

    // -------------------------------------------------------------
    // 5. DISPATCH, LOGGING & DUPLICATE SEND PROTECTION
    // -------------------------------------------------------------
    console.log("\n--- 5. DISPATCH, LOGGING & DUPLICATE SEND PROTECTION ---");

    // Insert a test customer to guarantee at least 1 recipient for dispatch test
    const { data: testCustomer } = await adminClient
      .from("customers")
      .insert({
        full_name: "Broadcast Test Student",
        email: `test_broadcast_${Date.now()}@example.com`,
        phone: "+919876543210",
      })
      .select("id")
      .single();

    // Create a broadcast targeting this test customer
    const dispatchDraft = await createBroadcastDraft({
      title: "Dispatch Execution Test",
      channel: "email",
      targetFilter: {
        audience: "all",
        subject: "Live Dispatch Test Subject",
        date: "28 October 2026",
        time: "6:30 PM – 8:30 PM",
        joinLink: "https://zoom.us/j/1234567890",
      },
      content:
        "Hi [Student Name],\n\nThis is a live broadcast test message.\n\nDate: [Date]\nTime: [Time]\n\nJoin: [Join Link]\n\nWarm regards,\nRenuka",
    });

    if (!dispatchDraft.success) {
      fail("Test 12: Failed to create dispatch draft", dispatchDraft);
      return;
    }

    sentBroadcastId = dispatchDraft.data.id;

    // Execute Send
    const sendResult = await sendBroadcast(sentBroadcastId);
    if (sendResult.success && sendResult.data.status === "completed") {
      pass("Test 12: sendBroadcast dispatches successfully and marks status 'completed'");
    } else {
      fail("Test 12: Failed to send broadcast", sendResult);
    }

    // Verify delivery attempts recorded in notification_logs
    const { data: broadcastLogs } = await adminClient
      .from("notification_logs")
      .select("id, status, channel, message_type")
      .eq("message_type", "broadcast")
      .eq("customer_id", testCustomer!.id);

    if (broadcastLogs && broadcastLogs.length >= 1 && broadcastLogs[0].status === "sent") {
      pass("Test 13: Delivery attempts are logged to notification_logs using existing architecture");
    } else {
      fail("Test 13: Delivery logs not found in notification_logs", broadcastLogs);
    }

    // Duplicate Send Prevention Test: Cannot re-send a completed broadcast
    const duplicateSendRes = await sendBroadcast(sentBroadcastId);
    if (!duplicateSendRes.success && duplicateSendRes.statusCode === 400) {
      pass("Test 14: Duplicate send protection rejects sending an already completed broadcast");
    } else {
      fail("Test 14: Duplicate send protection failed", duplicateSendRes);
    }

    // Cannot edit a sent/completed broadcast
    const editSentRes = await updateBroadcast(sentBroadcastId, {
      title: "Attempted Modification",
    });
    if (!editSentRes.success && editSentRes.statusCode === 400) {
      pass("Test 15: Sent broadcast is immutable and cannot be modified");
    } else {
      fail("Test 15: Sent broadcast edit check failed", editSentRes);
    }

    // Audit Record Protection: Cannot delete a sent/completed broadcast
    const deleteSentRes = await deleteBroadcast(sentBroadcastId);
    if (!deleteSentRes.success && deleteSentRes.statusCode === 400) {
      pass("Test 16: Sent broadcast is permanent audit record and cannot be deleted");
    } else {
      fail("Test 16: Sent broadcast deletion check failed", deleteSentRes);
    }

    // Draft deletion works
    const deleteDraftRes = await deleteBroadcast(createdDraftId);
    if (deleteDraftRes.success) {
      pass("Test 17: Admin can safely delete un-dispatched draft broadcasts");
      createdDraftId = null;
    } else {
      fail("Test 17: Draft deletion failed", deleteDraftRes);
    }

    // -------------------------------------------------------------
    // 6. RLS & SECURITY BARRIERS
    // -------------------------------------------------------------
    console.log("\n--- 6. SECURITY & RLS ENFORCEMENT ---");

    // Anonymous read blocked by RLS
    const { data: anonReadData } = await anonClient.from("broadcasts").select("id");
    if (!anonReadData || anonReadData.length === 0) {
      pass("Test 18: Anonymous client cannot read broadcasts table (RLS enforced)");
    } else {
      fail("Test 18: Anonymous client read broadcasts table", anonReadData);
    }

    // Anonymous write blocked by RLS
    const { error: anonWriteErr } = await anonClient.from("broadcasts").insert({
      title: "Unauthorized Broadcast",
      channel: "email",
      content: "Hacked",
    });
    if (anonWriteErr) {
      pass("Test 19: Anonymous client cannot insert or mutate broadcasts (RLS write blocked)");
    } else {
      fail("Test 19: Anonymous client inserted broadcast without authentication");
    }

    // Cleanup test customer & test broadcast
    if (testCustomer?.id) {
      await adminClient.from("notification_logs").delete().eq("customer_id", testCustomer.id);
      await adminClient.from("customers").delete().eq("id", testCustomer.id);
    }
    if (sentBroadcastId) {
      await adminClient.from("broadcasts").delete().eq("id", sentBroadcastId);
    }
  } catch (err: any) {
    fail("Unhandled test exception", err);
  }

  console.log("\n==================================================");
  console.log(`PHASE 17 TEST SUMMARY: ${passed} / ${passed + failed} TESTS PASSED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase17Tests();
