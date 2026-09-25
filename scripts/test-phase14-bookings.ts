import { createClient } from "@supabase/supabase-js";
import {
  getBookingsList,
  getBookingDetailsById,
  cancelBookingById,
} from "../lib/bookings-admin/service";
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
  console.log("PHASE 14 — BOOKING MANAGEMENT SYSTEM TEST SUITE");
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
      .select("id, batch_name, seats_booked, total_seats, courses(id, title)")
      .eq("is_enrollment_open", true)
      .limit(1)
      .single();

    if (!batch) throw new Error("No active batch found.");

    const testTag = Date.now().toString(36);

    // Create Test Customer 1 (Confirmed booking + captured payment)
    const email1 = `rohit.${testTag}@booking.test`;
    const { data: cust1 } = await adminClient
      .from("customers")
      .insert({
        full_name: "Rohit Verma",
        email: email1,
        phone: "+91 98333 44455",
        whatsapp_phone: "+91 98333 44455",
      })
      .select()
      .single();
    cleanupIds.customerIds.push(cust1!.id);

    const ref1 = `REF-PH14-A-${testTag}`;
    const { data: book1 } = await adminClient
      .from("bookings")
      .insert({
        booking_reference: ref1,
        customer_id: cust1!.id,
        batch_id: batch.id,
        status: "confirmed",
        amount_paise: 19900,
        currency: "INR",
        seat_released: false,
      })
      .select()
      .single();
    cleanupIds.bookingIds.push(book1!.id);

    const { data: pmt1 } = await adminClient
      .from("payments")
      .insert({
        booking_id: book1!.id,
        razorpay_order_id: `order_PH14_A_${testTag}`,
        razorpay_payment_id: `pay_PH14_A_${testTag}`,
        amount_paise: 19900,
        currency: "INR",
        status: "captured",
      })
      .select()
      .single();
    cleanupIds.paymentIds.push(pmt1!.id);

    // Create Test Customer 2 (Pending booking + failed payment)
    const email2 = `simran.${testTag}@booking.test`;
    const { data: cust2 } = await adminClient
      .from("customers")
      .insert({
        full_name: "Simran Kaur",
        email: email2,
        phone: "+91 98444 55566",
        whatsapp_phone: "+91 98444 55566",
      })
      .select()
      .single();
    cleanupIds.customerIds.push(cust2!.id);

    const ref2 = `REF-PH14-B-${testTag}`;
    const { data: book2 } = await adminClient
      .from("bookings")
      .insert({
        booking_reference: ref2,
        customer_id: cust2!.id,
        batch_id: batch.id,
        status: "pending",
        amount_paise: 19900,
        currency: "INR",
        seat_released: false,
      })
      .select()
      .single();
    cleanupIds.bookingIds.push(book2!.id);

    const { data: pmt2 } = await adminClient
      .from("payments")
      .insert({
        booking_id: book2!.id,
        razorpay_order_id: `order_PH14_B_${testTag}`,
        amount_paise: 19900,
        currency: "INR",
        status: "failed",
      })
      .select()
      .single();
    cleanupIds.paymentIds.push(pmt2!.id);

    // --------------------------------------------------------------------------
    // 1. LISTING & PAGINATION TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 1. LISTING & PAGINATION TESTS ---");
    const listRes = await getBookingsList({
      page: 1,
      limit: 20,
      search: "",
      status: "all",
      paymentStatus: "all",
      batchId: "all",
    });

    if (listRes.success && listRes.data.bookings.length >= 2) {
      pass("1. Admin can list bookings with populated customer and batch joins");
    } else {
      fail("1. Admin bookings list failed", listRes);
    }

    // Pagination test (page 1 vs page 2)
    const page1Res = await getBookingsList({
      page: 1,
      limit: 1,
      search: "",
      status: "all",
      paymentStatus: "all",
      batchId: "all",
    });

    const page2Res = await getBookingsList({
      page: 2,
      limit: 1,
      search: "",
      status: "all",
      paymentStatus: "all",
      batchId: "all",
    });

    if (
      page1Res.success &&
      page2Res.success &&
      page1Res.data.bookings.length === 1 &&
      page2Res.data.bookings.length === 1 &&
      page1Res.data.bookings[0].id !== page2Res.data.bookings[0].id &&
      page1Res.data.pagination.hasNext
    ) {
      pass("2. Server-side pagination offsets and limits booking records accurately");
    } else {
      fail("2. Pagination test failed", { page1Res, page2Res });
    }

    // --------------------------------------------------------------------------
    // 2. SEARCH TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 2. SEARCH TESTS ---");
    // Search by Reference
    const searchRef = await getBookingsList({
      page: 1,
      limit: 10,
      search: ref1,
      status: "all",
      paymentStatus: "all",
      batchId: "all",
    });

    if (
      searchRef.success &&
      searchRef.data.bookings.some((b) => b.bookingReference === ref1) &&
      !searchRef.data.bookings.some((b) => b.bookingReference === ref2)
    ) {
      pass("3. Search by booking reference works accurately");
    } else {
      fail("3. Search by reference failed", searchRef);
    }

    // Search by Customer Name
    const searchName = await getBookingsList({
      page: 1,
      limit: 10,
      search: "Rohit Verma",
      status: "all",
      paymentStatus: "all",
      batchId: "all",
    });

    if (
      searchName.success &&
      searchName.data.bookings.some((b) => b.customerName === "Rohit Verma")
    ) {
      pass("4. Search by customer name works accurately");
    } else {
      fail("4. Search by name failed", searchName);
    }

    // Search by Email
    const searchEmail = await getBookingsList({
      page: 1,
      limit: 10,
      search: email2,
      status: "all",
      paymentStatus: "all",
      batchId: "all",
    });

    if (
      searchEmail.success &&
      searchEmail.data.bookings.some((b) => b.customerEmail === email2) &&
      !searchEmail.data.bookings.some((b) => b.customerEmail === email1)
    ) {
      pass("5. Search by customer email works accurately");
    } else {
      fail("5. Search by email failed", searchEmail);
    }

    // Search by Phone
    const searchPhone = await getBookingsList({
      page: 1,
      limit: 10,
      search: "98333 44455",
      status: "all",
      paymentStatus: "all",
      batchId: "all",
    });

    if (
      searchPhone.success &&
      searchPhone.data.bookings.some((b) => b.bookingReference === ref1)
    ) {
      pass("6. Search by customer phone works accurately");
    } else {
      fail("6. Search by phone failed", searchPhone);
    }

    // --------------------------------------------------------------------------
    // 3. FILTERING TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 3. FILTERING TESTS ---");
    // Booking Status Filter: confirmed
    const filterConfirmed = await getBookingsList({
      page: 1,
      limit: 20,
      search: testTag,
      status: "confirmed",
      paymentStatus: "all",
      batchId: "all",
    });

    if (
      filterConfirmed.success &&
      filterConfirmed.data.bookings.some((b) => b.bookingReference === ref1) &&
      !filterConfirmed.data.bookings.some((b) => b.bookingReference === ref2)
    ) {
      pass("7. Booking status filter ('confirmed') isolates confirmed bookings");
    } else {
      fail("7. Confirmed status filter failed", filterConfirmed);
    }

    // Payment Status Filter: captured
    const filterCaptured = await getBookingsList({
      page: 1,
      limit: 20,
      search: testTag,
      status: "all",
      paymentStatus: "captured",
      batchId: "all",
    });

    if (
      filterCaptured.success &&
      filterCaptured.data.bookings.some((b) => b.bookingReference === ref1) &&
      !filterCaptured.data.bookings.some((b) => b.bookingReference === ref2)
    ) {
      pass("8. Payment status filter ('captured') isolates paid bookings");
    } else {
      fail("8. Captured payment filter failed", filterCaptured);
    }

    // Batch Filter
    const filterBatch = await getBookingsList({
      page: 1,
      limit: 20,
      search: testTag,
      status: "all",
      paymentStatus: "all",
      batchId: batch.id,
    });

    if (
      filterBatch.success &&
      filterBatch.data.bookings.length >= 2 &&
      filterBatch.data.bookings.every((b) => b.batchId === batch.id)
    ) {
      pass("9. Batch filter accurately isolates bookings for a specific cohort batch");
    } else {
      fail("9. Batch filter failed", filterBatch);
    }

    // --------------------------------------------------------------------------
    // 4. BOOKING DETAIL & DATA HYGIENE
    // --------------------------------------------------------------------------
    console.log("\n--- 4. BOOKING DETAIL & DATA HYGIENE ---");
    const detail1 = await getBookingDetailsById(book1!.id);

    if (detail1.success && detail1.data.bookingReference === ref1) {
      pass("10. Booking detail endpoint returns valid reservation record");
    } else {
      fail("10. Booking detail failed", detail1);
    }

    if (
      detail1.success &&
      detail1.data.customer.fullName === "Rohit Verma" &&
      detail1.data.customer.email === email1 &&
      detail1.data.course.title &&
      detail1.data.batch.batchName
    ) {
      pass("11. Correct customer and course details linked in booking detail");
    } else {
      fail("11. Linked details mismatch", detail1);
    }

    if (
      detail1.success &&
      detail1.data.payments.length >= 1 &&
      detail1.data.payments[0].razorpayPaymentId === `pay_PH14_A_${testTag}` &&
      detail1.data.payments[0].status === "captured"
    ) {
      pass("12. Safe payment order and payment ID records displayed in detail view");
    } else {
      fail("12. Payment record mismatch", detail1);
    }

    // Sensitive field leak check
    const rawDetailJSON = JSON.stringify(detail1);
    if (
      !rawDetailJSON.includes("razorpay_signature") &&
      !rawDetailJSON.includes("payload_snapshot") &&
      !rawDetailJSON.includes("webhook_secret")
    ) {
      pass("13. Zero sensitive payment credentials (signatures, raw snapshots) exposed");
    } else {
      fail("13. Sensitive credentials leaked in booking detail", detail1);
    }

    // --------------------------------------------------------------------------
    // 5. ATOMIC CANCELLATION & SEAT SAFETY TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 5. ATOMIC CANCELLATION & SEAT SAFETY TESTS ---");
    // Verify initial seats_booked
    const { data: batchBefore } = await adminClient
      .from("cohort_batches")
      .select("seats_booked, total_seats")
      .eq("id", batch.id)
      .single();

    const seatsBefore = batchBefore!.seats_booked;

    // Increment seat by 1 to simulate active hold on book2
    await adminClient
      .from("cohort_batches")
      .update({ seats_booked: seatsBefore + 1 })
      .eq("id", batch.id);

    // Cancel book2 atomically
    const cancelRes = await cancelBookingById(book2!.id, "admin_cancelled");

    if (cancelRes.success && !cancelRes.alreadyReleased) {
      pass("14. Admin can safely cancel pending booking using atomic release RPC");
    } else {
      fail("14. Booking cancellation failed", cancelRes);
    }

    // Verify seat count decremented
    const { data: batchAfter } = await adminClient
      .from("cohort_batches")
      .select("seats_booked, total_seats")
      .eq("id", batch.id)
      .single();

    if (batchAfter!.seats_booked === seatsBefore) {
      pass("15. Seat safety verified: seats_booked decremented by exactly 1");
    } else {
      fail("15. Seat count mismatch after cancellation", { seatsBefore, after: batchAfter?.seats_booked });
    }

    // Idempotent re-cancellation test: must NOT decrement seat twice
    const reCancelRes = await cancelBookingById(book2!.id, "admin_cancelled");
    const { data: batchAfterReCancel } = await adminClient
      .from("cohort_batches")
      .select("seats_booked")
      .eq("id", batch.id)
      .single();

    if (
      reCancelRes.success &&
      reCancelRes.alreadyReleased &&
      batchAfterReCancel!.seats_booked === seatsBefore
    ) {
      pass("16. Idempotency verified: repeated cancellation cannot decrement seats twice");
    } else {
      fail("16. Double decrement detected on re-cancellation", { reCancelRes, batchAfterReCancel });
    }

    // --------------------------------------------------------------------------
    // 6. ERROR & SECURITY TESTS
    // --------------------------------------------------------------------------
    console.log("\n--- 6. ERROR & SECURITY TESTS ---");
    // Nonexistent booking
    const nonExistent = await getBookingDetailsById("00000000-0000-0000-0000-000000000000");
    if (!nonExistent.success && nonExistent.statusCode === 404) {
      pass("17. Nonexistent booking safely returns 404");
    } else {
      fail("17. Nonexistent booking did not return 404", nonExistent);
    }

    // Anonymous RLS check on bookings table
    const { data: anonBookings } = await anonClient.from("bookings").select("*");
    if (!anonBookings || anonBookings.length === 0) {
      pass("18. Anonymous/unauthenticated client blocked from reading bookings by RLS");
    } else {
      fail("18. Anonymous client read bookings via RLS leak", anonBookings);
    }

    // Client component service-role leak check
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
      pass("19. Zero SUPABASE_SERVICE_ROLE_KEY references in client components");
    } else {
      fail("19. SUPABASE_SERVICE_ROLE_KEY found in client components", null);
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
  console.log(`PHASE 14 TEST SUMMARY: ${passedCount} / ${passedCount + failedCount} TESTS PASSED`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
