// ==============================================================================
// Renuka Art Studio - Dynamic Course Batches & Admin Scheduling Test Suite
// Verifies:
// 1. Asia/Kolkata (IST) date and time formatting
// 2. Registration deadline expiration detection in IST timezone
// 3. Admin date validation rules:
//    - Registration deadline one day before class: accepted
//    - Registration deadline equal to class date: accepted
//    - Registration deadline after class date: rejected ("The registration deadline must not be after the batch start date.")
// 4. Same-day bookings up to class start time:
//    - Class at 6:00 PM IST, booking at 5:59 PM IST: allowed
//    - Booking at or after registration cutoff (6:00 PM IST): rejected
//    - Booking after class start: rejected
// 5. Registration status closed: rejected
// 6. Capacity protection and seat allocation: sold out rejected
// 7. Midnight timezone handling in Asia/Kolkata
// ==============================================================================

import assert from "node:assert";
import fs from "node:fs";

console.log("==================================================================");
console.log("RUNNING BATCH REGISTRATION DEADLINE & SAME-DAY BOOKING TEST SUITE");
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
  formatBatchDateIST,
  formatBatchTimeIST,
  isRegistrationDeadlineExpired,
  getTodayISTString,
  getNowIST,
  parseStartTimeToHoursMinutes,
  deriveBatchStatus,
} from "../lib/batches-admin/format.ts";

import { batchScheduleSchema } from "../lib/validations/batch-schedule.ts";

// ------------------------------------------------------------------------------
// Test 1: IST Date & Time Formatting
// ------------------------------------------------------------------------------
runTest("Test 1: IST Date formatting formats YYYY-MM-DD correctly in English/IST", () => {
  const formatted = formatBatchDateIST("2026-10-25");
  assert.ok(formatted.includes("2026"), `Expected year 2026, got: ${formatted}`);
  assert.ok(formatted.includes("October") || formatted.includes("Oct"), `Expected month October, got: ${formatted}`);
  assert.ok(formatted.includes("25"), `Expected day 25, got: ${formatted}`);

  assert.strictEqual(formatBatchDateIST(null), "To be announced");
  assert.strictEqual(formatBatchDateIST(undefined), "To be announced");
  assert.strictEqual(formatBatchDateIST(""), "To be announced");
});

runTest("Test 2: IST Time formatting handles 12h/24h strings", () => {
  assert.strictEqual(formatBatchTimeIST("10:00 AM"), "10:00 AM IST");
  assert.strictEqual(formatBatchTimeIST("10:00 AM IST"), "10:00 AM IST");
  assert.strictEqual(formatBatchTimeIST("06:30 PM", "08:30 PM"), "06:30 PM – 08:30 PM IST");
  assert.strictEqual(formatBatchTimeIST(""), "TBA");
});

// ------------------------------------------------------------------------------
// Scenario 1: Registration deadline one day before class: accepted
// ------------------------------------------------------------------------------
runTest("Scenario 1: Registration deadline one day before class is accepted", () => {
  const payload = {
    batchName: "Live Masterclass — 14 Nov 2026",
    startDate: "2026-11-14",
    lastRegistrationDate: "2026-11-13", // one day before
    startTime: "11:00 AM",
    endTime: "1:00 PM",
    status: "open",
    totalSeats: 100,
  };

  const result = batchScheduleSchema.safeParse(payload);
  assert.strictEqual(result.success, true, `Expected validation to pass: ${JSON.stringify(result.error?.issues)}`);
});

// ------------------------------------------------------------------------------
// Scenario 2: Registration deadline equal to class date: accepted
// ------------------------------------------------------------------------------
runTest("Scenario 2: Registration deadline equal to class date is accepted", () => {
  const payload = {
    batchName: "Live Masterclass — 14 Nov 2026",
    startDate: "2026-11-14",
    lastRegistrationDate: "2026-11-14", // same calendar day
    startTime: "6:00 PM",
    endTime: "8:00 PM",
    status: "open",
    totalSeats: 100,
  };

  const result = batchScheduleSchema.safeParse(payload);
  assert.strictEqual(result.success, true, `Expected validation to pass: ${JSON.stringify(result.error?.issues)}`);
});

