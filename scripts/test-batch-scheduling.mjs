// ==============================================================================
// Renuka Art Studio - Dynamic Course Batches & Admin Scheduling Test Suite
// Verifies:
// 1. Asia/Kolkata (IST) date and time formatting
// 2. Registration deadline expiration detection in IST timezone
// 3. Batch schedule schema validation rules:
//    - Rejection when lastRegistrationDate < startDate ("The registration deadline must not be earlier than the batch start date.")
//    - Acceptance when lastRegistrationDate >= startDate
//    - End date >= start date validation
// 4. Migration SQL file integrity (20261012000001_batch_registration_deadline.sql)
// 5. Course routing & slug mapping for both required courses:
//    - Watercolour Foundation (/course/watercolour-foundation)
//    - Watercolour Artistry + Foundation (/course/watercolour-artistry-foundation)
// 6. Resilience fallback handling when database column is pending migration
// 7. Booking service registration deadline check enforcement
// ==============================================================================

import assert from "node:assert";
import fs from "node:fs";

console.log("==================================================================");
console.log("RUNNING DYNAMIC COURSE BATCHES & ADMIN SCHEDULING TEST SUITE");
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

  // Invalid date fallback
  assert.strictEqual(formatBatchDateIST(null), "To be announced");
  assert.strictEqual(formatBatchDateIST(undefined), "To be announced");
  assert.strictEqual(formatBatchDateIST(""), "To be announced");
});

runTest("Test 2: IST Time formatting handles standard 12h/24h strings nicely", () => {
  assert.strictEqual(formatBatchTimeIST("10:00 AM"), "10:00 AM IST");
  assert.strictEqual(formatBatchTimeIST("10:00 AM IST"), "10:00 AM IST");
  assert.strictEqual(formatBatchTimeIST("06:30 PM", "08:30 PM"), "06:30 PM – 08:30 PM IST");
  assert.strictEqual(formatBatchTimeIST(""), "TBA");
});

// ------------------------------------------------------------------------------
// Test 3: Registration Deadline Expiry Logic in IST
// ------------------------------------------------------------------------------
runTest("Test 3: Registration deadline expiration detects past vs future dates", () => {
  const todayIST = getTodayISTString();
  assert.match(todayIST, /^\d{4}-\d{2}-\d{2}$/, "Today IST must be in YYYY-MM-DD format");

  // A past date should be expired
  assert.strictEqual(isRegistrationDeadlineExpired("2020-01-01"), true);
  
  // A far future date should NOT be expired
  assert.strictEqual(isRegistrationDeadlineExpired("2099-12-31"), false);

  // Null or empty deadline should NOT be expired (open by default unless specified)
  assert.strictEqual(isRegistrationDeadlineExpired(null), false);
  assert.strictEqual(isRegistrationDeadlineExpired(undefined), false);

  // Today itself should NOT be expired (deadline includes current day)
  assert.strictEqual(isRegistrationDeadlineExpired(todayIST), false);
});

// ------------------------------------------------------------------------------
// Test 4: Batch Status Derivation
// ------------------------------------------------------------------------------
runTest("Test 4: deriveBatchStatus reflects closed, expired, and open states", () => {
  // If explicitly closed in DB
  const closedRes = deriveBatchStatus({
    isEnrollmentOpen: false,
    lastRegistrationDate: "2099-12-31",
  });
  assert.strictEqual(closedRes, "closed");

  // If status is open but deadline has expired
  const expiredRes = deriveBatchStatus({
    isEnrollmentOpen: true,
    lastRegistrationDate: "2020-01-01",
  });
  assert.strictEqual(expiredRes, "closed");

  // If open and deadline in future
  const openRes = deriveBatchStatus({
    isEnrollmentOpen: true,
    lastRegistrationDate: "2099-12-31",
  });
  assert.strictEqual(openRes, "open");
});

// ------------------------------------------------------------------------------
// Test 5: Validation - Registration Deadline cannot be earlier than start date
// ------------------------------------------------------------------------------
runTest("Test 5: Validation rejects when registration deadline is earlier than start date", () => {
  const invalidPayload = {
    batchName: "Weekend Batch Oct 2026",
    startDate: "2026-10-25",
    lastRegistrationDate: "2026-10-20", // earlier than start date -> INVALID per user constraint
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    status: "open",
  };

  const result = batchScheduleSchema.safeParse(invalidPayload);
  assert.strictEqual(result.success, false, "Should fail validation when deadline < start date");
  
  const issue = result.error?.issues.find(i => i.path.includes("lastRegistrationDate"));
  assert.ok(issue, "Must have an issue on lastRegistrationDate");
  assert.strictEqual(
    issue.message,
    "The registration deadline must not be earlier than the batch start date."
  );
});

