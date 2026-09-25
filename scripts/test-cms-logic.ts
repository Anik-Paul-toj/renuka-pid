import { sectionSchemaMap } from "../lib/validations/cms";
import { CMSSectionKey } from "../lib/types/cms";
import { z } from "zod";

interface MockAdminSession {
  user: { id: string; email: string };
  adminProfile: {
    id: string;
    email: string;
    role: "super_admin" | "admin" | "editor";
    full_name: string | null;
    is_active: boolean;
  };
}

interface MockLandingContentRow {
  id: string;
  section_key: string;
  content_json: any;
  status: "draft" | "preview" | "published" | "archived";
  version: number;
  published_at?: string | null;
  published_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

// In-memory simulation of the exact API logic in app/api/admin/landing-content/[sectionKey]/route.ts
function simulateCmsApi(
  session: MockAdminSession | null,
  sectionKey: string,
  body: { action: string; content?: any },
  dbState: MockLandingContentRow[]
): { status: number; body: { success: boolean; data?: any; error?: any } } {
  // 1. Auth check
  if (!session) {
    return {
      status: 401,
      body: {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      },
    };
  }

  // 2. Section key whitelist
  const validKeys = Object.keys(sectionSchemaMap);
  if (!validKeys.includes(sectionKey)) {
    return {
      status: 400,
      body: {
        success: false,
        error: { code: "INVALID_SECTION_KEY", message: `Unknown key '${sectionKey}'` },
      },
    };
  }

  const { action, content } = body;

  // 3. Action validation
  if (!["save_draft", "publish", "discard_draft"].includes(action)) {
    return {
      status: 400,
      body: {
        success: false,
        error: { code: "INVALID_REQUEST", message: "Unsupported action." },
      },
    };
  }

  // 4. Role check for publish
  if (action === "publish" && !["admin", "super_admin"].includes(session.adminProfile.role)) {
    return {
      status: 403,
      body: {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions. Only administrators can publish.",
        },
      },
    };
  }

  // 5. Handle discard_draft
  if (action === "discard_draft") {
    const draftIndex = dbState.findIndex(
      (r) => r.section_key === sectionKey && r.status === "draft"
    );
    if (draftIndex >= 0) {
      dbState.splice(draftIndex, 1);
    }
    return {
      status: 200,
      body: {
        success: true,
        data: { section_key: sectionKey, message: "Draft discarded." },
      },
    };
  }

  // 6. Schema validation for save_draft & publish
  const schema = sectionSchemaMap[sectionKey as CMSSectionKey];
  const validation = schema.safeParse(content);