// ------------------------------------------------------------------------------
// Scenario 3: Registration deadline after class date: rejected
// ------------------------------------------------------------------------------
runTest("Scenario 3: Registration deadline after class date is rejected", () => {
  const payload = {
    batchName: "Live Masterclass — 14 Nov 2026",
    startDate: "2026-11-14",
    lastRegistrationDate: "2026-11-15", // after class date -> invalid
    startTime: "6:00 PM",
    endTime: "8:00 PM",
    status: "open",
    totalSeats: 100,
  };

  const result = batchScheduleSchema.safeParse(payload);
  assert.strictEqual(result.success, false, "Should fail when lastRegistrationDate > startDate");
  const issue = result.error?.issues.find((i) => i.path.includes("lastRegistrationDate"));
  assert.ok(issue, "Must have an issue on lastRegistrationDate");
  assert.strictEqual(
    issue.message,
    "The registration deadline must not be after the batch start date."
  );
});

// ------------------------------------------------------------------------------
// Scenario 4: Class starts at 6:00 PM IST and customer attempts to book at 5:59 PM IST: allowed
// ------------------------------------------------------------------------------
runTest("Scenario 4: Customer booking at 5:59 PM IST for a 6:00 PM IST class is allowed", () => {
  // 5:59:00 PM IST is 12:29:00 UTC (17:59 IST)
  const attemptTime = new Date("2026-11-14T12:29:00Z");

  const isExpired = isRegistrationDeadlineExpired("2026-11-14", attemptTime, {
    startDate: "2026-11-14",
    startTime: "6:00 PM",
  });

  assert.strictEqual(isExpired, false, "Booking at 5:59 PM IST should NOT be expired for a 6:00 PM IST class");
});

// ------------------------------------------------------------------------------
// Scenario 5: Customer attempts to book at or after the registration cutoff: rejected
// ------------------------------------------------------------------------------
runTest("Scenario 5: Customer booking at or after registration cutoff is rejected", () => {
  // Exactly at 6:00:00 PM IST (12:30:00 UTC)
  const atCutoffTime = new Date("2026-11-14T12:30:00Z");
  const isExpiredAtCutoff = isRegistrationDeadlineExpired("2026-11-14", atCutoffTime, {
    startDate: "2026-11-14",
    startTime: "6:00 PM",
  });
  assert.strictEqual(isExpiredAtCutoff, true, "Booking at 6:00 PM IST sharp should be expired/cutoff");

  // Deadline on previous day (2026-11-13) attempted on class day (2026-11-14)
  const dayAfterDeadline = new Date("2026-11-14T05:00:00Z"); // 10:30 AM IST on 14 Nov
  const isExpiredPastDay = isRegistrationDeadlineExpired("2026-11-13", dayAfterDeadline, {
    startDate: "2026-11-14",
    startTime: "6:00 PM",
  });
  assert.strictEqual(isExpiredPastDay, true, "Booking after deadline day has passed must be expired");
});

// ------------------------------------------------------------------------------
// Scenario 6: Customer attempts to book after class start: rejected
// ------------------------------------------------------------------------------
runTest("Scenario 6: Customer booking after class start is rejected", () => {
  // 6:01:00 PM IST is 12:31:00 UTC
  const afterStartTime = new Date("2026-11-14T12:31:00Z");
  const isExpiredAfter = isRegistrationDeadlineExpired("2026-11-14", afterStartTime, {
    startDate: "2026-11-14",
    startTime: "6:00 PM",
  });
  assert.strictEqual(isExpiredAfter, true, "Booking at 6:01 PM IST after class start must be rejected");

  // Attempting next day after class completed
  const nextDay = new Date("2026-11-15T04:00:00Z");
  const isExpiredNextDay = isRegistrationDeadlineExpired("2026-11-14", nextDay, {
    startDate: "2026-11-14",
    startTime: "6:00 PM",
  });
  assert.strictEqual(isExpiredNextDay, true, "Booking after class date has passed must be rejected");
});

// ------------------------------------------------------------------------------
// Scenario 7: Registration status is closed: booking rejected
// ------------------------------------------------------------------------------
runTest("Scenario 7: Registration status closed is derived as closed", () => {
  const statusClosed = deriveBatchStatus({
    isEnrollmentOpen: false,
    lastRegistrationDate: "2099-12-31",
    startDate: "2099-12-31",
    startTime: "6:00 PM",
  });
  assert.strictEqual(statusClosed, "closed", "deriveBatchStatus must return 'closed' when isEnrollmentOpen is false");
});

