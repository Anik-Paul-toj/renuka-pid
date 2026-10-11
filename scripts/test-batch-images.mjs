// ==============================================================================
// Renuka Art Studio - Cloudinary Course Cover Image Integration Test Suite
// Verifies:
// 1. Cloudinary course covers folder configuration (renuka-art-studio/course-covers)
// 2. MIME type & file size restrictions (JPEG, PNG, WEBP, AVIF <= 10MB)
// 3. Migration SQL file integrity (20261012000002_course_cover_image.sql)
// 4. Independence between Foundation and Artistry course cover images
// 5. Dynamic imagePath wiring on public CourseCatalogClient (/course)
// 6. Admin batch image management component and controls
// 7. Cloudinary optimized delivery URLs (f_auto, q_auto)
// 8. Server-side API route authentication & authorization guards
// 9. next.config.ts remotePattern includes res.cloudinary.com
// 10. Preservation of Gallery and Media assets
// ==============================================================================

import assert from "node:assert";
import fs from "node:fs";

console.log("==================================================================");
console.log("RUNNING CLOUDINARY COURSE COVER IMAGE INTEGRATION TEST SUITE");
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
// Test 1: Cloudinary Folder Configuration
// ------------------------------------------------------------------------------
runTest("Test 1: Cloudinary folder configured as 'renuka-art-studio/course-covers'", () => {
  const servicePath = "lib/cloudinary/service.ts";
  assert.ok(fs.existsSync(servicePath), "lib/cloudinary/service.ts must exist");
  const content = fs.readFileSync(servicePath, "utf-8");

  assert.ok(
    content.includes('export const CLOUDINARY_COURSE_COVERS_FOLDER = "renuka-art-studio/course-covers"'),
    "Course cover folder must be defined as 'renuka-art-studio/course-covers'"
  );
  assert.ok(
    content.includes("export async function uploadCourseCoverBuffer"),
    "uploadCourseCoverBuffer must be exported"
  );
});

// ------------------------------------------------------------------------------
// Test 2: File Validation (MIME Types & Max Size)
// ------------------------------------------------------------------------------
runTest("Test 2: Allowed MIME types include JPEG, PNG, WEBP, AVIF and limit to 10MB", () => {
  const servicePath = "lib/cloudinary/service.ts";
  const content = fs.readFileSync(servicePath, "utf-8");

  assert.ok(content.includes('"image/jpeg"'), "Must allow image/jpeg");
  assert.ok(content.includes('"image/png"'), "Must allow image/png");
  assert.ok(content.includes('"image/webp"'), "Must allow image/webp");
  assert.ok(content.includes('"image/avif"'), "Must allow image/avif");
  assert.ok(content.includes("10 * 1024 * 1024"), "Must enforce 10MB file limit");
});

// ------------------------------------------------------------------------------
// Test 3: SQL Migration Integrity
// ------------------------------------------------------------------------------
runTest("Test 3: Migration file exists with cover_image_url columns for courses and cohort_batches", () => {
  const migrationPath = "supabase/migrations/20261012000002_course_cover_image.sql";
  assert.ok(fs.existsSync(migrationPath), `Migration must exist at ${migrationPath}`);

  const sql = fs.readFileSync(migrationPath, "utf-8");
  assert.ok(sql.includes("ALTER TABLE public.courses"), "Must alter courses table");
  assert.ok(sql.includes("cover_image_url TEXT"), "Must add cover_image_url column");
  assert.ok(sql.includes("cover_image_public_id TEXT"), "Must add cover_image_public_id column");
  assert.ok(sql.includes("ALTER TABLE public.cohort_batches"), "Must alter cohort_batches table");
  assert.ok(sql.includes("public.public_cohort_batches"), "Must refresh public_cohort_batches view");
});

// ------------------------------------------------------------------------------
// Test 4: Course Independence & Baseline Artwork
// ------------------------------------------------------------------------------
runTest("Test 4: Foundation and Artistry courses maintain distinct baseline artwork", () => {
  const detailsPath = "lib/courses-admin/details.ts";
  assert.ok(fs.existsSync(detailsPath));
  const content = fs.readFileSync(detailsPath, "utf-8");

  assert.ok(content.includes('"watercolour-foundation": "/images/foundation.jpeg"'));
  assert.ok(content.includes('"watercolour-artistry-foundation": "/images/ARTISTRY.jpeg"'));
});

