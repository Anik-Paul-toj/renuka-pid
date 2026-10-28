// ==============================================================================
// Renuka Art Studio - Roadmap Header CTA & Authoritative Registration Status Test Suite
// Verifies:
// 1. Roadmap registration open -> header "BOOK NOW" is enabled
// 2. Roadmap registration closed -> header CTA is disabled, displays "Registration Closed",
//    and cannot initiate checkout/modal
// 3. Shared helper `isBatchRegistrationOpen` enforces identical authoritative logic
// 4. Registration deadline passed -> booking creation & payment orders rejected
// 5. Same-day registration before cutoff -> booking is allowed
// 6. Class already started -> booking is rejected
// 7. Foundation and Artistry + Foundation registration flows remain completely independent
// 8. Fail-safe behavior when data is missing or loading -> defaults to closed
// ==============================================================================

import assert from "node:assert";
import fs from "node:fs";

console.log("==================================================================");
console.log("RUNNING ROADMAP HEADER CTA & REGISTRATION STATUS TEST SUITE");
console.log("==================================================================");

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failedTests++;
  }
}

// ------------------------------------------------------------------------------
// Import Local Modules
// ------------------------------------------------------------------------------
import {
  isRegistrationDeadlineExpired,
  isBatchRegistrationOpen,
  deriveBatchStatus,
  getNowIST,
} from "../lib/batches-admin/format.ts";

// ------------------------------------------------------------------------------
// Test 1: Shared Helper isBatchRegistrationOpen - Fail-safe on missing/loading data
// ------------------------------------------------------------------------------
runTest("Test 1: Fails safely (closed) when batch data is null, undefined, or missing", () => {
  assert.deepStrictEqual(isBatchRegistrationOpen(null), { isOpen: false, reason: "not_open" });
  assert.deepStrictEqual(isBatchRegistrationOpen(undefined), { isOpen: false, reason: "not_open" });
  assert.deepStrictEqual(isBatchRegistrationOpen({ isEnrollmentOpen: false }), { isOpen: false, reason: "not_open" });
});

// ------------------------------------------------------------------------------
// Test 2: Shared Helper isBatchRegistrationOpen - Open state
// ------------------------------------------------------------------------------
runTest("Test 2: Authoritatively allows registration when batch is open and deadline is in the future", () => {
  const openBatch = {
    isEnrollmentOpen: true,
    startDate: "2099-12-31",
    startTime: "6:00 PM",
    lastRegistrationDate: "2099-12-30",
    totalSeats: 100,
    seatsBooked: 10,
    isSoldOut: false,
  };
  const result = isBatchRegistrationOpen(openBatch);
  assert.strictEqual(result.isOpen, true);
  assert.strictEqual(result.reason, undefined);
});

// ------------------------------------------------------------------------------
// Test 3: Shared Helper isBatchRegistrationOpen - Sold out state
// ------------------------------------------------------------------------------
runTest("Test 3: Authoritatively rejects registration when batch is sold out", () => {
  const soldOutBatch1 = {
    isEnrollmentOpen: true,
    startDate: "2099-12-31",
    isSoldOut: true,
  };
  assert.deepStrictEqual(isBatchRegistrationOpen(soldOutBatch1), { isOpen: false, reason: "sold_out" });

  const soldOutBatch2 = {
    isEnrollmentOpen: true,
    startDate: "2099-12-31",
    totalSeats: 50,
    seatsBooked: 50,
  };
  assert.deepStrictEqual(isBatchRegistrationOpen(soldOutBatch2), { isOpen: false, reason: "sold_out" });
});

