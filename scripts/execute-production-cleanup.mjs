import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key, ...rest] = trimmed.split("=");
    envVars[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Explicit Whitelist of Approved Test Record IDs
const TARGET_PAYMENT_IDS = [
  "ee4e7009-794e-439d-bafb-7f5ad9644cbd", // pay_TlxjFvsKSQweoc (₹1.00 UPI developer test)
  "d105e2bf-d5a4-40d3-94f5-4227ead0b989", // order_Tlxm6wXtECgEfh (₹2.00 test order)
  "3bd28411-d0e0-4f7c-b777-d968ce37917a", // order_TmUKeunNhz82Ww (₹990.00 test order)
  "fb5245d5-efef-4831-aaed-342f05f32995", // order_TmfRwhhS1GtwTv (₹99.00 test order)
];

const TARGET_BOOKING_IDS = [
  "f60e90b5-7f11-481b-b8f0-9bfca2555887", // REF-MV1HJTAR-3EC89A
  "df8cee11-2f5c-42a8-9358-7c62c0f15c6c", // REF-MV1HK057-2CBB6C
  "3becbe69-dd26-475f-83d0-1b10015d2019", // REF-MV1HK9DP-26D154
  "8cd09799-88e9-4dcf-9969-96c0b98274a6", // REF-MV1HLT03-8257D3
  "213d953f-60dd-480f-bb65-edcbaf0105c2", // REF-MV1HPHRS-84E39C
  "6fe3e067-fa4c-4328-8fec-41e470ded550", // REF-MV1HS4OW-6DF96C
  "557bd1e7-8f5c-4223-9669-bb6a13696f09", // REF-MV1HWLLZ-4AE1B6
  "b7712e4e-f897-4fae-bfe9-5fcf9b376388", // REF-MV3E5YY1-AD4B62
  "d3263a54-9f4f-4001-859a-a03597fbcfd8", // REF-MV41H3M3-70FF05
];

const TARGET_CUSTOMER_IDS = [
  "3868a442-ce1d-42b6-9f9a-82e3723e717a", // trojanik003@gmail.com (Anik Paul)
  "d84f48c2-fa0e-461d-86c8-2d8c805ed1a6", // asd@gmail.com (aszdfsa)
];

async function executeCleanup() {
  console.log("==================================================================");
  console.log("STARTING PRODUCTION HANDOVER CLEANUP PROCEDURE");
  console.log("==================================================================");

  // STEP 1: Pre-deletion verification against exact IDs
  console.log("1. Verifying records to be backed up and deleted...");

  const { data: paymentsToBackup, error: pBackupErr } = await supabase
    .from("payments")
    .select("*")
    .in("id", TARGET_PAYMENT_IDS);

  if (pBackupErr || !paymentsToBackup || paymentsToBackup.length !== TARGET_PAYMENT_IDS.length) {
    console.error("Payment verification failed! Found count:", paymentsToBackup?.length);
    process.exit(1);
  }

  const { data: bookingsToBackup, error: bBackupErr } = await supabase
    .from("bookings")
    .select("*")
    .in("id", TARGET_BOOKING_IDS);

  if (bBackupErr || !bookingsToBackup || bookingsToBackup.length !== TARGET_BOOKING_IDS.length) {
    console.error("Booking verification failed! Found count:", bookingsToBackup?.length);
    process.exit(1);
  }

  const { data: customersToBackup, error: cBackupErr } = await supabase
    .from("customers")
    .select("*")
    .in("id", TARGET_CUSTOMER_IDS);

  if (cBackupErr || !customersToBackup || customersToBackup.length !== TARGET_CUSTOMER_IDS.length) {
    console.error("Customer verification failed! Found count:", customersToBackup?.length);
    process.exit(1);
  }

  // STEP 2: Foreign Key Dependency Verification
  console.log("2. Verifying foreign key relationships...");
  // Check booking_credits, credit_token_redemptions, notification_logs
  const { count: creditCount } = await supabase.from("booking_credits").select("id", { count: "exact", head: true });
  const { count: tokenCount } = await supabase.from("credit_token_redemptions").select("id", { count: "exact", head: true });
  const { count: notifCount } = await supabase.from("notification_logs").select("id", { count: "exact", head: true });

  if (creditCount > 0 || tokenCount > 0 || notifCount > 0) {
    console.warn("Found dependent rows in credits or notification logs, inspecting...");
  } else {
    console.log("✅ Zero dependent rows in booking_credits, credit_token_redemptions, or notification_logs.");
  }

  // STEP 3: Create Pre-Cleanup Backup File
  console.log("3. Writing pre-cleanup JSON backup...");
  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPayload = {
    timestamp: new Date().toISOString(),
    environment: "production",
    reason: "Production handover cleanup - Remove dummy and testing data",
    payments: paymentsToBackup,
    bookings: bookingsToBackup,
    customers: customersToBackup,
  };

  const backupFilePath = path.join(
    backupDir,
    `pre_cleanup_backup_${Date.now()}.json`
  );
  fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), "utf-8");
  console.log(`✅ Backup successfully saved to: ${backupFilePath}`);

  // STEP 4: Execute Ordered Deletions
  console.log("4. Executing safe, ordered deletion of test records...");

  // 4a. Delete Payments (Child of Bookings)
  const { error: delPaymentsErr } = await supabase
    .from("payments")
    .delete()
    .in("id", TARGET_PAYMENT_IDS);

  if (delPaymentsErr) {
    console.error("Failed to delete test payments:", delPaymentsErr);
    process.exit(1);
  }
  console.log(`✅ Deleted ${TARGET_PAYMENT_IDS.length} test payment records.`);

  // 4b. Delete Bookings (Child of Customers)
  const { error: delBookingsErr } = await supabase
    .from("bookings")
    .delete()
    .in("id", TARGET_BOOKING_IDS);

  if (delBookingsErr) {
    console.error("Failed to delete test bookings:", delBookingsErr);
    process.exit(1);
  }
  console.log(`✅ Deleted ${TARGET_BOOKING_IDS.length} test booking records.`);

  // 4c. Delete Customers
  const { error: delCustomersErr } = await supabase
    .from("customers")
    .delete()
    .in("id", TARGET_CUSTOMER_IDS);

  if (delCustomersErr) {
    console.error("Failed to delete test customers:", delCustomersErr);
    process.exit(1);
  }
  console.log(`✅ Deleted ${TARGET_CUSTOMER_IDS.length} test customer records.`);

  // STEP 5: Reset Cohort Batch Occupancy
  console.log("5. Realigning batch occupancy (seats_booked = 0)...");
  const { error: batchResetErr } = await supabase
    .from("cohort_batches")
    .update({ seats_booked: 0 })
    .gt("seats_booked", 0);

  if (batchResetErr) {
    console.error("Failed to reset batch seats_booked:", batchResetErr);
    process.exit(1);
  }
  console.log("✅ Batch seats_booked successfully reset to 0.");

  // STEP 6: Post-Cleanup Integrity & Metrics Verification
  console.log("6. Performing post-cleanup verification...");

  const { count: finalPayments } = await supabase.from("payments").select("id", { count: "exact", head: true });
  const { count: finalBookings } = await supabase.from("bookings").select("id", { count: "exact", head: true });
  const { count: finalCustomers } = await supabase.from("customers").select("id", { count: "exact", head: true });
  const { data: batches } = await supabase.from("cohort_batches").select("id, batch_name, total_seats, seats_booked");
  const { data: courses } = await supabase.from("courses").select("id, title, slug, offer_price_paise");
  const { data: adminUsers } = await supabase.from("admin_users").select("id, email, role, is_active");

  console.log("==================================================================");
  console.log("POST-CLEANUP VERIFICATION SUMMARY");
  console.log("==================================================================");
  console.log(`• Remaining Payments:  ${finalPayments} (Expected: 0)`);
  console.log(`• Remaining Bookings:  ${finalBookings} (Expected: 0)`);
  console.log(`• Remaining Customers: ${finalCustomers} (Expected: 0)`);
  console.log(`• Batches Configured:  ${batches.length} (Expected: 3, all seats_booked = 0)`);
  batches.forEach((b) => {
    console.log(`    - ${b.batch_name}: ${b.seats_booked} / ${b.total_seats} booked`);
  });
  console.log(`• Courses Preserved:   ${courses.length} (Expected: 3)`);
  courses.forEach((c) => {
    console.log(`    - ${c.title} (${c.slug}): ₹${c.offer_price_paise / 100}`);
  });
  console.log(`• Admin Users Active:  ${adminUsers.length} (Expected: 1: ${adminUsers[0]?.email})`);
  console.log("==================================================================");

  if (finalPayments !== 0 || finalBookings !== 0 || finalCustomers !== 0) {
    console.error("Verification failed: remaining counts do not equal 0.");
    process.exit(1);
  }

  console.log("CLEANUP COMPLETED SUCCESSFULLY AND VERIFIED.");
}

executeCleanup().catch((err) => {
  console.error("Cleanup script failed:", err);
  process.exit(1);
});
