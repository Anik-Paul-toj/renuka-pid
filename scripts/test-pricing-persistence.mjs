import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key, ...rest] = trimmed.split("=");
    envVars[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("==================================================================");
  console.log("RUNNING COURSE PRICING PERSISTENCE & SSR COHERENCE TEST SUITE");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Fetch Masterclass course
  const { data: masterclass, error: mcErr } = await supabase
    .from("courses")
    .select("*")
    .in("slug", ["the-watercolour", "the-watercolour-roadmap"])
    .single();

  assert(!mcErr && masterclass, "Test 1: Masterclass course exists in Supabase");
  const masterclassId = masterclass.id;
  const originalMasterclassPrice = masterclass.offer_price_paise;

  // 2. Test saving price to ₹99 (9,900 paise)
  const testPrice99 = 99;
  const testPaise99 = 9900;
  const { data: update99, error: err99 } = await supabase
    .from("courses")
    .update({
      offer_price_paise: testPaise99,
      updated_at: new Date().toISOString(),
    })
    .eq("id", masterclassId)
    .select()
    .single();

  assert(
    !err99 && update99.offer_price_paise === 9900,
    "Test 2: Masterclass price persists to ₹99 (9,900 paise) in Supabase"
  );

  // 3. Update Foundation course updated_at to be strictly NEWER than Masterclass
  // (This was the exact trigger of the bug: touching another course made SSR pick Foundation's ₹990)
  const futureIso = new Date(Date.now() + 10000).toISOString();
  await supabase
    .from("courses")
    .update({ updated_at: futureIso })
    .eq("slug", "watercolour-foundation");

  // Query landing page course using our updated logic
  const { data: landingCourse } = await supabase
    .from("courses")
    .select("id, title, slug, original_price_paise, offer_price_paise, duration_minutes")
    .in("slug", ["the-watercolour", "the-watercolour-roadmap"])
    .eq("is_active", true)
    .maybeSingle();

  assert(
    landingCourse &&
      landingCourse.slug === "the-watercolour" &&
      Math.round(landingCourse.offer_price_paise / 100) === 99,
    "Test 3: Homepage SSR authoritatively targets Masterclass (₹99), NOT Foundation (₹990), even when Foundation has newer updated_at"
  );

  // 4. Test price update to ₹23 (2,300 paise)
  const testPrice23 = 23;
  const testPaise23 = 2300;
  const { data: update23, error: err23 } = await supabase
    .from("courses")
    .update({
      offer_price_paise: testPaise23,
      updated_at: new Date().toISOString(),
    })
    .eq("id", masterclassId)
    .select()
    .single();

  assert(
    !err23 && update23.offer_price_paise === 2300,
    "Test 4: Masterclass price persists to ₹23 (2,300 paise) in Supabase"
  );

  // 5. Test price update to ₹34 (3,400 paise)
  const testPrice34 = 34;
  const testPaise34 = 3400;
  const { data: update34, error: err34 } = await supabase
    .from("courses")
    .update({
      offer_price_paise: testPaise34,
      updated_at: new Date().toISOString(),
    })
    .eq("id", masterclassId)
    .select()
    .single();

  assert(
    !err34 && update34.offer_price_paise === 3400,
    "Test 5: Masterclass price persists to ₹34 (3,400 paise) in Supabase"
  );

  // 6. Test Foundation and Artistry courses on /course catalog
  const { data: catalogCourses } = await supabase
    .from("courses")
    .select("slug, original_price_paise, offer_price_paise")
    .in("slug", ["watercolour-foundation", "watercolour-artistry-foundation"]);

  const foundation = catalogCourses.find((c) => c.slug === "watercolour-foundation");
  const artistry = catalogCourses.find((c) => c.slug === "watercolour-artistry-foundation");

  assert(
    foundation &&
      foundation.offer_price_paise === 99000 &&
      artistry &&
      artistry.offer_price_paise === 999000,
    "Test 6: Foundation (₹990) and Artistry (₹9,990) retain independent authoritative catalog pricing"
  );

  // 7. Test active batch linking
  const { data: batch } = await supabase
    .from("cohort_batches")
    .select("id, course_id, batch_name, start_date, is_enrollment_open")
    .eq("course_id", masterclassId)
    .single();

  assert(
    batch && batch.is_enrollment_open,
    "Test 7: Masterclass active batch is linked to the authoritative course record"
  );

  // 8. Restore price to ₹99 (or original price)
  await supabase
    .from("courses")
    .update({
      offer_price_paise: 9900,
      updated_at: new Date().toISOString(),
    })
    .eq("id", masterclassId);

  const { data: restored } = await supabase
    .from("courses")
    .select("offer_price_paise")
    .eq("id", masterclassId)
    .single();

  assert(
    restored.offer_price_paise === 9900,
    "Test 8: Masterclass price verified at ₹99 (9,900 paise)"
  );

  console.log("==================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