// ------------------------------------------------------------------------------
// Test 4: Same-day class registration before cutoff is allowed
// ------------------------------------------------------------------------------
runTest("Test 4: Same-day registration before class start time in Asia/Kolkata is allowed", () => {
  // Class on 2026-11-14 at 6:30 PM IST (18:30)
  // Customer attempts to book at 6:29 PM IST (12:59 UTC)
  const attemptTime = new Date("2026-11-14T12:59:00Z");
  const batch = {
    isEnrollmentOpen: true,
    startDate: "2026-11-14",
    startTime: "6:30 PM",
    lastRegistrationDate: "2026-11-14",
    totalSeats: 100,
    seatsBooked: 5,
  };

  const result = isBatchRegistrationOpen(batch, attemptTime);
  assert.strictEqual(result.isOpen, true, "Registration must remain open before class start time");
});

// ------------------------------------------------------------------------------
// Test 5: Same-day class registration after class start is rejected
// ------------------------------------------------------------------------------
runTest("Test 5: Registration at or after class start time is expired and rejected", () => {
  // Class at 6:30 PM IST (13:00 UTC)
  // Attempt at 6:30:00 PM IST (13:00 UTC)
  const atCutoffTime = new Date("2026-11-14T13:00:00Z");
  const batch = {
    isEnrollmentOpen: true,
    startDate: "2026-11-14",
    startTime: "6:30 PM",
    lastRegistrationDate: "2026-11-14",
    totalSeats: 100,
    seatsBooked: 5,
  };

  const resultAtCutoff = isBatchRegistrationOpen(batch, atCutoffTime);
  assert.deepStrictEqual(resultAtCutoff, { isOpen: false, reason: "expired" });

  // Attempt after class start e.g. 7:00 PM IST (13:30 UTC)
  const afterStartTime = new Date("2026-11-14T13:30:00Z");
  const resultAfterStart = isBatchRegistrationOpen(batch, afterStartTime);
  assert.deepStrictEqual(resultAfterStart, { isOpen: false, reason: "expired" });
});

// ------------------------------------------------------------------------------
// Test 6: Registration deadline passed rejects new bookings
// ------------------------------------------------------------------------------
runTest("Test 6: Booking rejected when deadline date has passed", () => {
  // Deadline was 2026-11-10, attempt on 2026-11-11
  const attemptDate = new Date("2026-11-11T08:00:00Z");
  const batch = {
    isEnrollmentOpen: true,
    startDate: "2026-11-14",
    startTime: "6:30 PM",
    lastRegistrationDate: "2026-11-10",
  };

  const result = isBatchRegistrationOpen(batch, attemptDate);
  assert.deepStrictEqual(result, { isOpen: false, reason: "expired" });
});

// ------------------------------------------------------------------------------
// Test 7: Verify Live Roadmap Masterclass Batch Status (Current DB record)
// ------------------------------------------------------------------------------
runTest("Test 7: Live Roadmap Batch (28 Oct 2026, 6:30 PM) is expired for past current time", () => {
  // Live batch from DB: start_date: 2026-10-28, start_time: "6:30 PM"
  // If tested at 8:22 PM IST or 9:30 PM IST on 2026-10-28:
  const liveTime = new Date("2026-10-28T15:00:00Z"); // 8:30 PM IST
  const liveRoadmapBatch = {
    isEnrollmentOpen: true,
    startDate: "2026-10-28",
    startTime: "6:30 PM",
    lastRegistrationDate: "2026-10-28",
    totalSeats: 200,
    seatsBooked: 1,
  };

  const res = isBatchRegistrationOpen(liveRoadmapBatch, liveTime);
  assert.strictEqual(res.isOpen, false, "Live roadmap batch must be closed after 6:30 PM IST on 28 Oct 2026");
  assert.strictEqual(res.reason, "expired");
});

