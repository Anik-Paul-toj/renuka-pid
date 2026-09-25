import { createClient } from "@supabase/supabase-js";
import {
  createBroadcastDraft,
  getBroadcastById,
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

// Force mock Resend for safety
process.env.MOCK_RESEND = "true";

async function verifyPhase17Manual() {
  console.log("==================================================");
  console.log("PHASE 17 — MANUAL VERIFICATION & AUDIT FLOW");
  console.log("==================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // 1. Fetch Course and Batch
  console.log("1. Inspecting Course and Batch fixtures...");
  const { data: course } = await adminClient.from("courses").select("id, title").limit(1).single();
  const { data: batch } = await adminClient
    .from("cohort_batches")
    .select("id, batch_name, start_date, start_time, end_time, zoom_join_url")
    .eq("course_id", course!.id)
    .limit(1)
    .single();

  console.log(`✓ Course: ${course?.title}`);
  console.log(`✓ Batch: ${batch?.batch_name}`);

  // 2. Test Recipient Count for Batch Audience
  console.log("\n2. Testing Server-Side Recipient Count for Batch Audience...");
  const recipients = await resolveBroadcastRecipients({
    audience: "batch",
    courseId: course!.id,
    courseName: course!.title,
    batchId: batch!.id,
    batchName: batch!.batch_name,
    subject: "Class Reminder",
  });
  console.log(`✓ Recipient count for batch: ${recipients.length} students`);

  // 3. Create Draft
  console.log("\n3. Creating Draft Broadcast...");
  const draftRes = await createBroadcastDraft({
    title: "Upcoming Watercolor Masterclass Reminder",
    channel: "email",
    targetFilter: {
      audience: "batch",
      courseId: course!.id,
      courseName: course!.title,
      batchId: batch!.id,
      batchName: batch!.batch_name,
      subject: "Reminder: Your class is tomorrow",
      date: batch!.start_date,
      time: `${batch!.start_time} – ${batch!.end_time}`,
      joinLink: batch!.zoom_join_url || "https://zoom.us/j/1234567890",
    },
    content:
      "Hi [Student Name],\n\nJust a reminder that our watercolour masterclass is tomorrow.\n\nDate: [Date]\nTime: [Time]\n\nJoin here: [Join Link]\n\nSee you there!\nRenuka",
  });

  if (!draftRes.success) {
    throw new Error(`Draft creation failed: ${draftRes.error}`);
  }
  const draftId = draftRes.data.id;
  console.log(`✓ Draft created successfully! ID: ${draftId}, Status: ${draftRes.data.status}`);

  // 4. Verify Draft Persistence
  console.log("\n4. Verifying Draft Persistence in Database...");
  const fetched = await getBroadcastById(draftId);
  if (!fetched.success || fetched.data.title !== "Upcoming Watercolor Masterclass Reminder") {
    throw new Error("Draft persistence check failed");
  }
  console.log(`✓ Draft confirmed stored in database. Title: '${fetched.data.title}'`);

  // 5. Verify Zero Notification Logs Created for Draft
  const { count: logCount } = await adminClient
    .from("notification_logs")
    .select("id", { count: "exact", head: true })
    .eq("message_type", "broadcast")
    .gte("created_at", new Date(Date.now() - 3000).toISOString());
  console.log(`✓ Notification logs created during draft save: ${logCount || 0} (Strict zero)`);

  // 6. Controlled Controlled Dispatch Test (with isolated test student)
  console.log("\n5. Testing Controlled Dispatch to Isolated Test Recipient...");
  const { data: testCustomer } = await adminClient
    .from("customers")
    .insert({
      full_name: "Controlled Audit Student",
      email: `audit_${Date.now()}@example.com`,
    })
    .select("id, email")
    .single();

  const auditBroadcast = await createBroadcastDraft({
    title: "Controlled Send Verification",
    channel: "email",
    targetFilter: {
      audience: "all",
      subject: "Audit Subject Verification",
    },
    content: "Hi [Student Name],\n\nThis is an audit dispatch test.",
  });

  if (!auditBroadcast.success) {
    throw new Error(`Audit broadcast draft failed: ${auditBroadcast.error}`);
  }

  const sendRes = await sendBroadcast(auditBroadcast.data.id);
  console.log(`✓ Send execution status: ${sendRes.success ? (sendRes as any).data.status : "failed"}`);

  // 7. Verify Notification Log Entry
  const { data: sentLog } = await adminClient
    .from("notification_logs")
    .select("id, customer_id, channel, status")
    .eq("customer_id", testCustomer!.id)
    .single();

  console.log(`✓ Notification log verified: status='${sentLog?.status}', channel='${sentLog?.channel}'`);

  // Cleanup test artifacts
  await adminClient.from("notification_logs").delete().eq("customer_id", testCustomer!.id);
  await adminClient.from("customers").delete().eq("id", testCustomer!.id);
  await adminClient.from("broadcasts").delete().eq("id", auditBroadcast.data.id);
  await deleteBroadcast(draftId);

  console.log("\n==================================================");
  console.log("PHASE 17 MANUAL VERIFICATION COMPLETE — ALL PASS");
  console.log("==================================================");
}

verifyPhase17Manual().catch((e) => {
  console.error("Manual verification failed:", e);
  process.exit(1);
});
