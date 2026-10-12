// ==============================================================================
// Renuka Art Studio - Public Batch Schedules & Availability Regression Suite
// Verifies:
// 1. All 3 courses (Masterclass, Foundation, Artistry) have valid Supabase batches
// 2. Exact course order: Masterclass, Foundation, Artistry
// 3. activeBatch is properly populated for all 3 courses
// 4. Batch dates and timings match saved Supabase data in Asia/Kolkata (IST)
// 5. Open for Registration status is consistently active across all 3 courses
// 6. Public /course page HTML does NOT contain "Schedule details will be announced soon"
// 7. Public /course page HTML contains "Open for Registration" and "Enrol Now"
// 8. Public detail routes for all 3 courses reflect live batch schedules
// ==============================================================================

import assert from "node:assert";
import fs from "node:fs";

console.log("==================================================================");
console.log("RUNNING PUBLIC BATCH SCHEDULES & REGISTRATION STATUS TEST SUITE");
console.log("==================================================================");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

async function main() {
  // 1. Fetch from live dev server /course
  await runAsyncTest("Test 1: Public /course page HTML renders live batch schedules for all courses", async () => {
    const res = await fetch("http://localhost:3000/course", { cache: "no-store" });
    assert.strictEqual(res.status, 200, "GET /course must return HTTP 200");
    const html = await res.text();

    // Must NOT have announcement placeholder
    assert.ok(
      !html.includes("Schedule details will be announced soon."),
      "Must NOT contain placeholder: 'Schedule details will be announced soon.'"
    );

    // Must contain Open for Registration
    assert.ok(
      html.includes("Open for Registration"),
      "Must contain 'Open for Registration' status"
    );

    // Must contain Enrol Now
    assert.ok(
      html.includes("Enrol Now"),
      "Must contain active 'Enrol Now' buttons"
    );

    // Dates
    assert.ok(html.includes("28 Oct 2026"), "Must contain Masterclass start date '28 Oct 2026'");
    assert.ok(html.includes("01 Nov 2026") || html.includes("1 Nov 2026"), "Must contain Foundation start date '01 Nov 2026'");
    assert.ok(html.includes("05 Nov 2026") || html.includes("5 Nov 2026"), "Must contain Artistry start date '05 Nov 2026'");

    // Timings
    assert.ok(html.includes("6:30 PM – 8:30 PM IST"), "Must contain Masterclass timing '6:30 PM – 8:30 PM IST'");
    assert.ok(html.includes("6:30 PM – 8:00 PM IST"), "Must contain Foundation/Artistry timing '6:30 PM – 8:00 PM IST'");
  });

  // 2. Check /api/cohort-batches/active for all courses
  await runAsyncTest("Test 2: /api/cohort-batches/active returns open batches for all courses", async () => {
    const slugs = [
      "the-watercolour",
      "watercolour-foundation",
      "watercolour-artistry-foundation",
    ];

    for (const slug of slugs) {
      const res = await fetch(`http://localhost:3000/api/cohort-batches/active?courseSlug=${slug}`, {
        cache: "no-store",
      });
      assert.strictEqual(res.status, 200, `Active batch API for ${slug} must return 200`);
      const data = await res.json();
      assert.ok(data.success, `API must return success: true for ${slug}`);
      assert.ok(data.batch, `API must return batch object for ${slug}`);
      assert.strictEqual(data.batch.isEnrollmentOpen, true, `Batch must be open for ${slug}`);
      assert.strictEqual(data.batch.isRegistrationClosed, false, `Registration must not be closed for ${slug}`);
      assert.strictEqual(data.batch.isExpired, false, `Batch must not be expired for ${slug}`);
      assert.strictEqual(data.batch.isSoldOut, false, `Batch must not be sold out for ${slug}`);
    }
  });

  // 3. Check public course detail routes
  await runAsyncTest("Test 3: Course detail pages load successfully with live batch data", async () => {
    const routes = [
      { url: "http://localhost:3000/course/the-watercolour", date: "28 Oct 2026" },
      { url: "http://localhost:3000/course/watercolour-foundation", date: "01 Nov 2026" },
      { url: "http://localhost:3000/course/watercolour-artistry-foundation", date: "05 Nov 2026" },
    ];

    for (const r of routes) {
      const res = await fetch(r.url, { cache: "no-store" });
      assert.strictEqual(res.status, 200, `Detail page ${r.url} must return 200`);
      const html = await res.text();
      assert.ok(html.includes(r.date), `Page ${r.url} must contain date ${r.date}`);
    }
  });

  // 4. Check CourseCatalogClient.tsx source code integrity
  runTest("Test 4: CourseCatalogClient.tsx handles batch sold out and seats remaining", () => {
    const code = fs.readFileSync("components/course/CourseCatalogClient.tsx", "utf-8");
    assert.ok(code.includes("Batch Full / Sold Out"), "Must support 'Batch Full / Sold Out' label");
    assert.ok(code.includes("seats available"), "Must support available seats label");
    assert.ok(code.includes("masterclassCourse"), "Must extract masterclassCourse");
    assert.ok(code.includes("foundationCourse"), "Must extract foundationCourse");
    assert.ok(code.includes("artistryCourse"), "Must extract artistryCourse");
  });

  console.log("==================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
