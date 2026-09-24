import { getPublicLandingContent } from "../lib/cms/public-loader";
import { masterclassData, MasterclassData } from "../data/content";
import { sectionSchemaMap } from "../lib/validations/cms";


async function runPhase7Tests() {
  console.log("==================================================");
  console.log("PHASE 7 RESTART STEP 3 INTEGRATION VERIFICATION");
  console.log("==================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(name: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${name}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${name}`);
      if (details) console.error(`       Details: ${details}`);
    }
  }

  // ----------------------------------------------------
  // Test 1: Public Loader Fetches Complete 18 Published Sections
  // ----------------------------------------------------
  const publicContent = await getPublicLandingContent();
  const canonicalKeys = Object.keys(sectionSchemaMap);
  
  assert(
    "Public loader returns all 18 canonical sections",
    canonicalKeys.every(k => (publicContent as any)[k] !== undefined),
    `Found keys: ${Object.keys(publicContent).length}`
  );

  // ----------------------------------------------------
  // Test 2: Field-by-Field Parity with Initial Approved Content
  // ----------------------------------------------------
  let parityMismatches: string[] = [];
  for (const key of canonicalKeys) {
    const pubSec = JSON.stringify((publicContent as any)[key]);
    const initSec = JSON.stringify((masterclassData as any)[key]);
    if (pubSec !== initSec) {
      parityMismatches.push(key);
    }
  }

  assert(
    "100% True Content Parity (0 mismatches across all 18 sections and ~295 fields)",
    parityMismatches.length === 0,
    `Mismatched sections: ${parityMismatches.join(", ")}`
  );

  // ----------------------------------------------------
  // Test 3: Verified Instructor Name Parity
  // ----------------------------------------------------
  assert(
    "hero.instructorName is 'Renuka Aggarwal'",
    publicContent.hero.instructorName === "Renuka Aggarwal",
    `Current: ${publicContent.hero.instructorName}`
  );

  // ----------------------------------------------------
  // Test 4: Zod Validation passes on all 18 sections
  // ----------------------------------------------------
  let validationFailures: string[] = [];
  for (const [key, schema] of Object.entries(sectionSchemaMap)) {
    const val = schema.safeParse((publicContent as any)[key]);
    if (!val.success) {
      validationFailures.push(`${key}: ${val.error.issues[0]?.message}`);
    }
  }

  assert(
    "All 18 public sections pass Zod schema validation",
    validationFailures.length === 0,
    validationFailures.join("; ")
  );

  // ----------------------------------------------------
  // Test 5: Safe Fallback Verification (Zod Rejection)
  // ----------------------------------------------------
  const heroSchema = sectionSchemaMap.hero;
  const invalidHero = { headlineStart: 123 }; // invalid types
  const parsedInvalid = heroSchema.safeParse(invalidHero);
  assert(
    "Zod schema correctly rejects invalid section content",
    !parsedInvalid.success
  );

  // ----------------------------------------------------
  // Test 6: Fallback Default Resilience
  // ----------------------------------------------------
  // Verify masterclassData baseline contains all 18 keys and valid shapes
  let baselineIssues = 0;
  for (const [key, schema] of Object.entries(sectionSchemaMap)) {
    const val = schema.safeParse((masterclassData as any)[key]);
    if (!val.success) baselineIssues++;
  }
  assert(
    "Fallback data/content.ts baseline passes 100% of canonical schemas",
    baselineIssues === 0,
    `Issues: ${baselineIssues}`
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log("\n==================================================");
  console.log(`INTEGRATION TEST SUMMARY: ${passedTests}/${totalTests} PASSED`);
  console.log("==================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase7Tests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