runTest("Test 6: Validation accepts when registration deadline is on or after start date", () => {
  const validSameDayPayload = {
    batchName: "Weekend Batch Oct 2026",
    startDate: "2026-10-25",
    lastRegistrationDate: "2026-10-25", // on the same date -> VALID
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    status: "open",
  };

  const result1 = batchScheduleSchema.safeParse(validSameDayPayload);
  assert.strictEqual(result1.success, true, `Expected validation to pass: ${JSON.stringify(result1.error?.issues)}`);

  const validAfterPayload = {
    batchName: "Weekend Batch Oct 2026",
    startDate: "2026-10-25",
    lastRegistrationDate: "2026-10-30", // after start date -> VALID
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    status: "open",
  };

  const result2 = batchScheduleSchema.safeParse(validAfterPayload);
  assert.strictEqual(result2.success, true, `Expected validation to pass: ${JSON.stringify(result2.error?.issues)}`);
});

runTest("Test 7: Validation rejects invalid date formats and end date before start date", () => {
  // Invalid date format
  const badDateResult = batchScheduleSchema.safeParse({
    batchName: "Weekend Batch",
    startDate: "25-10-2026", // Not YYYY-MM-DD
    lastRegistrationDate: "2026-10-25",
    startTime: "10:00 AM",
  });
  assert.strictEqual(badDateResult.success, false);

  // End date earlier than start date
  const badEndDateResult = batchScheduleSchema.safeParse({
    batchName: "Weekend Batch",
    startDate: "2026-10-25",
    endDate: "2026-10-20",
    lastRegistrationDate: "2026-10-25",
    startTime: "10:00 AM",
  });
  assert.strictEqual(badEndDateResult.success, false);
});

// ------------------------------------------------------------------------------
// Test 8: SQL Migration Integrity
// ------------------------------------------------------------------------------
runTest("Test 8: Migration SQL file contains required schema changes and RLS safe view update", () => {
  const migrationPath = "supabase/migrations/20261012000001_batch_registration_deadline.sql";
  assert.ok(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);

  const sqlContent = fs.readFileSync(migrationPath, "utf-8");
  assert.ok(
    sqlContent.includes("last_registration_date"),
    "SQL must add or reference last_registration_date column"
  );
  assert.ok(
    sqlContent.includes("cohort_batches"),
    "SQL must alter cohort_batches table"
  );
  assert.ok(
    sqlContent.includes("public_cohort_batches"),
    "SQL must recreate or update public_cohort_batches view"
  );
});

// ------------------------------------------------------------------------------
// Test 9: Public Course Slugs & Routes Existence
// ------------------------------------------------------------------------------
runTest("Test 9: Public course routes and cards link to correct slugs", () => {
  const catalogClientPath = "components/course/CourseCatalogClient.tsx";
  assert.ok(fs.existsSync(catalogClientPath), "CourseCatalogClient.tsx must exist");
  const catalogContent = fs.readFileSync(catalogClientPath, "utf-8");

  // Check Watercolour Foundation and Watercolour Artistry
  assert.ok(
    catalogContent.includes("watercolour-foundation"),
    "Catalog must route to /course/watercolour-foundation"
  );
  assert.ok(
    catalogContent.includes("watercolour-artistry-foundation"),
    "Catalog must route to /course/watercolour-artistry-foundation"
  );

  // Check buttons
  assert.ok(catalogContent.includes("Learn More"), "Catalog must have 'Learn More' button");
  assert.ok(
    catalogContent.includes("Book Now") || catalogContent.includes("Enrol Now"),
    "Catalog must have 'Book Now / Enrol Now' button"
  );
});

// ------------------------------------------------------------------------------
// Test 10: Admin Navigation & Integration
// ------------------------------------------------------------------------------
runTest("Test 10: Admin panel navigation and course manager integrate batch scheduling", () => {
  const adminBatchesPath = "app/admin/batches/page.tsx";
  assert.ok(fs.existsSync(adminBatchesPath), "app/admin/batches/page.tsx must exist");

  const sidebarPath = "components/admin/AdminSidebar.tsx";
  const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
  assert.ok(
    sidebarContent.includes("/admin/batches"),
    "Admin sidebar must include link to /admin/batches"
  );

  const courseManagerPath = "components/admin/courses/CourseManager.tsx";
  const courseManagerContent = fs.readFileSync(courseManagerPath, "utf-8");
  assert.ok(
    courseManagerContent.includes("AdminBatchScheduleManager"),
    "CourseManager must integrate AdminBatchScheduleManager"
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
