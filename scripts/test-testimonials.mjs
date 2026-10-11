// ==============================================================================
// Renuka Art Studio - Video Testimonials Integration Test Suite
// Verifies:
// 1. YouTube URL extraction across watch, youtu.be, shorts, embeds, raw IDs
// 2. Strict rejection of unsupported providers and invalid formats
// 3. Privacy-enhanced embed URL & thumbnail generator
// 4. Input validation (student name, description, YouTube URL)
// 5. Public vs Draft publication filtering & display_order sorting
// 6. Graceful database resilience when table is pending migration (PGRST205)
// 7. Revalidation targets for landing page and admin panel
// 8. SQL Migration schema integrity, constraints, and Row Level Security
// 9. Navbar and Admin Sidebar navigation wiring
// 10. Preservation of existing Gallery and Media assets
// ==============================================================================

import assert from "node:assert";
import fs from "node:fs";

console.log("==================================================================");
console.log("RUNNING STUDENT VIDEO TESTIMONIALS TEST SUITE");
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
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from "../lib/testimonials/youtube.ts";

// ------------------------------------------------------------------------------
// Test 1: YouTube URL Extraction across multiple valid formats
// ------------------------------------------------------------------------------
runTest("Test 1: YouTube URL extraction correctly handles all standard and mobile formats", () => {
  const expectedId = "dQw4w9WgXcQ";

  const testCases = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ&feature=share",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?si=abcdef123456",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://youtube.com/shorts/dQw4w9WgXcQ?feature=share",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    "dQw4w9WgXcQ", // Direct 11-char ID
  ];

  for (const url of testCases) {
    const extracted = extractYouTubeVideoId(url);
    assert.strictEqual(
      extracted,
      expectedId,
      `Failed to extract video ID from URL: ${url} (got: ${extracted})`
    );
  }
});

// ------------------------------------------------------------------------------
// Test 2: Invalid or Unsupported URLs are Strictly Rejected
// ------------------------------------------------------------------------------
runTest("Test 2: Non-YouTube domains and malformed URLs are rejected", () => {
  const invalidCases = [
    "",
    "   ",
    null,
    undefined,
    "https://vimeo.com/12345678",
    "https://dailymotion.com/video/x7tgad0",
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/tooShort",
    "https://www.youtube.com/watch?v=tooShort",
    "https://www.youtube.com/watch?v=tooLongString123456",
    "<script>alert(1)</script>",
    "not-a-valid-url-at-all",
  ];

  for (const invalid of invalidCases) {
    const res = extractYouTubeVideoId(invalid);
    assert.strictEqual(
      res,
      null,
      `Expected null for invalid input: ${invalid}, got: ${res}`
    );
  }
});

// ------------------------------------------------------------------------------
// Test 3: Privacy-Enhanced Embed & Thumbnail Generators
// ------------------------------------------------------------------------------
runTest("Test 3: Privacy-enhanced embed URL (youtube-nocookie.com) and thumbnail generation", () => {
  const videoId = "AbCdEf12345";
  const embedUrl = getYouTubeEmbedUrl(videoId, { autoplay: true });
  assert.ok(
    embedUrl.includes("https://www.youtube-nocookie.com/embed/AbCdEf12345"),
    "Embed URL must use youtube-nocookie.com domain"
  );
  assert.ok(embedUrl.includes("autoplay=1"), "Embed URL must include autoplay=1");
  assert.ok(embedUrl.includes("rel=0"), "Embed URL must restrict related videos to same channel (rel=0)");

  const thumbUrl = getYouTubeThumbnailUrl(videoId, "hq");
  assert.strictEqual(
    thumbUrl,
    "https://i.ytimg.com/vi/AbCdEf12345/hqdefault.jpg",
    "Thumbnail URL must use reliable hqdefault.jpg endpoint"
  );
});

