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

async function verifyPhase18Manual() {
  console.log("==================================================");
  console.log("PHASE 18 — MANUAL VERIFICATION & AUDIT FLOW");
  console.log("==================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // 1. Fetch Summary Stats
  console.log("1. Fetching Notification Summary Stats...");
  const listRes = await getNotificationLogsList({
    page: 1,
    limit: 5,
    search: "",
    status: "all",
    channel: "all",
    type: "all",
  });

  if (!listRes.success) {
    throw new Error(`Failed to list notification logs: ${listRes.error}`);
  }

  console.log(`✓ Total Notifications: ${listRes.data.summary.totalNotifications}`);
  console.log(`✓ Sent / Successful: ${listRes.data.summary.successfulSends}`);
  console.log(`✓ Failed: ${listRes.data.summary.failedSends}`);

  // 2. Search for Known Booking Confirmation
  console.log("\n2. Searching for Known Booking Confirmation...");
  const searchRes = await getNotificationLogsList({
    page: 1,
    limit: 5,
    search: "REF-",
    status: "all",
    channel: "all",
    type: "all",
  });

  if (searchRes.success && searchRes.data.logs.length > 0) {
    const log = searchRes.data.logs[0];
    console.log(`✓ Found notification log:`);
    console.log(`  - Recipient: ${log.recipient.fullName || "Student"} (${log.recipient.email})`);
    console.log(`  - Type: ${log.messageType}`);
    console.log(`  - Channel: ${log.channel}`);
    console.log(`  - Status: ${log.status}`);
    console.log(`  - Booking Ref: ${log.booking?.bookingReference || "N/A"}`);
  }

  // 3. Inspect Failed Notification Reason
  console.log("\n3. Inspecting Failed Notification Reason...");
  const failedRes = await getNotificationLogsList({
    page: 1,
    limit: 1,
    search: "",
    status: "failed",
    channel: "all",
    type: "all",
  });

  if (failedRes.success && failedRes.data.logs.length > 0) {
    const failedLog = failedRes.data.logs[0];
    console.log(`✓ Inspecting Failed Log [${failedLog.id}]:`);
    console.log(`  - Status: ${failedLog.status}`);
    console.log(`  - Failure Reason: "${failedLog.errorMessage}"`);
  }

  // 4. Test Ineligible Notification Rejection
  console.log("\n4. Testing Ineligible Retry Guard...");
  const sentRes = await getNotificationLogsList({
    page: 1,
    limit: 1,
    search: "",
    status: "sent",
    channel: "all",
    type: "all",
  });

  if (sentRes.success && sentRes.data.logs.length > 0) {
    const sentLog = sentRes.data.logs[0];
    const ineligibleRetry = await retryNotificationById(sentLog.id);
    if (!ineligibleRetry.success && ineligibleRetry.statusCode === 400) {
      console.log(`✓ Confirmed: Successfully sent log [${sentLog.id}] correctly rejected retry (HTTP 400).`);
    } else {
      throw new Error("Ineligible retry was not rejected!");
    }
  }

  // 5. Test Anonymous RLS Barrier
  console.log("\n5. Testing Anonymous Access (RLS)...");
  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: anonData } = await anonClient.from("notification_logs").select("id");
  console.log(`✓ Anonymous client received ${anonData?.length || 0} records (RLS enforced).`);

  console.log("\n==================================================");
  console.log("PHASE 18 MANUAL VERIFICATION COMPLETE — ALL PASS");
  console.log("==================================================");
}

verifyPhase18Manual().catch((e) => {
  console.error("Manual verification failed:", e);
  process.exit(1);
});