// ------------------------------------------------------------------------------
// Scenario 8: Booking/payment validation and capacity protection continue to work correctly
// ------------------------------------------------------------------------------
runTest("Scenario 8: Capacity protection marks batch as closed when sold out", () => {
  const statusSoldOut = deriveBatchStatus({
    isEnrollmentOpen: true,
    lastRegistrationDate: "2099-12-31",
    startDate: "2099-12-31",
    startTime: "6:00 PM",
    isSoldOut: true,
  });
  assert.strictEqual(statusSoldOut, "closed", "deriveBatchStatus must return 'closed' when sold out");
});

// ------------------------------------------------------------------------------
// Scenario 9: Date validation behaves correctly around midnight in Asia/Kolkata
// ------------------------------------------------------------------------------
runTest("Scenario 9: Date validation behaves correctly around midnight in Asia/Kolkata", () => {
  // 11:59:59 PM IST on 13 Nov 2026 is 18:29:59 UTC on 13 Nov 2026
  const beforeMidnightUTC = new Date("2026-11-13T18:29:59Z");
  const beforeMidnightIST = getNowIST(beforeMidnightUTC);
  assert.strictEqual(beforeMidnightIST.dateStr, "2026-11-13");
  assert.strictEqual(beforeMidnightIST.hours, 23);
  assert.strictEqual(beforeMidnightIST.minutes, 59);

  // 12:00:00 AM (midnight) IST on 14 Nov 2026 is 18:30:00 UTC on 13 Nov 2026
  const atMidnightUTC = new Date("2026-11-13T18:30:00Z");
  const atMidnightIST = getNowIST(atMidnightUTC);
  assert.strictEqual(atMidnightIST.dateStr, "2026-11-14");
  assert.strictEqual(atMidnightIST.hours, 0);
  assert.strictEqual(atMidnightIST.minutes, 0);

  // At midnight on the class date (Nov 14), booking for a 6:00 PM class should be allowed
  const isExpiredAtMidnight = isRegistrationDeadlineExpired("2026-11-14", atMidnightUTC, {
    startDate: "2026-11-14",
    startTime: "6:00 PM",
  });
  assert.strictEqual(isExpiredAtMidnight, false, "At midnight on class day, registration must remain open");

  // If deadline was 2026-11-13, at midnight of 2026-11-14 (18:30:00 UTC), deadline is now expired
  const isExpiredPrevDeadlineAtMidnight = isRegistrationDeadlineExpired("2026-11-13", atMidnightUTC, {
    startDate: "2026-11-14",
    startTime: "6:00 PM",
  });
  assert.strictEqual(isExpiredPrevDeadlineAtMidnight, true, "Deadline of 13 Nov must be expired once 14 Nov begins");
});

// ------------------------------------------------------------------------------
// Test Time String Parser helper
// ------------------------------------------------------------------------------
runTest("Test Time Parser: Handles diverse time formats accurately", () => {
  assert.deepStrictEqual(parseStartTimeToHoursMinutes("6:00 PM"), { hours: 18, minutes: 0 });
  assert.deepStrictEqual(parseStartTimeToHoursMinutes("6:00 PM IST"), { hours: 18, minutes: 0 });
  assert.deepStrictEqual(parseStartTimeToHoursMinutes("11:00 AM"), { hours: 11, minutes: 0 });
  assert.deepStrictEqual(parseStartTimeToHoursMinutes("11:30 AM – 1:30 PM IST"), { hours: 11, minutes: 30 });
  assert.deepStrictEqual(parseStartTimeToHoursMinutes("18:30"), { hours: 18, minutes: 30 });
  assert.deepStrictEqual(parseStartTimeToHoursMinutes("12:00 PM"), { hours: 12, minutes: 0 });
  assert.deepStrictEqual(parseStartTimeToHoursMinutes("12:00 AM"), { hours: 0, minutes: 0 });
  assert.strictEqual(parseStartTimeToHoursMinutes(""), null);
  assert.strictEqual(parseStartTimeToHoursMinutes(null), null);
});

console.log("==================================================================");
console.log(`TEST RESULTS: ${passedTests} passed, ${failedTests} failed.`);
console.log("==================================================================");

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