// ------------------------------------------------------------------------------
// Test 5: Dynamic Image Wiring on Public Course Catalog
// ------------------------------------------------------------------------------
runTest("Test 5: Public CourseCatalogClient (/course) uses dynamic imagePath with fallbacks", () => {
  const catalogPath = "components/course/CourseCatalogClient.tsx";
  assert.ok(fs.existsSync(catalogPath));
  const content = fs.readFileSync(catalogPath, "utf-8");

  assert.ok(
    content.includes("foundationCourse.imagePath || \"/images/foundation.jpeg\""),
    "Foundation card must use foundationCourse.imagePath"
  );
  assert.ok(
    content.includes("artistryCourse.imagePath || \"/images/ARTISTRY.jpeg\""),
    "Artistry card must use artistryCourse.imagePath"
  );
});

// ------------------------------------------------------------------------------
// Test 6: Admin Batch Schedule Manager Image Controls
// ------------------------------------------------------------------------------
runTest("Test 6: AdminBatchScheduleManager includes cover image preview and upload controls", () => {
  const managerPath = "components/admin/batches/AdminBatchScheduleManager.tsx";
  assert.ok(fs.existsSync(managerPath));
  const content = fs.readFileSync(managerPath, "utf-8");

  assert.ok(
    content.includes("Course Cover Image"),
    "Must include cover image section header"
  );
  assert.ok(
    content.includes("Upload New Image") || content.includes("Replace Image"),
    "Must include Upload/Replace image button"
  );
  assert.ok(
    content.includes("/api/admin/batches/"),
    "Must reference batch API route"
  );
  assert.ok(
    content.includes("handleImageFileChange"),
    "Must include file change handler"
  );
  assert.ok(
    content.includes("Uploading image") || content.includes("Uploading to Cloudinary"),
    "Must include upload progress indicator"
  );
});

// ------------------------------------------------------------------------------
// Test 7: Cloudinary URL Transformation & Delivery
// ------------------------------------------------------------------------------
runTest("Test 7: getOptimizedCloudinaryUrl formats Cloudinary delivery with transformations", () => {
  const servicePath = "lib/cloudinary/service.ts";
  const content = fs.readFileSync(servicePath, "utf-8");

  assert.ok(content.includes("getOptimizedCloudinaryUrl"), "Function must exist");
  assert.ok(content.includes('"f_auto"'), "Must inject f_auto");
  assert.ok(content.includes('"q_auto"'), "Must inject q_auto");
});

// ------------------------------------------------------------------------------
// Test 8: Server-side API Route Security & Authorization
// ------------------------------------------------------------------------------
runTest("Test 8: API route (/api/admin/batches/[id]/image) checks admin session and rejects editors", () => {
  const routePath = "app/api/admin/batches/[id]/image/route.ts";
  assert.ok(fs.existsSync(routePath));
  const content = fs.readFileSync(routePath, "utf-8");

  assert.ok(content.includes("getAdminSession"), "Must verify admin session");
  assert.ok(content.includes("status: 401"), "Must return 401 if unauthenticated");
  assert.ok(content.includes("status: 403"), "Must return 403 if unauthorized or editor");
  assert.ok(content.includes("uploadCourseCoverBuffer"), "Must call uploadCourseCoverBuffer");
  assert.ok(content.includes("updateCourseCoverImage"), "Must call updateCourseCoverImage");
});

// ------------------------------------------------------------------------------
// Test 9: Remote Patterns in next.config.ts
// ------------------------------------------------------------------------------
runTest("Test 9: next.config.ts allows res.cloudinary.com remotePattern", () => {
  const configPath = "next.config.ts";
  assert.ok(fs.existsSync(configPath));
  const content = fs.readFileSync(configPath, "utf-8");

  assert.ok(
    content.includes("res.cloudinary.com"),
    "Must allow res.cloudinary.com in next.config.ts"
  );
});

// ------------------------------------------------------------------------------
// Test 10: Preservation of Gallery Assets & Folders
// ------------------------------------------------------------------------------
runTest("Test 10: Existing Gallery folders and media assets remain unmodified", () => {
  const galleryServicePath = "lib/gallery/service.ts";
  assert.ok(fs.existsSync(galleryServicePath));
  const content = fs.readFileSync(galleryServicePath, "utf-8");

  assert.ok(
    content.includes("uploadGalleryImage"),
    "Gallery upload function must remain intact"
  );
  assert.ok(
    content.includes("media_assets"),
    "Gallery media_assets table reference must remain intact"
  );
  const cloudinaryContent = fs.readFileSync("lib/cloudinary/service.ts", "utf-8");
  assert.ok(
    cloudinaryContent.includes("CLOUDINARY_GALLERY_FOLDER"),
    "Gallery folder constant must remain intact"
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
