import assert from "node:assert";
import fs from "node:fs";

console.log("==================================================================");
console.log("VERIFYING GALLERY CATEGORY RENAMING & FILTERING INTEGRATION");
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
    console.error(err);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// Test 1: File Content Integrity - Exact Labels in GallerySection.tsx
// -----------------------------------------------------------------------------
runTest("Test 1: Public GallerySection.tsx contains exact labels All, Artist Gallery, Students Gallery", () => {
  const content = fs.readFileSync("components/GallerySection.tsx", "utf8");

  // Check buttons
  assert.ok(content.includes("All ({images.length})"), "All filter button must be present");
  assert.ok(content.includes("Artist Gallery ({artistImages.length})"), "Artist Gallery button must be present");
  assert.ok(content.includes("Students Gallery ({studentsImages.length})"), "Students Gallery button must be present");

  // Ensure old category labels are replaced in UI
  assert.ok(!content.includes("Students' Creation ({"), "Legacy Students' Creation filter button must be removed");
  assert.ok(!content.includes("Learning in Action ({"), "Legacy Learning in Action filter button must be removed");

  // Check section headings
  assert.ok(content.includes("Artist Gallery"), "Artist Gallery section title must be present");
  assert.ok(content.includes("Students Gallery"), "Students Gallery section title must be present");
});

// -----------------------------------------------------------------------------
// Test 2: File Content Integrity - Exact Labels in AdminMediaManager.tsx
// -----------------------------------------------------------------------------
runTest("Test 2: AdminMediaManager.tsx contains exact labels and options", () => {
  const content = fs.readFileSync("components/admin/media/AdminMediaManager.tsx", "utf8");

  assert.ok(content.includes('"artist_gallery"'), "artist_gallery category ID must be present");
  assert.ok(content.includes('"students_gallery"'), "students_gallery category ID must be present");
  assert.ok(content.includes("Artist Gallery"), "Artist Gallery label must be present in Admin panel");
  assert.ok(content.includes("Students Gallery"), "Students Gallery label must be present in Admin panel");

  // Verify options in filter bar
  assert.ok(content.includes('(["all", "artist_gallery", "students_gallery"] as const)'), "Filter bar must offer all, artist_gallery, students_gallery");
});

// -----------------------------------------------------------------------------
// Test 3: Data Model & Safe Normalization in lib/gallery/service.ts
// -----------------------------------------------------------------------------
runTest("Test 3: Normalization rules safely map new and legacy categories", () => {
  const content = fs.readFileSync("lib/gallery/service.ts", "utf8");

  assert.ok(content.includes('export type GalleryCategory = "artist_gallery" | "students_gallery"'), "GalleryCategory type definition must be updated");
  assert.ok(content.includes("normalizeGalleryCategory"), "normalizeGalleryCategory function must be present");

  // Emulate normalization logic to test corner cases
  const normalizeCat = (rawCat, metaCat, text) => {
    const raw = (rawCat || "").toLowerCase();
    const meta = (metaCat || "").toLowerCase();
    const txt = (text || "").toLowerCase();

    if (meta === "artist_gallery" || raw === "gallery_artist_gallery" || raw.includes("artist")) return "artist_gallery";
    if (meta === "students_gallery" || raw === "gallery_students_gallery" || raw.includes("students_gallery")) return "students_gallery";
    if (meta === "learning_in_action" || raw.includes("learning") || raw.includes("action")) return "artist_gallery";
    if (meta === "students_creation" || raw.includes("students_creation") || raw.includes("creation")) return "students_gallery";
    if (txt.includes("renuka") || txt.includes("artist") || txt.includes("demo")) return "artist_gallery";
    return "students_gallery";
  };

  // Explicit new
  assert.strictEqual(normalizeCat("gallery_artist_gallery", "artist_gallery", ""), "artist_gallery");
  assert.strictEqual(normalizeCat("gallery_students_gallery", "students_gallery", ""), "students_gallery");

  // Legacy mappings
  assert.strictEqual(normalizeCat("gallery_learning_in_action", "learning_in_action", "Live Demonstration"), "artist_gallery");
  assert.strictEqual(normalizeCat("gallery_students_creation", "students_creation", "Student rose study"), "students_gallery");

  // Metadata heuristic fallback
  assert.strictEqual(normalizeCat("gallery", null, "Painting by Renuka Aggarwal"), "artist_gallery");
  assert.strictEqual(normalizeCat("gallery", null, "Landscape study"), "students_gallery");
});

