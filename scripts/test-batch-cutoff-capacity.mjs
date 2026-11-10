import {
  parseStartTimeToHoursMinutes,
  calculateRegistrationClosingDateTime,
  isRegistrationDeadlineExpired,
  isBatchRegistrationOpen,
  formatBatchDateIST,
} from "../lib/batches-admin/format.js";
import { batchScheduleSchema } from "../lib/validations/batch-schedule.js";

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} ${details}`);
    failed++;
  }
}

console.log("=== RUNNING REGISTRATION CUTOFF & CAPACITY VALIDATION TESTS ===\n");

// Scenario 1: Same day cutoff - 14 Nov 2026, 11:00 AM with 2 hr cutoff
{
  const res = calculateRegistrationClosingDateTime("2026-11-14", "11:00 AM", 2);
  assert(res !== null, "Scenario 1: calculation result is not null");
  assert(res.closingDateStr === "2026-11-14", "Scenario 1: closing date is 2026-11-14", `got ${res?.closingDateStr}`);
  assert(res.closingTimeStr === "9:00 AM", "Scenario 1: closing time is 9:00 AM", `got ${res?.closingTimeStr}`);
}

// Scenario 2: 3 hours cutoff - 14 Nov 2026, 11:00 AM with 3 hr cutoff
{
  const res = calculateRegistrationClosingDateTime("2026-11-14", "11:00 AM", 3);
  assert(res.closingTimeStr === "8:00 AM", "Scenario 2: closing time is 8:00 AM", `got ${res?.closingTimeStr}`);
  assert(res.closingDateStr === "2026-11-14", "Scenario 2: closing date is 2026-11-14");
}

// Scenario 3: Cross midnight cutoff - 14 Nov 2026, 11:00 AM with 12 hr cutoff
{
  const res = calculateRegistrationClosingDateTime("2026-11-14", "11:00 AM", 12);
  assert(res.closingDateStr === "2026-11-13", "Scenario 3: closing date rolled back to 2026-11-13", `got ${res?.closingDateStr}`);
  assert(res.closingTimeStr === "11:00 PM", "Scenario 3: closing time is 11:00 PM", `got ${res?.closingTimeStr}`);
}

// Scenario 4: Cross date cutoff - 14 Nov 2026, 11:00 AM with 24 hr cutoff
{
  const res = calculateRegistrationClosingDateTime("2026-11-14", "11:00 AM", 24);
  assert(res.closingDateStr === "2026-11-13", "Scenario 4: closing date is 2026-11-13", `got ${res?.closingDateStr}`);
  assert(res.closingTimeStr === "11:00 AM", "Scenario 4: closing time is 11:00 AM", `got ${res?.closingTimeStr}`);
}

// Scenario 5: Early morning start crossing midnight - 01:30 AM with 2 hr cutoff
{
  const res = calculateRegistrationClosingDateTime("2026-11-14", "1:30 AM", 2);
  assert(res.closingDateStr === "2026-11-13", "Scenario 5: date crossed to previous day 2026-11-13");
  assert(res.closingTimeStr === "11:30 PM", "Scenario 5: closing time is 11:30 PM", `got ${res?.closingTimeStr}`);
}

// Scenario 6: Month boundary crossing - 1 Nov 2026, 10:00 AM with 24 hr cutoff
{
  const res = calculateRegistrationClosingDateTime("2026-11-01", "10:00 AM", 24);
  assert(res.closingDateStr === "2026-10-31", "Scenario 6: date crossed month boundary to 2026-10-31", `got ${res?.closingDateStr}`);
  assert(res.closingTimeStr === "10:00 AM", "Scenario 6: closing time is 10:00 AM", `got ${res?.closingTimeStr}`);
}

// Scenario 7: isRegistrationDeadlineExpired check before cutoff vs after cutoff
{
  // 14 Nov 2026 11:00 AM IST with 2 hr cutoff closes at 9:00 AM IST (03:30 UTC)
  // Check at 8:59 AM IST (03:29 UTC) -> should NOT be expired
  const refBefore = new Date("2026-11-14T03:29:00Z");
  const expBefore = isRegistrationDeadlineExpired("2026-11-14", refBefore, {
    startDate: "2026-11-14",
    startTime: "11:00 AM",
    registrationClosesBeforeHours: 2,
  });
  assert(expBefore === false, "Scenario 7a: registration open at 8:59 AM IST (before 9:00 AM cutoff)");

  // Check at 9:01 AM IST (03:31 UTC) -> SHOULD be expired
  const refAfter = new Date("2026-11-14T03:31:00Z");
  const expAfter = isRegistrationDeadlineExpired("2026-11-14", refAfter, {
    startDate: "2026-11-14",
    startTime: "11:00 AM",
    registrationClosesBeforeHours: 2,
  });
  assert(expAfter === true, "Scenario 7b: registration closed at 9:01 AM IST (after 9:00 AM cutoff)");
}

// Scenario 8: isBatchRegistrationOpen - 5 Eligibility criteria
{
  // Criteria 1: Admin closed
  const r1 = isBatchRegistrationOpen({
    isEnrollmentOpen: false,
    startDate: "2026-11-14",
    startTime: "11:00 AM",
    totalSeats: 100,
    seatsBooked: 10,
  });
  assert(!r1.isOpen && r1.reason === "not_open", "Scenario 8a: closed when isEnrollmentOpen is false");

  // Criteria 2: Capacity reached / sold out
  const r2 = isBatchRegistrationOpen({
    isEnrollmentOpen: true,
    startDate: "2026-11-14",
    startTime: "11:00 AM",
    totalSeats: 100,
    seatsBooked: 100,
  });
  assert(!r2.isOpen && r2.reason === "sold_out", "Scenario 8b: closed when batch is fully booked (sold out)");
  assert(r2.message === "This batch is fully booked. Registration is now closed.", "Scenario 8b message matches requirement");

  // Criteria 3: Cohort TBA date
  const r3 = isBatchRegistrationOpen({
    isEnrollmentOpen: true,
    startDate: "",
    startTime: "6:30 PM",
    totalSeats: 100,
    seatsBooked: 0,
  });
  assert(!r3.isOpen && r3.reason === "unannounced", "Scenario 8c: closed when date is not announced (TBA)");

  // Criteria 4: Valid open batch before cutoff
  const refBefore = new Date("2026-11-14T03:00:00Z"); // 8:30 AM IST
  const r4 = isBatchRegistrationOpen(
    {
      isEnrollmentOpen: true,
      startDate: "2026-11-14",
      startTime: "11:00 AM",
      registrationClosesBeforeHours: 2,
      totalSeats: 100,
      seatsBooked: 20,
    },
    refBefore
  );
  assert(r4.isOpen, "Scenario 8d: open when valid batch, before cutoff, capacity available");
}

// Scenario 9: Zod validation schema
{
  // Valid batch with registrationClosesBeforeHours
  const valid = batchScheduleSchema.safeParse({
    batchName: "Live Masterclass - 14 Nov 2026",
    startDate: "2026-11-14",
    startTime: "11:00 AM",
    registrationClosesBeforeHours: 2,
    totalSeats: 100,
  });
  assert(valid.success, "Scenario 9a: batchScheduleSchema parses valid batch with cutoff hours");

  // Invalid cutoff hours (e.g. 5)
  const invalidCutoff = batchScheduleSchema.safeParse({
    batchName: "Live Masterclass",
    startDate: "2026-11-14",
    startTime: "11:00 AM",
    registrationClosesBeforeHours: 5,
  });
  assert(!invalidCutoff.success, "Scenario 9b: batchScheduleSchema rejects invalid cutoff hours (5)");

  // Registration deadline after start date is rejected
  const invalidDeadline = batchScheduleSchema.safeParse({
    batchName: "Live Masterclass",
    startDate: "2026-11-14",
    lastRegistrationDate: "2026-11-15",
    startTime: "11:00 AM",
  });
  assert(!invalidDeadline.success, "Scenario 9c: batchScheduleSchema rejects deadline after start date");

  // Registration deadline on same day as start date is accepted
  const sameDayDeadline = batchScheduleSchema.safeParse({
    batchName: "Live Masterclass",
    startDate: "2026-11-14",
    lastRegistrationDate: "2026-11-14",
    startTime: "11:00 AM",
  });
  assert(sameDayDeadline.success, "Scenario 9d: batchScheduleSchema accepts same day deadline");
}

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