  if (!validation.success) {
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Content payload failed schema validation.",
          details: validation.error.flatten(),
        },
      },
    };
  }

  const validatedContent = validation.data;
  const publishedRecord = dbState.find((r) => r.section_key === sectionKey && r.status === "published");
  const draftRecord = dbState.find((r) => r.section_key === sectionKey && r.status === "draft");

  // 7. Save Draft
  if (action === "save_draft") {
    if (draftRecord) {
      draftRecord.content_json = validatedContent;
      draftRecord.version += 1;
      draftRecord.updated_at = new Date().toISOString();
      return {
        status: 200,
        body: {
          success: true,
          data: { section_key: sectionKey, status: "draft", version: draftRecord.version },
        },
      };
    } else {
      const nextVer = (publishedRecord?.version || 0) + 1;
      const newDraft: MockLandingContentRow = {
        id: `draft-${Date.now()}`,
        section_key: sectionKey,
        content_json: validatedContent,
        status: "draft",
        version: nextVer,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dbState.push(newDraft);
      return {
        status: 200,
        body: {
          success: true,
          data: { section_key: sectionKey, status: "draft", version: nextVer },
        },
      };
    }
  }

  // 8. Publish (Atomic update on published row + draft removal)
  if (action === "publish") {
    const nowIso = new Date().toISOString();
    let publishedVer = 1;

    if (publishedRecord) {
      publishedRecord.content_json = validatedContent;
      publishedRecord.version += 1;
      publishedRecord.published_at = nowIso;
      publishedRecord.published_by = session.user.id;
      publishedRecord.updated_at = nowIso;
      publishedVer = publishedRecord.version;
    } else {
      dbState.push({
        id: `pub-${Date.now()}`,
        section_key: sectionKey,
        content_json: validatedContent,
        status: "published",
        version: 1,
        published_at: nowIso,
        published_by: session.user.id,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    // Clean up draft if present
    const draftIndex = dbState.findIndex(
      (r) => r.section_key === sectionKey && r.status === "draft"
    );
    if (draftIndex >= 0) {
      dbState.splice(draftIndex, 1);
    }

    return {
      status: 200,
      body: {
        success: true,
        data: { section_key: sectionKey, status: "published", version: publishedVer },
      },
    };
  }

  return { status: 400, body: { success: false, error: { message: "Unknown action" } } };
}

// Sample Valid Seed Fixtures matching all 18 sections
const validFixtures: Record<CMSSectionKey, any> = {
  brand: {
    name: "Renuka Aggarwal",
    studioName: "ART STUDIO",
    tagline: "ART | MINDFULNESS | A BRIGHTER YOU",
    subTagline: "Mindful Watercolor & Creative Well-Being",
  },
  hero: {
    pillLabel: "ART FOR A CALMER, BRIGHTER YOU",
    headlineStart: "Learn Art. Rediscover Yourself. ",
    headlineHighlight: "Create a Kinder You.",
    subheadline: "Begin your creative journey with mindful, step-by-step watercolour courses.",
    handwrittenPhrase: "Art heals. Always.",
    date: "Saturday, 28 October 2026",
    time: "6:30 PM IST",
    duration: "120 Minutes",
    language: "English",
    ctaText: "EXPLORE COURSES",
    urgencyText: "Complimentary live registration",
    guaranteeText: "Limited to 200 interactive attendees.",
    targetAudienceNote: "Designed warmly for beginners.",
    instructorName: "Renuka Aggarwal",
    instructorTitle: "Art Educator",
    instructorImage: "/images/instructor_hero.jpeg",
  },
  stats: [
    { number: "15+ Years", label: "of teaching experience", icon: "Sparkles" },
    { number: "1,000+ Students", label: "guided gently", icon: "Users" },
  ],
  trustSection: {
    overline: "A GENTLE, MINDFUL ATELIER",
    headline: "No rush, no competition — ",
    headlineHighlight: "just you, the brush, and the flow of water.",
    description: "In every live session, we honor art as a form of meditation.",
  },
  aboutArtist: {
    eyebrow: "MEET YOUR GUIDE",
    heading: "From gentle brushstrokes to lifelong confidence.",
    role: "Art Educator | Founder, Art Studio",
    introduction: "I believe that everyone carries an innate creative light.",
    bio: ["Paragraph 1", "Paragraph 2"],
    qualifications: ["Master of Fine Arts", "15+ Years Practice"],
    expertise: ["Wet-on-wet technique", "Color harmony"],
  },
  targetAudience: {
    heading: "Who This Masterclass Is Made For",
    items: [
      {
        id: "aud-1",
        title: "The Complete Beginner",
        description: "Never held a brush? Perfect.",
        icon: "Heart",
      },
    ],
  },
  videoSection: {
    overline: "STUDIO PREVIEW",
    headline: "Step Inside the Atelier",
    videoTitle: "Watercolor for a Calmer, Brighter You",
    videoThumbnail: "/images/video_preview.jpg",
    learningPoints: ["How pigment moves with water", "Gentle breathing rhythm"],
    ctaText: "RESERVE MY SEAT",
  },
  transformation: {
    overline: "THE JOURNEY",
    headline: "From Hesitation to ",
    headlineHighlight: "Heartfelt Expression",
    beforeTitle: "Where you might be today",
    beforePoints: ["Feeling creative block", "Unsure of materials"],
    afterTitle: "Where this masterclass takes you",
    afterPoints: ["Intuitive color mixing", "Quiet confidence"],
    takeaway: "Watercolour isn't about perfection.",
  },
  methodFramework: {
    overline: "THE RENUKA METHOD",
    headline: "A 4-Step Framework for ",
    headlineHighlight: "Effortless Watercolor",
    steps: [
      {
        number: "01",
        title: "Breath & Pigment",
        subtitle: "The Foundation",
        description: "Learn how water carries emotion.",
        icon: "Sparkles",
      },
    ],
    pillSummary: "A proven, mindful sequence",
  },
  coreSecrets: {
    overline: "WHAT YOU'LL MASTER",
    headline: "The 3 Core Secrets of ",
    headlineHighlight: "Luminous Watercolors",
    secrets: [
      {
        number: "Secret #1",
        title: "Water-to-Pigment Ratio",
        subtitle: "The Sacred Balance",
        description: "Never have muddy washes again.",
        bullets: ["How much water is too much", "Consistency check"],
        icon: "Droplets",
      },
    ],
    bottomNote: "Every secret is demonstrated live",
    ctaText: "LEARN THE SECRETS",
  },
  outcomes: {
    overline: "YOUR ARTWORK",
    headline: "What You Will Create and ",
    headlineHighlight: "Take Home Forever",
    description: "By the end of our 2 hours together, you will hold completed paintings.",
    items: ["A luminous sunset study", "Botanical wash study"],
    disclaimer: "No prior experience required.",
  },
  instructorStory: {
    overline: "THE STORY",
    headline: "Why I Started Teaching Watercolor",
    name: "Renuka Aggarwal",
    subtitle: "Founder, Art Studio",
    paragraphs: ["Art saved me during a hectic chapter of life."],
    quote: "When water meets paper, the mind finally rests.",
    quoteAuthor: "Renuka Aggarwal",
    image: "/images/instructor_story.jpeg",
  },
  bonuses: {
    overline: "SPECIAL ENROLLMENT GIFTS",
    headline: "Complimentary Resources to ",
    headlineHighlight: "Support Your Creative Journey",
    items: [
      {
        id: "bonus-1",
        title: "The Ultimate Watercolor Supplies Cheat Sheet",
        description: "Exact papers, brushes, and pigments.",
        type: "Digital Guide (PDF)",
        icon: "FileText",
      },
    ],
    deliveryNote: "Delivered instantly to your email upon registration",
  },
  fitCheck: {
    overline: "IS THIS RIGHT FOR YOU?",
    headline: "Let's Make Sure This Is Your Sanctuary",
    fitTitle: "This IS for you if...",
    fitPoints: ["You want a gentle, non-judgmental space"],
    unfitTitle: "This is NOT for you if...",
    unfitPoints: ["You want strict, competitive speed-painting"],
    closingNote: "Our studio is a circle of kindness.",
  },
  included: {
    overline: "COMPLETE PACKAGE",
    headline: "Everything Included in Your Registration",
    items: [
      { title: "2-Hour Live Interactive Masterclass with Renuka", status: "Included" },
    ],
    feeLabel: "Registration Value",
    feeValue: "Complimentary (Normally ₹599)",
    ctaText: "CLAIM MY FREE SEAT",
    guaranteeNote: "100% Free • No credit card required",
  },
  faqs: [
    {
      question: "Do I need prior painting experience?",
      answer: "None whatsoever! This workshop is crafted specifically for complete beginners.",
    },
  ],
  finalCta: {
    overline: "YOUR CREATIVE CALLING",
    headline: "Give Yourself Two Hours of Pure Creative Joy",
    description: "Seats are strictly limited to ensure an intimate studio atmosphere.",
    handwrittenPhrase: "Your canvas is waiting.",
    ctaText: "RESERVE MY SEAT NOW",
    dateInfo: "Live on Zoom • Saturday, 28 October 2026 • 6:30 PM IST",
    subNote: "Limited to 200 live attendees.",
  },
  footer: {
    brandDescription: "Art Studio is dedicated to bringing mindfulness through watercolor.",
    links: [
      { label: "Courses", href: "#courses" },
      { label: "About Renuka", href: "#about" },
    ],
    contactEmail: "hello@renukaartstudio.com",
    copyrightYear: 2026,
    disclaimer: "All artwork and curriculum copyright © 2026 Renuka Aggarwal.",
    handwrittenSignature: "With love & color, Renuka",
  },
};

function runCmsLogicTests() {
  console.log("==========================================================");
  console.log("  PHASE 6: LANDING PAGE CMS & LIFECYCLE TEST SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      console.log(`✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${description}`);
      failed++;
    }
  };

  const editorSession: MockAdminSession = {
    user: { id: "editor-uuid", email: "editor@renukaartstudio.com" },
    adminProfile: {
      id: "editor-uuid",
      email: "editor@renukaartstudio.com",
      role: "editor",
      full_name: "Content Editor",
      is_active: true,
    },
  };

  const adminSession: MockAdminSession = {
    user: { id: "admin-uuid", email: "admin@renukaartstudio.com" },
    adminProfile: {
      id: "admin-uuid",
      email: "admin@renukaartstudio.com",
      role: "admin",
      full_name: "Studio Admin",
      is_active: true,
    },
  };

  const superAdminSession: MockAdminSession = {
    user: { id: "superadmin-uuid", email: "superadmin@renukaartstudio.com" },
    adminProfile: {
      id: "superadmin-uuid",
      email: "superadmin@renukaartstudio.com",
      role: "super_admin",
      full_name: "Super Admin",
      is_active: true,
    },
  };

  // TEST 1: All 18 Canonical Section Schemas Accept Valid Seeded Content
  console.log("--- TEST 1: All 18 Canonical Schemas Accept Valid Content ---");
  const keys = Object.keys(sectionSchemaMap) as CMSSectionKey[];
  assert(keys.length === 18, "Exact 18 canonical section keys present");

  for (const key of keys) {
    const schema = sectionSchemaMap[key];
    const fixture = validFixtures[key];
    const res = schema.safeParse(fixture);
    assert(res.success, `Schema '${key}' validates canonical payload`);
  }

  // TEST 2: Invalid Content Rejection
  console.log("\n--- TEST 2: Rejection of Invalid / Malformed Content ---");
  const malformedHero = { ...validFixtures.hero, headlineStart: "" }; // Empty headline
  assert(!sectionSchemaMap.hero.safeParse(malformedHero).success, "Hero schema rejects empty headlineStart");

  const malformedStats = [{ number: "10" }]; // Missing label & icon
  assert(!sectionSchemaMap.stats.safeParse(malformedStats).success, "Stats schema rejects incomplete item");

  const malformedFooter = { ...validFixtures.footer, contactEmail: "not-an-email" };
  assert(!sectionSchemaMap.footer.safeParse(malformedFooter).success, "Footer schema rejects invalid email format");

  // TEST 3: Invalid Section Key Rejection
  console.log("\n--- TEST 3: Invalid Section Key Rejection ---");
  const fakeKeyRes = simulateCmsApi(adminSession, "non_existent_key", { action: "save_draft", content: {} }, []);
  assert(fakeKeyRes.status === 400 && fakeKeyRes.body.error.code === "INVALID_SECTION_KEY", "Invalid section key returns 400 INVALID_SECTION_KEY");

  // TEST 4: Unauthenticated Access Rejection
  console.log("\n--- TEST 4: Unauthenticated API Access ---");
  const unauthRes = simulateCmsApi(null, "hero", { action: "save_draft", content: validFixtures.hero }, []);
  assert(unauthRes.status === 401 && unauthRes.body.error.code === "UNAUTHORIZED", "Unauthenticated request returns 401 UNAUTHORIZED");

  // TEST 5: Editor Can Save Draft
  console.log("\n--- TEST 5: Editor Role Can Save Drafts ---");
  const mockDb: MockLandingContentRow[] = [
    {
      id: "pub-1",
      section_key: "hero",
      content_json: validFixtures.hero,
      status: "published",
      version: 1,
      published_at: new Date().toISOString(),
    },
  ];

  const editorDraftRes = simulateCmsApi(
    editorSession,
    "hero",
    { action: "save_draft", content: { ...validFixtures.hero, headlineStart: "Updated Draft Headline " } },
    mockDb
  );
  assert(editorDraftRes.status === 200 && editorDraftRes.body.data.status === "draft", "Editor successfully created draft (status 200)");
  assert(mockDb.length === 2, "Database now holds 1 published + 1 draft row");
  const draftRow = mockDb.find((r) => r.status === "draft");
  assert(draftRow?.version === 2, "Draft version incremented to 2");

  // TEST 6: Draft Does Not Alter Published Content
  console.log("\n--- TEST 6: Draft Save Does Not Touch Published Row ---");
  const pubRow = mockDb.find((r) => r.status === "published");
  assert(pubRow?.content_json.headlineStart === "Learn Art. Rediscover Yourself. ", "Published row remains 100% untouched while drafting");

  // TEST 7: Editor Cannot Publish (403 Forbidden)
  console.log("\n--- TEST 7: Editor Cannot Publish Live Content ---");
  const editorPublishRes = simulateCmsApi(
    editorSession,
    "hero",
    { action: "publish", content: draftRow?.content_json },
    mockDb
  );
  assert(editorPublishRes.status === 403 && editorPublishRes.body.error.code === "FORBIDDEN", "Editor publishing attempt returns 403 FORBIDDEN");

  // TEST 8: Admin Can Publish (Atomic Update & Draft Cleanup)
  console.log("\n--- TEST 8: Admin Can Publish Atomically ---");
  const adminPublishRes = simulateCmsApi(
    adminSession,
    "hero",
    { action: "publish", content: draftRow?.content_json },
    mockDb
  );
  assert(adminPublishRes.status === 200 && adminPublishRes.body.data.status === "published", "Admin published changes successfully (status 200)");
  assert(mockDb.length === 1, "Draft row cleaned up after publishing (only 1 row in DB)");
  const updatedPub = mockDb.find((r) => r.status === "published");
  assert(updatedPub?.content_json.headlineStart === "Updated Draft Headline ", "Published content updated with new text");
  assert(updatedPub?.version === 2, "Published version incremented to v2");

  // TEST 9: Super Admin Can Also Publish
  console.log("\n--- TEST 9: Super Admin Can Publish ---");
  const superAdminPublishRes = simulateCmsApi(
    superAdminSession,
    "brand",
    { action: "publish", content: validFixtures.brand },
    mockDb
  );
  assert(superAdminPublishRes.status === 200, "Super Admin published section successfully");

  // TEST 10: Discard Draft
  console.log("\n--- TEST 10: Discard Draft Reverts State Safely ---");
  // Create a new draft
  simulateCmsApi(adminSession, "hero", { action: "save_draft", content: { ...validFixtures.hero, headlineStart: "Temporary Idea " } }, mockDb);
  assert(mockDb.some((r) => r.status === "draft"), "Draft exists before discard");

  const discardRes = simulateCmsApi(adminSession, "hero", { action: "discard_draft" }, mockDb);
  assert(discardRes.status === 200, "Discard draft executed successfully");
  assert(!mockDb.some((r) => r.status === "draft"), "Draft removed from DB after discard");
  assert(mockDb.find((r) => r.status === "published")?.version === 2, "Published content remains completely intact after discard");

  console.log("\n==========================================================");
  console.log(`  CMS TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runCmsLogicTests();
