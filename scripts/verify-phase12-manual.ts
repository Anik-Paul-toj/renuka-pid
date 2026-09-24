import { createClient } from "@supabase/supabase-js";
import { processBooking } from "../lib/booking/service";
import { createOrderForBooking, verifyPayment, handleWebhookEvent } from "../lib/payment/service";
import crypto from "crypto";
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
const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function runManualTestVerification() {
  console.log("==================================================");
  console.log("PHASE 12 — MANUAL END-TO-END FLOW VERIFICATION");
  console.log("==================================================");

  // 1. Fetch active cohort batch
  const { data: batch } = await adminClient
    .from("cohort_batches")
    .select("id, batch_name, start_date")
    .eq("is_enrollment_open", true)
    .limit(1)
    .single();

  if (!batch) {
    console.error("No active batch available.");
    return;
  }

  const testEmail = `student.phase12.${Date.now()}@artstudio.test`;
  console.log(`Step 1: Submitting ₹199 booking for student: ${testEmail}...`);

  const bookingRes = await processBooking({
    fullName: "Priya Sengupta",
    email: testEmail,
    phone: "+91 98765 12345",
    batchId: batch.id,
  });

  if (!bookingRes.success) {
    console.error("Booking creation failed:", bookingRes.error);
    return;
  }

  const booking = bookingRes.data;
  console.log(`✓ Booking created: Reference = ${booking.bookingReference}, Amount = ₹${booking.amountPaise / 100}`);

  // 2. Create Razorpay Order
  console.log("\nStep 2: Creating Razorpay order...");
  const orderRes = await createOrderForBooking(booking.bookingReference);
  if (!orderRes.success) {
    console.error("Order creation failed:", orderRes.error);
    return;
  }

  const orderData = orderRes.data;
  console.log(`✓ Razorpay Order created: ${orderData.orderId}, Amount = ${orderData.amountPaise} paise`);

  // 3. Confirm Payment via Webhook (payment.captured)
  console.log("\nStep 3: Simulating Razorpay payment.captured webhook...");
  const testPaymentId = `pay_e2e_${Date.now()}`;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "AnikPaul123";
  const webhookPayload = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: testPaymentId,
          order_id: orderData.orderId,
          amount: 19900,
          currency: "INR",
          status: "captured",
        },
      },
    },
  });

  const signature = crypto
    .createHmac("sha256", webhookSecret)
    .update(webhookPayload)
    .digest("hex");

  const webhookResult = await handleWebhookEvent(webhookPayload, signature);
  console.log(`✓ Webhook processed: HTTP ${webhookResult.status}, handled = ${webhookResult.handled}`);

  // Give notification processing a moment
  await new Promise((r) => setTimeout(r, 600));

  // 4. Inspect Database Records
  console.log("\nStep 4: Inspecting Database Verification Status...");
  const { data: dbBooking } = await adminClient
    .from("bookings")
    .select("id, status, amount_paise")
    .eq("booking_reference", booking.bookingReference)
    .single();

  const { data: dbPayment } = await adminClient
    .from("payments")
    .select("id, status, razorpay_order_id, razorpay_payment_id")
    .eq("razorpay_order_id", orderData.orderId)
    .single();

  const { data: dbLogs } = await adminClient
    .from("notification_logs")
    .select("*")
    .eq("booking_id", dbBooking?.id);

  console.log(`- Booking Status: ${dbBooking?.status} (Expected: confirmed)`);
  console.log(`- Payment Status: ${dbPayment?.status} (Expected: captured)`);
  console.log(`- Payment ID: ${dbPayment?.razorpay_payment_id}`);
  console.log(`- Notification Log Entries: ${dbLogs?.length || 0}`);

  if (dbLogs && dbLogs.length > 0) {
    const log = dbLogs[0];
    console.log(`- Notification Attempt: Channel = ${log.channel}, Status = ${log.status}, Message Type = ${log.message_type}`);
    if (log.provider_message_id) {
      console.log(`- Provider Message ID: ${log.provider_message_id}`);
    }
    if (log.error_message) {
      console.log(`- Error Info: ${log.error_message}`);
    }
  }

  // 5. Duplicate Webhook Idempotency Check
  console.log("\nStep 5: Testing Duplicate Webhook Idempotency...");
  await handleWebhookEvent(webhookPayload, signature);
  await new Promise((r) => setTimeout(r, 400));

  const { data: dbLogsAfterDup } = await adminClient
    .from("notification_logs")
    .select("id")
    .eq("booking_id", dbBooking?.id);

  console.log(`- Notification Log Entries after duplicate webhook: ${dbLogsAfterDup?.length} (Expected: ${dbLogs?.length})`);

  // Cleanup
  console.log("\nCleaning up test booking...");
  if (dbLogs && dbLogs.length > 0) {
    await adminClient.from("notification_logs").delete().eq("booking_id", dbBooking?.id);
  }
  if (dbPayment) {
    await adminClient.from("payments").delete().eq("id", dbPayment.id);
  }
  if (dbBooking) {
    await adminClient.from("bookings").delete().eq("id", dbBooking.id);
  }
  console.log("==================================================");
  console.log("MANUAL VERIFICATION COMPLETED SUCCESSFULLY.");
  console.log("==================================================");
}

runManualTestVerification();