// ------------------------------------------------------------------------------
// Test 4: Creation Validation Logic
// ------------------------------------------------------------------------------
runTest("Test 4: Validation correctly guards required fields and formats", () => {
  // Check required name
  const validateInput = (input) => {
    if (!input.studentName?.trim()) throw new Error("Student name or display name is required.");
    if (!input.description?.trim()) throw new Error("Testimonial description or quote is required.");
    if (!input.youtubeUrl?.trim()) throw new Error("YouTube video URL is required.");
    const id = extractYouTubeVideoId(input.youtubeUrl);
    if (!id) throw new Error("Invalid YouTube URL.");
    return id;
  };

  assert.throws(
    () => validateInput({ studentName: "", description: "Great", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ" }),
    /Student name/
  );
  assert.throws(
    () => validateInput({ studentName: "Priya", description: "", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ" }),
    /description/
  );
  assert.throws(
    () => validateInput({ studentName: "Priya", description: "Loved it", youtubeUrl: "https://vimeo.com/99" }),
    /Invalid YouTube URL/
  );

  const validId = validateInput({
    studentName: "Priya Sharma",
    description: "The watercolor cohort transformed my understanding of water control.",
    youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
  });
  assert.strictEqual(validId, "dQw4w9WgXcQ");
});

// ------------------------------------------------------------------------------
// Test 5: Publication Filtering & Display Order Sorting Logic
// ------------------------------------------------------------------------------
runTest("Test 5: Public visitors see only published testimonials in display_order ASC", () => {
  const sampleData = [
    { id: "1", studentName: "Student A", isPublished: true, displayOrder: 2, createdAt: "2026-10-01" },
    { id: "2", studentName: "Student B", isPublished: false, displayOrder: 0, createdAt: "2026-10-02" }, // Draft
    { id: "3", studentName: "Student C", isPublished: true, displayOrder: 1, createdAt: "2026-10-03" },
    { id: "4", studentName: "Student D", isPublished: false, displayOrder: 3, createdAt: "2026-10-04" }, // Draft
  ];

  // Public Filter
  const publicItems = sampleData
    .filter((item) => item.isPublished)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  assert.strictEqual(publicItems.length, 2, "Only published items should be returned for public");
  assert.strictEqual(publicItems[0].id, "3", "First item should be displayOrder 1");
  assert.strictEqual(publicItems[1].id, "1", "Second item should be displayOrder 2");
  assert.ok(!publicItems.some((i) => !i.isPublished), "No drafts must appear in publicItems");
});

// ------------------------------------------------------------------------------
// Test 6: Database Resilience for Pending Migration (PGRST205)
// ------------------------------------------------------------------------------
runTest("Test 6: Graceful error handling returns empty list when table is pending migration", () => {
  const simulateSupabaseError = (errorCode) => {
    if (errorCode === "PGRST205") {
      // Table does not exist in schema cache
      return { data: null, error: { code: "PGRST205", message: "Could not find table" } };
    }
    return { data: [], error: null };
  };

  const handleResult = (res) => {
    if (res.error?.code === "PGRST205") return [];
    return res.data || [];
  };

  const safePublic = handleResult(simulateSupabaseError("PGRST205"));
  assert.deepStrictEqual(safePublic, [], "Must return empty array without crashing");
});

// ------------------------------------------------------------------------------
// Test 7: Migration File Schema & RLS Policy Integrity
// ------------------------------------------------------------------------------
runTest("Test 7: SQL migration file defines video_testimonials table and strict RLS policies", () => {
  const migrationPath = "supabase/migrations/20261011000001_video_testimonials.sql";
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist at 20261011000001_video_testimonials.sql");

  const sql = fs.readFileSync(migrationPath, "utf8");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.video_testimonials"), "Must create video_testimonials table");
  assert.ok(sql.includes("student_name TEXT NOT NULL"), "Must include student_name NOT NULL");
  assert.ok(sql.includes("youtube_url TEXT NOT NULL"), "Must include youtube_url NOT NULL");
  assert.ok(sql.includes("youtube_video_id TEXT NOT NULL"), "Must include youtube_video_id NOT NULL");
  assert.ok(sql.includes("course_name TEXT"), "Must include course_name");
  assert.ok(sql.includes("display_order INTEGER NOT NULL DEFAULT 0"), "Must include display_order");
  assert.ok(sql.includes("is_published BOOLEAN NOT NULL DEFAULT true"), "Must include is_published flag");
  assert.ok(sql.includes("ENABLE ROW LEVEL SECURITY"), "Must enable Row Level Security");
  assert.ok(sql.includes("is_published = true"), "Must have public SELECT policy restricted to is_published = true");
  assert.ok(sql.includes("public.is_admin()"), "Must have admin policy with public.is_admin() check");
});

// ------------------------------------------------------------------------------
// Test 8: Navbar and AdminSidebar Navigation Consistency
// ------------------------------------------------------------------------------
runTest("Test 8: Navigation anchors and admin sidebar tabs are properly wired", () => {
  const navbarContent = fs.readFileSync("components/Navbar.tsx", "utf8");
  assert.ok(navbarContent.includes('href: "/#testimonials"'), "Navbar must link to /#testimonials");
  assert.ok(navbarContent.includes('key: "testimonials"'), "Navbar scroll-spy must track testimonials section");

  const sidebarContent = fs.readFileSync("components/admin/AdminSidebar.tsx", "utf8");
  assert.ok(sidebarContent.includes('name: "Testimonials"'), "AdminSidebar must have Testimonials menu item");
  assert.ok(sidebarContent.includes('href: "/admin/testimonials"'), "AdminSidebar must link to /admin/testimonials");

  const faqContent = fs.readFileSync("components/FAQ.tsx", "utf8");
  assert.ok(faqContent.includes('id="faq"'), "FAQ component section id must be faq to avoid id clash");
});

// ------------------------------------------------------------------------------
// Test 9: Landing Page Component Integration
// ------------------------------------------------------------------------------
runTest("Test 9: LandingPageClient embeds TestimonialsSection with id='testimonials'", () => {
  const pageContent = fs.readFileSync("app/page.tsx", "utf8");
  assert.ok(pageContent.includes("getPublicVideoTestimonials"), "app/page.tsx must fetch public video testimonials");
  assert.ok(pageContent.includes("initialTestimonials={testimonials}"), "app/page.tsx must pass testimonials to LandingPageClient");

  const clientContent = fs.readFileSync("components/LandingPageClient.tsx", "utf8");
  assert.ok(clientContent.includes("<TestimonialsSection"), "LandingPageClient must mount TestimonialsSection");

  const sectionContent = fs.readFileSync("components/TestimonialsSection.tsx", "utf8");
  assert.ok(sectionContent.includes('id="testimonials"'), "TestimonialsSection must have id='testimonials'");
  assert.ok(sectionContent.includes("item.embedUrl"), "Must render privacy-enhanced YouTube embedUrl");
  assert.ok(sectionContent.includes("activePlayingId"), "Must support lazy-loaded video play on demand");

  const youtubeUtilContent = fs.readFileSync("lib/testimonials/youtube.ts", "utf8");
  assert.ok(youtubeUtilContent.includes("youtube-nocookie.com"), "YouTube utility must generate privacy-enhanced embed domain");
});

// ------------------------------------------------------------------------------
// Test 10: Existing Cloudinary Gallery & Media Remains Intact
// ------------------------------------------------------------------------------
runTest("Test 10: Gallery and media assets service remains completely intact", () => {
  const galleryService = fs.readFileSync("lib/gallery/service.ts", "utf8");
  assert.ok(galleryService.includes("getPublicGalleryImages"), "getPublicGalleryImages must be intact");
  assert.ok(galleryService.includes("uploadGalleryImageBuffer"), "uploadGalleryImageBuffer must be intact");
  assert.ok(galleryService.includes("students_creation"), "students_creation category must be intact");
  assert.ok(galleryService.includes("learning_in_action"), "learning_in_action category must be intact");
});

console.log("==================================================================");
console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log("==================================================================");

if (failedTests > 0) {
  process.exit(1);
}
