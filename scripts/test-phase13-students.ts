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
  console.log("PHASE 13 — STUDENT MANAGEMENT TEST SUITE");
  console.log("==================================================");

  const cleanupIds: {
    customerIds: string[];
    bookingIds: string[];
    paymentIds: string[];
  } = {
    customerIds: [],
    bookingIds: [],
    paymentIds: [],
  };

  try {
    // 1. Fetch active cohort batch
    const { data: batch } = await adminClient
      .from("cohort_batches")
      .select("id, batch_name, courses(id, title)")
      .eq("is_enrollment_open", true)
      .limit(1)
      .single();

    if (!batch) throw new Error("No active cohort batch found.");

    // Create 3 distinct test students with bookings and payments
    const testTag = Date.now().toString(36);

    // Student A: Confirmed booking with captured payment
    const emailA = `arjun.${testTag}@student.test`;
    const { data: custA } = await adminClient
      .from("customers")
      .insert({
        full_name: "Arjun Mehta",
        email: emailA,
        phone: "+91 98111 22233",
        whatsapp_phone: "+91 98111 22233",
      })
      .select()
      .single();
    cleanupIds.customerIds.push(custA!.id);

    const refA = `REF-STU-A-${testTag}`;
    const { data: bookA } = await adminClient
      .from("bookings")
      .insert({
        booking_reference: refA,
        customer_id: custA!.id,
        batch_id: batch.id,
        status: "confirmed",
        amount_paise: 19900,
        currency: "INR",
      })
      .select()
      .single();
    cleanupIds.bookingIds.push(bookA!.id);

    const { data: pmtA } = await adminClient
      .from("payments")
      .insert({
        booking_id: bookA!.id,
        razorpay_order_id: `order_A_${testTag}`,
        razorpay_payment_id: `pay_A_${testTag}`,
        amount_paise: 19900,
        currency: "INR",
        status: "captured",
      })
      .select()
      .single();
    cleanupIds.paymentIds.push(pmtA!.id);

    // Student B: Pending booking with failed payment
    const emailB = `bhavna.${testTag}@student.test`;
    const { data: custB } = await adminClient
      .from("customers")
      .insert({
        full_name: "Bhavna Patel",
        email: emailB,
        phone: "+91 98222 33344",
        whatsapp_phone: "+91 98222 33344",
      })
      .select()
      .single();
    cleanupIds.customerIds.push(custB!.id);

    const refB = `REF-STU-B-${testTag}`;
    const { data: bookB } = await adminClient
      .from("bookings")
      .insert({
        booking_reference: refB,
        customer_id: custB!.id,
        batch_id: batch.id,
        status: "pending",
        amount_paise: 19900,
        currency: "INR",
      })
      .select()
      .single();
    cleanupIds.bookingIds.push(bookB!.id);

    const { data: pmtB } = await adminClient
      .from("payments")
      .insert({
        booking_id: bookB!.id,
        razorpay_order_id: `order_B_${testTag}`,
        amount_paise: 19900,
        currency: "INR",
        status: "failed",
      })
      .select()
      .single();
    cleanupIds.paymentIds.push(pmtB!.id);

    // --------------------------------------------------------------------------
    // 1. DIRECTORY LIST & SUMMARY TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 1. DIRECTORY LIST & SUMMARY TESTS ---");
    const listRes = await getStudentsList({
      page: 1,
      limit: 20,
      search: "",
      status: "all",
      paymentStatus: "all",
    });

    if (listRes.success && listRes.data.students.length >= 2) {
      pass("1. Student directory list queries and returns students array");
    } else {
      fail("1. Student list failed", listRes);
    }

    const foundCustA = listRes.success
      ? listRes.data.students.find((s) => s.id === custA!.id)
      : null;

    if (
      foundCustA &&
      foundCustA.totalBookings >= 1 &&
      foundCustA.confirmedBookings >= 1 &&
      foundCustA.latestBookingStatus === "confirmed" &&
      foundCustA.latestPaymentStatus === "captured"
    ) {
      pass("2. Student record displays calculated booking count and latest payment status");
    } else {
      fail("2. Student record calculated fields mismatch", foundCustA);
    }

    // --------------------------------------------------------------------------
    // 2. PAGINATION TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 2. SERVER-SIDE PAGINATION TESTS ---");
    const page1Res = await getStudentsList({
      page: 1,
      limit: 1,
      search: "",
      status: "all",
      paymentStatus: "all",
    });

    const page2Res = await getStudentsList({
      page: 2,
      limit: 1,
      search: "",
      status: "all",
      paymentStatus: "all",
    });

    if (
      page1Res.success &&
      page2Res.success &&
      page1Res.data.students.length === 1 &&
      page2Res.data.students.length === 1 &&
      page1Res.data.students[0].id !== page2Res.data.students[0].id &&
      page1Res.data.pagination.hasNext
    ) {
      pass("3. Server-side pagination successfully offsets and limits customer records");
    } else {
      fail("3. Pagination test failed", { page1Res, page2Res });
    }

    // --------------------------------------------------------------------------
    // 3. SEARCH TESTS (NAME, EMAIL, PHONE)
    // --------------------------------------------------------------------------
    console.log("\n--- 3. SEARCH TESTS ---");
    // Search by Name
    const nameSearch = await getStudentsList({
      page: 1,
      limit: 10,
      search: "Arjun Mehta",
      status: "all",
      paymentStatus: "all",
    });

    if (
      nameSearch.success &&
      nameSearch.data.students.some((s) => s.id === custA!.id) &&
      !nameSearch.data.students.some((s) => s.id === custB!.id)
    ) {
      pass("4. Search by student name accurately filters directory");
    } else {
      fail("4. Search by name failed", nameSearch);
    }

    // Search by Email
    const emailSearch = await getStudentsList({
      page: 1,
      limit: 10,
      search: emailB,
      status: "all",
      paymentStatus: "all",
    });

    if (
      emailSearch.success &&
      emailSearch.data.students.some((s) => s.id === custB!.id) &&
      !emailSearch.data.students.some((s) => s.id === custA!.id)
    ) {
      pass("5. Search by student email accurately filters directory");
    } else {
      fail("5. Search by email failed", emailSearch);
    }

    // Search by Phone
    const phoneSearch = await getStudentsList({
      page: 1,
      limit: 10,
      search: "98111 22233",
      status: "all",
      paymentStatus: "all",
    });

    if (
      phoneSearch.success &&
      phoneSearch.data.students.some((s) => s.id === custA!.id)
    ) {
      pass("6. Search by phone number accurately filters directory");
    } else {
      fail("6. Search by phone failed", phoneSearch);
    }

    // --------------------------------------------------------------------------
    // 4. FILTERING TESTS (STATUS & PAYMENT STATUS)
    // --------------------------------------------------------------------------
    console.log("\n--- 4. FILTERING TESTS ---");
    // Filter by Confirmed Booking
    const confirmedFilter = await getStudentsList({
      page: 1,
      limit: 20,
      search: testTag,
      status: "confirmed",
      paymentStatus: "all",
    });

    if (
      confirmedFilter.success &&
      confirmedFilter.data.students.some((s) => s.id === custA!.id) &&
      !confirmedFilter.data.students.some((s) => s.id === custB!.id)
    ) {
      pass("7. Booking status filter ('confirmed') accurately filters students");
    } else {
      fail("7. Confirmed status filter failed", confirmedFilter);
    }

    // Filter by Pending Booking
    const pendingFilter = await getStudentsList({
      page: 1,
      limit: 20,
      search: testTag,
      status: "pending",
      paymentStatus: "all",
    });

    if (
      pendingFilter.success &&
      pendingFilter.data.students.some((s) => s.id === custB!.id) &&
      !pendingFilter.data.students.some((s) => s.id === custA!.id)
    ) {
      pass("8. Booking status filter ('pending') accurately filters students");
    } else {
      fail("8. Pending status filter failed", pendingFilter);
    }

    // Filter by Payment Status (captured)
    const paidFilter = await getStudentsList({
      page: 1,
      limit: 20,
      search: testTag,
      status: "all",
      paymentStatus: "captured",
    });

    if (
      paidFilter.success &&
      paidFilter.data.students.some((s) => s.id === custA!.id) &&
      !paidFilter.data.students.some((s) => s.id === custB!.id)
    ) {
      pass("9. Payment status filter ('captured') accurately isolates paid students");
    } else {
      fail("9. Captured payment filter failed", paidFilter);
    }

    // --------------------------------------------------------------------------
    // 5. STUDENT DETAIL & HISTORY TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 5. STUDENT DETAIL & HISTORY TESTS ---");
    const detailA = await getStudentById(custA!.id);

    if (detailA.success && detailA.data.id === custA!.id && detailA.data.fullName === "Arjun Mehta") {
      pass("10. Student detail endpoint returns verified personal info");
    } else {
      fail("10. Student detail failed", detailA);
    }

    if (
      detailA.success &&
      detailA.data.bookings.length >= 1 &&
      detailA.data.bookings[0].bookingReference === refA &&
      detailA.data.bookings[0].status === "confirmed" &&
      detailA.data.bookings[0].courseTitle
    ) {
      pass("11. Student detail accurately links booking history and course info");
    } else {
      fail("11. Booking history in detail mismatch", detailA);
    }

    if (
      detailA.success &&
      detailA.data.bookings[0].payments.length >= 1 &&
      detailA.data.bookings[0].payments[0].razorpayPaymentId === `pay_A_${testTag}` &&
      detailA.data.bookings[0].payments[0].status === "captured"
    ) {
      pass("12. Student detail accurately displays safe payment order and payment ID");
    } else {
      fail("12. Payment history in detail mismatch", detailA);
    }

    // Sensitive field leak prevention check
    const rawDetailJSON = JSON.stringify(detailA);
    if (
      !rawDetailJSON.includes("razorpay_signature") &&
      !rawDetailJSON.includes("payload_snapshot") &&
      !rawDetailJSON.includes("webhook_secret")
    ) {
      pass("13. Zero sensitive payment secrets (signatures, snapshots) exposed in student detail");
    } else {
      fail("13. Sensitive payment credentials leaked in student detail", detailA);
    }

    // --------------------------------------------------------------------------
    // 6. ERROR & SECURITY TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 6. ERROR & SECURITY TESTS ---");
    // Nonexistent student
    const nonExistent = await getStudentById("00000000-0000-0000-0000-000000000000");
    if (!nonExistent.success && nonExistent.statusCode === 404) {
      pass("14. Nonexistent student returns clean 404 error");
    } else {
      fail("14. Nonexistent student did not return 404", nonExistent);
    }

    // Invalid UUID
    const invalidId = await getStudentById("invalid-id-format");
    if (!invalidId.success && invalidId.statusCode === 404) {
      pass("15. Malformed student identifier safely returns 404");
    } else {
      fail("15. Malformed ID did not return 404", invalidId);
    }

    // Anonymous Client RLS check
    const { data: anonData } = await anonClient.from("customers").select("*");
    if (!anonData || anonData.length === 0) {
      pass("16. Anonymous/unauthenticated client blocked from reading customers by RLS");
    } else {
      fail("16. Anonymous client could read customers via RLS leak", anonData);
    }

    // Client components service-role key leak check
    const componentsDir = path.resolve(process.cwd(), "components");
    const componentsFiles = fs.readdirSync(componentsDir, { recursive: true }) as string[];
    let hasServiceRoleLeak = false;

    for (const f of componentsFiles) {
      if (typeof f === "string" && (f.endsWith(".tsx") || f.endsWith(".ts"))) {
        const fullPath = path.join(componentsDir, f);
        if (fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (content.includes("SUPABASE_SERVICE_ROLE_KEY")) {
            hasServiceRoleLeak = true;
            break;
          }
        }
      }
    }

    if (!hasServiceRoleLeak) {
      pass("17. Zero SUPABASE_SERVICE_ROLE_KEY references in client components");
    } else {
      fail("17. SUPABASE_SERVICE_ROLE_KEY found in client components", null);
    }
  } catch (err: any) {
    console.error("Test execution exception:", err);
  } finally {
    console.log("\n--- CLEANING UP TEST FIXTURES ---");
    if (cleanupIds.paymentIds.length > 0) {
      await adminClient.from("payments").delete().in("id", cleanupIds.paymentIds);
    }
    if (cleanupIds.bookingIds.length > 0) {
      await adminClient.from("bookings").delete().in("id", cleanupIds.bookingIds);
    }
    if (cleanupIds.customerIds.length > 0) {
      await adminClient.from("customers").delete().in("id", cleanupIds.customerIds);
    }
    console.log("Cleanup completed.");
  }

  console.log("\n==================================================");
  console.log(`PHASE 13 TEST SUMMARY: ${passedCount} / ${passedCount + failedCount} TESTS PASSED`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
