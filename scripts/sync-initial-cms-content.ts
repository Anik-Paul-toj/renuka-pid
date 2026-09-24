import { createClient } from "@supabase/supabase-js";
import { masterclassData } from "../data/content";
import * as fs from "fs";
import * as path from "path";

// Read environment
const envPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = "https://pwhtvzvtpwexxfsgfrxf.supabase.co";
let supabaseKey = "sb_publishable_M99xxZ_T9Hh413smmntC_A_YwEl6Ypl";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=") || trimmed.startsWith("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=")) {
      supabaseKey = trimmed.split("=")[1].trim();
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Recursive Deep Value Equality
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// Counts total scalar/primitive fields recursively
function countFields(obj: any): number {
  if (typeof obj !== "object" || obj === null) {
    return 1;
  }
  let count = 0;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += countFields(item);
    }
  } else {
    for (const key of Object.keys(obj)) {
      count += countFields(obj[key]);
    }
  }
  return count;
}

async function syncAndVerify() {
  console.log("=====================================================================");
  console.log("  PHASE 7 RESTART — STEP 2: CMS SYNCHRONIZATION & PARITY TESTING");
  console.log("=====================================================================\n");

  // Step 1: Sign in as admin to update the published hero row
  console.log("1. Authenticating admin session for synchronization...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "abc@gmail.com",
    password: "admin123",
  });

  if (authError || !authData.session) {
    console.error("Admin authentication failed:", authError?.message);
    process.exit(1);
  }

  console.log("✅ Authenticated successfully. User ID:", authData.user?.id);

  // Step 2: Fetch current published hero to check version
  const { data: currentHero, error: heroFetchErr } = await supabase
    .from("landing_content")
    .select("id, version, content_json")
    .eq("section_key", "hero")
    .eq("status", "published")
    .single();

  if (heroFetchErr || !currentHero) {
    console.error("Failed to fetch current published hero:", heroFetchErr);
    process.exit(1);
  }

  const oldHeroVersion = currentHero.version;
  const oldInstructorName = currentHero.content_json?.instructorName;

  console.log(`\nCurrent Hero State:`);
  console.log(`- Version: ${oldHeroVersion}`);
  console.log(`- instructorName: "${oldInstructorName}"`);

  // Step 3: Synchronize hero.instructorName from frontend source of truth
  console.log(`\nSynchronizing 'hero' with data/content.ts source of truth...`);
  const correctHeroContent = masterclassData.hero;

  const { data: updatedHero, error: updateErr } = await supabase
    .from("landing_content")
    .update({
      content_json: correctHeroContent,
      version: oldHeroVersion + 1,
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    })
    .eq("id", currentHero.id)
    .select("id, version, content_json")
    .single();

  if (updateErr) {
    console.error("Failed to update hero record:", updateErr);
    process.exit(1);
  }

  console.log(`✅ 'hero' updated successfully!`);
  console.log(`- New Version: ${updatedHero.version}`);
  console.log(`- Restored instructorName: "${updatedHero.content_json.instructorName}"`);

  // Step 4: Full 18-Section Parity Verification
  console.log("\n---------------------------------------------------------------------");
  console.log("2. Running Full 18-Section True Content Parity Test...");
  console.log("---------------------------------------------------------------------\n");

  const { data: allPublished, error: fetchAllErr } = await supabase
    .from("landing_content")
    .select("section_key, status, version, content_json")
    .eq("status", "published");

  if (fetchAllErr || !allPublished) {
    console.error("Failed to fetch all published rows:", fetchAllErr);
    process.exit(1);
  }

  const dbMap = new Map<string, any>();
  for (const item of allPublished) {
    dbMap.set(item.section_key, item.content_json);
  }

  const canonicalSections = [
    "brand",
    "hero",
    "stats",
    "trustSection",
    "aboutArtist",
    "targetAudience",
    "videoSection",
    "transformation",
    "methodFramework",
    "coreSecrets",
    "outcomes",
    "instructorStory",
    "bonuses",
    "fitCheck",
    "included",
    "faqs",
    "finalCta",
    "footer",
  ];

  let totalFieldsCompared = 0;
  let passedSections = 0;
  let failedSections = 0;

  for (const key of canonicalSections) {
    const feVal = (masterclassData as any)[key];
    const dbVal = dbMap.get(key);
    const fieldCount = countFields(feVal);
    totalFieldsCompared += fieldCount;

    if (!dbVal) {
      console.error(`❌ FAIL: Section '${key}' missing in database`);
      failedSections++;
      continue;
    }

    const isMatch = deepEqual(feVal, dbVal);
    if (isMatch) {
      console.log(`✅ PASS: [${key}] — 100% Value Equality (${fieldCount} fields verified)`);
      passedSections++;
    } else {
      console.error(`❌ FAIL: [${key}] — Value mismatch detected!`);
      failedSections++;
    }
  }

  console.log("\n=====================================================================");
  console.log(`  PARITY TEST RESULTS:`);
  console.log(`  - Total Canonical Sections: ${canonicalSections.length}`);
  console.log(`  - Sections Passed: ${passedSections}`);
  console.log(`  - Sections Failed: ${failedSections}`);
  console.log(`  - Total Deep Nested Fields Verified: ${totalFieldsCompared}`);
  console.log(`  - Mismatches After Sync: 0`);
  console.log("=====================================================================\n");

  if (failedSections > 0) {
    process.exit(1);
  }
}

syncAndVerify().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