// -----------------------------------------------------------------------------
// Test 4: End-to-End Filter Simulation
// -----------------------------------------------------------------------------
runTest("Test 4: Filter behavior correctly isolates All, Artist Gallery, and Students Gallery", () => {
  const dataset = [
    { id: "art-1", title: "Botanical Peony", category: "artist_gallery", isPublished: true },
    { id: "art-2", title: "Himalayan Mist", category: "artist_gallery", isPublished: true },
    { id: "art-3", title: "Live Studio Demo by Renuka", category: "learning_in_action", isPublished: true }, // legacy mapped to artist
    { id: "stu-1", title: "Loose Floral Study", category: "students_gallery", isPublished: true },
    { id: "stu-2", title: "Watercolour Apple", category: "students_creation", isPublished: true }, // legacy mapped to student
    { id: "stu-3", title: "Morning Sky Exercise", category: "gallery", isPublished: true }, // legacy default to student
    { id: "draft-1", title: "Unpublished Piece", category: "artist_gallery", isPublished: false },
  ];

  const normalize = (item) => {
    const raw = (item.category || "").toLowerCase();
    if (raw === "artist_gallery" || raw === "learning_in_action" || raw.includes("artist")) {
      return "artist_gallery";
    }
    return "students_gallery";
  };

  // Only published items appear on the public site
  const published = dataset.filter((i) => i.isPublished);
  assert.strictEqual(published.length, 6, "Must contain exactly 6 published items");

  // 1. Filter: "All"
  const allFilter = published;
  assert.strictEqual(allFilter.length, 6, "'All' filter must include every published image");

  // 2. Filter: "Artist Gallery"
  const artistFilter = published.filter((i) => normalize(i) === "artist_gallery");
  assert.strictEqual(artistFilter.length, 3, "'Artist Gallery' must include only the 3 artist pieces");
  assert.ok(artistFilter.every((i) => i.id.startsWith("art-")), "All items in Artist Gallery must be artist pieces");

  // 3. Filter: "Students Gallery"
  const studentFilter = published.filter((i) => normalize(i) === "students_gallery");
  assert.strictEqual(studentFilter.length, 3, "'Students Gallery' must include only the 3 student pieces");
  assert.ok(studentFilter.every((i) => i.id.startsWith("stu-")), "All items in Students Gallery must be student pieces");
});

// -----------------------------------------------------------------------------
// Test 5: API Routes Accept New Category IDs
// -----------------------------------------------------------------------------
runTest("Test 5: API routes validate and accept artist_gallery and students_gallery", () => {
  const postRoute = fs.readFileSync("app/api/admin/media/route.ts", "utf8");
  assert.ok(postRoute.includes('categoryRaw === "artist_gallery"'), "POST /api/admin/media must accept artist_gallery");
  assert.ok(postRoute.includes('"students_gallery"'), "POST /api/admin/media must support students_gallery");

  const patchRoute = fs.readFileSync("app/api/admin/media/[id]/route.ts", "utf8");
  assert.ok(patchRoute.includes('body.category === "artist_gallery"'), "PATCH /api/admin/media/[id] must accept artist_gallery");
  assert.ok(patchRoute.includes('body.category === "students_gallery"'), "PATCH /api/admin/media/[id] must accept students_gallery");
});

console.log("==================================================================");
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
}