// ------------------------------------------------------------------------------
// Test 8: Navbar component code inspection for registration closed state & guards
// ------------------------------------------------------------------------------
runTest("Test 8: Navbar.tsx contains authoritative registration closed guard and disabled button", () => {
  const navbarContent = fs.readFileSync("components/Navbar.tsx", "utf-8");
  assert.ok(
    navbarContent.includes("isRegistrationClosed"),
    "Navbar must support isRegistrationClosed prop"
  );
  assert.ok(
    navbarContent.includes("Registration Closed"),
    "Navbar must render 'Registration Closed' when closed"
  );
  assert.ok(
    navbarContent.includes("effectiveRegistrationClosed"),
    "Navbar must enforce effectiveRegistrationClosed guard"
  );
  assert.ok(
    navbarContent.includes("disabled"),
    "Button must have disabled attribute when registration is closed"
  );
});

// ------------------------------------------------------------------------------
// Test 9: LandingPageClient.tsx code inspection for Roadmap modal opening prevention
// ------------------------------------------------------------------------------
runTest("Test 9: LandingPageClient.tsx guards modal opening and passes closed state to Navbar", () => {
  const landingContent = fs.readFileSync("components/LandingPageClient.tsx", "utf-8");
  assert.ok(
    landingContent.includes("if (isRegistrationClosed) return;"),
    "handleOpenModal must immediately return without opening modal if registration is closed"
  );
  assert.ok(
    landingContent.includes("<Navbar"),
    "Must render Navbar"
  );
  assert.ok(
    landingContent.includes("isRegistrationClosed={isRegistrationClosed}"),
    "Must pass isRegistrationClosed to Navbar"
  );
  assert.ok(
    landingContent.includes("initialBatch"),
    "Must accept and utilize initialBatch from server"
  );
});

// ------------------------------------------------------------------------------
// Test 10: CourseDetailPageClient.tsx code inspection - Foundation courses unaffected
// ------------------------------------------------------------------------------
runTest("Test 10: CourseDetailPageClient.tsx independently manages its own registration status", () => {
  const detailContent = fs.readFileSync("components/course/CourseDetailPageClient.tsx", "utf-8");
  assert.ok(
    detailContent.includes("<Navbar"),
    "CourseDetailPageClient must render Navbar"
  );
  assert.ok(
    detailContent.includes("isRegistrationClosed={isRegistrationClosed}"),
    "CourseDetailPageClient passes its own course isRegistrationClosed to Navbar"
  );
  assert.ok(
    detailContent.includes("!isRegistrationClosed && setIsModalOpen(true)"),
    "CourseDetailPageClient guards modal opening with its own registration status"
  );
});

// ------------------------------------------------------------------------------
// Test 11: Server-side Payment Service Guard Inspection
// ------------------------------------------------------------------------------
runTest("Test 11: lib/payment/service.ts rejects order creation when batch registration is closed/expired", () => {
  const paymentContent = fs.readFileSync("lib/payment/service.ts", "utf-8");
  assert.ok(
    paymentContent.includes("isRegistrationDeadlineExpired"),
    "Payment service must import isRegistrationDeadlineExpired"
  );
  assert.ok(
    paymentContent.includes("ENROLLMENT_CLOSED"),
    "Payment service must return ENROLLMENT_CLOSED if batch registration expired"
  );
  assert.ok(
    paymentContent.includes("Registration for this batch has closed as the deadline has passed."),
    "Payment service must return proper error message"
  );
});

// ------------------------------------------------------------------------------
// Test 12: Server-side Booking Service Guard Inspection
// ------------------------------------------------------------------------------
runTest("Test 12: lib/booking/service.ts rejects booking when batch registration is closed/expired", () => {
  const bookingContent = fs.readFileSync("lib/booking/service.ts", "utf-8");
  assert.ok(
    bookingContent.includes("isRegistrationDeadlineExpired"),
    "Booking service must import isRegistrationDeadlineExpired"
  );
  assert.ok(
    bookingContent.includes("ENROLLMENT_CLOSED"),
    "Booking service must return ENROLLMENT_CLOSED when deadline passed or enrollment closed"
  );
});

console.log("==================================================================");
console.log(`TEST RESULTS: ${passedTests} passed, ${failedTests} failed.`);
console.log("==================================================================");

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

