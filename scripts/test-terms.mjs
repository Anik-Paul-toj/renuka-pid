import assert from "node:assert";
import fs from "node:fs";

console.log("==================================================================");
console.log("RUNNING TERMS & CONDITIONS VERIFICATION TEST SUITE");
console.log("==================================================================");

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    failed++;
  }
}

async function main() {
  // Test 1: Dedicated Route /terms-and-conditions loads with all 8 sections
  await runTest("Test 1: /terms-and-conditions route returns 200 and all 8 sections", async () => {
    const res = await fetch("http://localhost:3000/terms-and-conditions");
    assert.strictEqual(res.status, 200, "Terms & Conditions page must return HTTP 200");
    const html = await res.text();

    assert.ok(html.includes("Terms &amp; Conditions") || html.includes("Terms & Conditions"), "Page must contain Terms & Conditions title");
    assert.ok(html.includes("Welcome to Renuka Art Studio"), "Page must contain intro welcome statement");
    assert.ok(html.includes("Live Classes &amp; Attendance") || html.includes("Live Classes & Attendance"), "Section 1 must be present");
    assert.ok(html.includes("No Promotion or Solicitation"), "Section 2 must be present");
    assert.ok(html.includes("Respectful Behaviour"), "Section 3 must be present");
    assert.ok(html.includes("Group Etiquette"), "Section 4 must be present");
    assert.ok(html.includes("Student Responsibility"), "Section 5 must be present");
    assert.ok(html.includes("Changes to Schedule"), "Section 6 must be present");
    assert.ok(html.includes("Violation of Terms"), "Section 7 must be present");
    assert.ok(html.includes("Agreement"), "Section 8 must be present");
    assert.ok(html.includes("No recorded lessons or session recordings will be provided"), "Section 1 exact content must be present");
  });

  // Test 2: Website Footer contains Terms & Conditions link on all pages
  await runTest("Test 2: Footer contains Terms & Conditions link on Landing and Course pages", async () => {
    const homeRes = await fetch("http://localhost:3000/");
    const homeHtml = await homeRes.text();
    assert.ok(homeHtml.includes("/terms-and-conditions"), "Home page footer must link to /terms-and-conditions");

    const courseRes = await fetch("http://localhost:3000/course");
    const courseHtml = await courseRes.text();
    assert.ok(courseHtml.includes("/terms-and-conditions"), "Course catalog page footer must link to /terms-and-conditions");
  });

  // Test 3: RegistrationModal UI has required Terms & Conditions checkbox and link
  await runTest("Test 3: RegistrationModal.tsx contains agreement checkbox and link", () => {
    const modalContent = fs.readFileSync("components/RegistrationModal.tsx", "utf8");
    assert.ok(modalContent.includes('id="agree-terms"'), "Modal must contain agree-terms checkbox input");
    assert.ok(modalContent.includes('name="agreeTerms"'), "Checkbox must have name agreeTerms");
    assert.ok(modalContent.includes('href="/terms-and-conditions"'), "Modal must link to /terms-and-conditions");
    assert.ok(modalContent.includes("I have read and agree to the"), "Modal must contain exact label text");
    assert.ok(modalContent.includes("!agreeTerms"), "Form submit must check agreeTerms before proceeding");
  });

  // Test 4: Server-Side Booking Validation strictly rejects bookings without agreeTerms
  await runTest("Test 4: POST /api/bookings strictly rejects submissions without agreed Terms", async () => {
    const dummyPayloadWithoutTerms = {
      fullName: "Test Student",
      email: "test.student@example.com",
      phone: "+919876543210",
      batchId: "11111111-1111-1111-1111-111111111101",
      // agreeTerms omitted
    };

    const res1 = await fetch("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dummyPayloadWithoutTerms),
    });

    assert.strictEqual(res1.status, 400, "Must return HTTP 400 when agreeTerms is missing");
    const data1 = await res1.json();
    assert.strictEqual(data1.success, false, "Response must indicate failure");
    assert.ok(
      data1.error?.message?.toLowerCase().includes("terms & conditions") ||
      data1.error?.message?.toLowerCase().includes("agreeterms"),
      `Error message must mention Terms & Conditions, got: ${data1.error?.message}`
    );

    // Test with agreeTerms: false
    const dummyPayloadWithFalseTerms = {
      ...dummyPayloadWithoutTerms,
      agreeTerms: false,
    };

    const res2 = await fetch("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dummyPayloadWithFalseTerms),
    });

    assert.strictEqual(res2.status, 400, "Must return HTTP 400 when agreeTerms is false");
    const data2 = await res2.json();
    assert.strictEqual(data2.success, false, "Response must indicate failure");
    assert.ok(
      data2.error?.message?.toLowerCase().includes("terms & conditions"),
      `Error message must mention Terms & Conditions, got: ${data2.error?.message}`
    );
  });

  // Test 5: Zod Schema validation module tests
  await runTest("Test 5: createBookingSchema correctly validates agreeTerms field", async () => {
    const { createBookingSchema } = await import("../lib/validations/booking.ts");

    const invalid = createBookingSchema.safeParse({
      fullName: "Valid Name",
      email: "valid@example.com",
      batchId: "11111111-1111-1111-1111-111111111101",
      agreeTerms: false,
    });
    assert.strictEqual(invalid.success, false, "Schema must reject agreeTerms: false");

    const valid = createBookingSchema.safeParse({
      fullName: "Valid Name",
      email: "valid@example.com",
      batchId: "11111111-1111-1111-1111-111111111101",
      agreeTerms: true,
    });
    assert.strictEqual(valid.success, true, "Schema must accept agreeTerms: true");
  });

  console.log("==================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
