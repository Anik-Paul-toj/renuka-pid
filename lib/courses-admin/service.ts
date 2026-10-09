import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CourseContentDetails,
  CourseUpdateInput,
} from "@/lib/validations/course-admin";

export interface AdminCourseData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  originalPricePaise: number;
  offerPricePaise: number;
  originalPrice: number; // In Rupees
  offerPrice: number; // In Rupees
  currency: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  batchesCount?: number;
  imagePath: string;
  details: CourseContentDetails;
}

export const COURSE_IMAGES: Record<string, string> = {
  "watercolour-foundation": "/images/foundation.jpeg",
  "watercolour-artistry-foundation": "/images/ARTISTRY.jpeg",
};

export const DEFAULT_FOUNDATION_DETAILS: CourseContentDetails = {
  cardSubtitle: "2 Live Sessions • 90 Minutes Each",
  cardSummary: "Master the Fundamentals of Watercolour Painting",
  cardDescription: "Master the Fundamentals of Watercolour Painting",
  subjects: "Materials • Techniques • Colour Mixing • Wash",
  cardPriceLabel: "₹990/-",
  sessionCountText: "2 Live Interactive Sessions",
  sessionDurationText: "90 Minutes Each",
  durationMonthsText: "1 Week",
  fullDescription:
    "A focused 2-session foundation program designed to help you understand the essentials of watercolour before moving into detailed painting projects.",
  learningOutcomesHeading: "What You’ll Learn",
  learningOutcomesSubheading: "Essential Foundation Topics Covered",
  learningOutcomes: [
    "Introduction to Watercolour",
    "Complete Material Knowledge",
    "Understanding Papers, Brushes & Colours",
    "Essential Watercolour Techniques",
    "Different Wash Techniques",
    "Colour Theory for Watercolour",
    "Shade Chart & Colour Mixing",
    "Understanding Watercolour Brands & Products",
    "The Right Way to Set Up Your Palette",
    "Practical Tips for Choosing Art Materials",
    "Guided Mini Activity",
  ],
  whyHeading: "Why This Course?",
  whyDescription:
    "Starting watercolour can be confusing—which paper, which brushes, which colours, how much water, and which techniques to use?\n\nThis foundation course gives you the right knowledge and direction from the beginning, helping you avoid unnecessary purchases and common beginner mistakes.",
  whyCallout: "A strong foundation before you start creating.",
  scheduleHeading: "Session Details",
  scheduleItems: [
    {
      label: "Session 1",
      detail:
        "Material Knowledge, Understanding Papers, Brushes, Colours & Essential Washes (90 Mins)",
    },
    {
      label: "Session 2",
      detail:
        "Colour Theory, Shade Chart Mixing, Palette Setup & Guided Mini Activity (90 Mins)",
    },
  ],
  scheduleNote:
    "Live interactive atelier sessions on Zoom with personal feedback and guidance.",
  ctaText: "Enrol in Foundation Course",
};

export const DEFAULT_ARTISTRY_DETAILS: CourseContentDetails = {
  cardSubtitle: "Landscape • Floral • Still Life",
  cardSummary: "24 Live Interactive Sessions",
  cardDescription: "A Complete 3-Months Watercolour Learning Journey.",
  subjects: "Landscape • Floral • Still Life",
  cardPriceLabel: "Course Fee: ₹9,990/-",
  sessionCountText: "24 Live Classes",
  sessionDurationText: "90 Minutes Each",
  durationMonthsText: "3 Months",
  fullDescription:
    "The course focuses on 3 major subjects: Landscape | Still Life | Floral. You will explore each subject from the very beginning—starting from scratch and gradually developing complete artworks. Understand how…",
  learningOutcomesHeading: "What You Will Learn",
  learningOutcomesSubheading:
    "The course focuses on 3 major subjects: Landscape | Still Life | Floral",
  learningOutcomes: [
    "Explore Landscape, Floral, and Still Life from the very beginning",
    "Start from scratch and gradually develop complete, layered artworks",
    "Understand tonal values, atmospheric perspective and depth in landscapes",
    "Master delicate botanical and floral wash layering techniques",
    "Still life light, shadow and composition mastery",
    "Understand how…",
  ],
  whyHeading: "A Complete 3-Months Watercolour Learning Journey",
  whyDescription:
    "Designed for artists and creative learners who want to go beyond the basics. Through 24 structured interactive classes over three months, you will develop confidence, technique, and your own unique artistic voice across three timeless painting subjects.",
  whyCallout: "Master Landscape, Floral & Still Life with guided mentorship.",
  scheduleHeading: "3 Months | 24 Live Classes",
  scheduleItems: [
    {
      label: "2 Foundation Classes",
      detail:
        "to build a strong understanding of the basics before moving into painting.",
    },
    {
      label: "18 Demo Classes",
      detail:
        "6 live sessions every month, scheduled on Tuesdays & Thursdays according to the monthly calendar.",
    },
    {
      label: "3 Discussion Sessions",
      detail:
        "1 dedicated discussion session every month for interaction, feedback and guidance.",
    },
    {
      label: "1 Complimentary Black Ink Demo Session",
      detail: "Special bonus exploration session.",
    },
  ],
  scheduleNote:
    "The detailed class schedule will be shared every month after enrolment.",
  ctaText: "Enrol in Artistry + Foundation Course",
};

export const DEFAULT_WORKSHOP_DETAILS: CourseContentDetails = {
  cardSubtitle: "One-Day Masterclass",
  cardSummary: "Interactive Live Masterclass on Zoom",
  cardDescription: "Live Masterclass designed to fix basics and get you painting.",
  subjects: "Watercolour Essentials • Live Demonstration",
  cardPriceLabel: "Complete Live Atelier Access",
  sessionCountText: "1 Live Session",
  sessionDurationText: "130 mins",
  durationMonthsText: "1 Day",
  fullDescription:
    "Live intimate masterclass session on Zoom with personal guidance and feedback.",
  learningOutcomesHeading: "",
  learningOutcomesSubheading: "",
  learningOutcomes: [],
  whyHeading: "",
  whyDescription: "",
  whyCallout: "",
  scheduleHeading: "Live Workshop Details",
  scheduleItems: [],
  scheduleNote:
    "Live interactive atelier sessions on Zoom with personal feedback and guidance.",
  ctaText: "Register Now",
};

/**
 * Safely parses course details from JSON string or returns baseline fallback
 */
export function parseCourseDetails(
  slug: string,
  rawDescription: string | null
): CourseContentDetails {
  const isWorkshop =
    slug === "the-watercolour" || slug === "the-watercolour-roadmap";

  const fallback =
    slug === "watercolour-artistry-foundation"
      ? DEFAULT_ARTISTRY_DETAILS
      : isWorkshop
      ? DEFAULT_WORKSHOP_DETAILS
      : DEFAULT_FOUNDATION_DETAILS;

  if (!rawDescription) {
    return fallback;
  }

  const trimmed = rawDescription.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);

      if (isWorkshop) {
        return {
          ...DEFAULT_WORKSHOP_DETAILS,
          ...parsed,
          learningOutcomes: [],
          scheduleItems: [],
        };
      }

      return {
        ...fallback,
        ...parsed,
        learningOutcomes: Array.isArray(parsed.learningOutcomes)
          ? parsed.learningOutcomes
          : fallback.learningOutcomes,
        scheduleItems: Array.isArray(parsed.scheduleItems)
          ? parsed.scheduleItems
          : fallback.scheduleItems,
      };
    } catch {
      // If parsing fails, use fullDescription fallback
      return {
        ...fallback,
        fullDescription: rawDescription,
      };
    }
  }

  return {
    ...fallback,
    fullDescription: rawDescription,
  };
}

/**
 * Retrieves all courses with formatted prices in INR Rupees and associated batch counts.
 */
export async function getAdminCourses(): Promise<AdminCourseData[]> {
  const adminClient = createAdminClient();

  const { data: courses, error } = await adminClient
    .from("courses")
    .select(`
      id,
      slug,
      title,
      description,
      original_price_paise,
      offer_price_paise,
      currency,
      duration_minutes,
      is_active,
      created_at,
      updated_at,
      cohort_batches (count)
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getAdminCourses error:", error);
    throw new Error(`Failed to retrieve courses: ${error.message}`);
  }

  if (!courses || courses.length === 0) {
    return [];
  }

  return courses.map((c: any) => {
    const batchesCount = Array.isArray(c.cohort_batches)
      ? c.cohort_batches[0]?.count || 0
      : 0;

    const details = parseCourseDetails(c.slug, c.description);
    const imagePath =
      COURSE_IMAGES[c.slug] || "/images/foundation.jpeg";

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      originalPricePaise: c.original_price_paise,
      offerPricePaise: c.offer_price_paise,
      originalPrice: Math.round(c.original_price_paise / 100),
      offerPrice: Math.round(c.offer_price_paise / 100),
      currency: c.currency,
      durationMinutes: c.duration_minutes,
      isActive: c.is_active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      batchesCount,
      imagePath,
      details,
    };
  });
}

/**
 * Retrieves a single course by its ID.
 */
export async function getAdminCourseById(
  id: string
): Promise<AdminCourseData | null> {
  const adminClient = createAdminClient();

  const { data: c, error } = await adminClient
    .from("courses")
    .select(`
      id,
      slug,
      title,
      description,
      original_price_paise,
      offer_price_paise,
      currency,
      duration_minutes,
      is_active,
      created_at,
      updated_at,
      cohort_batches (count)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !c) {
    return null;
  }

  const batchesCount = Array.isArray(c.cohort_batches)
    ? (c.cohort_batches[0] as any)?.count || 0
    : 0;

  const details = parseCourseDetails(c.slug, c.description);
  const imagePath = COURSE_IMAGES[c.slug] || "/images/foundation.jpeg";

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    originalPricePaise: c.original_price_paise,
    offerPricePaise: c.offer_price_paise,
    originalPrice: Math.round(c.original_price_paise / 100),
    offerPrice: Math.round(c.offer_price_paise / 100),
    currency: c.currency,
    durationMinutes: c.duration_minutes,
    isActive: c.is_active,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    batchesCount,
    imagePath,
    details,
  };
}

/**
 * Updates a course authoritatively in Supabase.
 * Converts Rupees to integer paise and serializes structured details.
 */
export async function updateAdminCourse(
  id: string,
  input: CourseUpdateInput,
  _updatedByEmail: string
): Promise<AdminCourseData> {
  const adminClient = createAdminClient();

  // Convert normal INR Rupees to integer paise
  const originalPricePaise = Math.round(input.originalPrice * 100);
  const offerPricePaise = Math.round(input.offerPrice * 100);

  // If structured details are provided, merge and store as JSON string in description
  let storedDescription = input.description;
  if (input.details) {
    const existingDetails = parseCourseDetails(input.slug, input.description);
    const mergedDetails = { ...existingDetails, ...input.details };
    storedDescription = JSON.stringify(mergedDetails);
  }

  const nowIso = new Date().toISOString();

  const { data: updated, error } = await adminClient
    .from("courses")
    .update({
      title: input.title,
      slug: input.slug,
      description: storedDescription,
      original_price_paise: originalPricePaise,
      offer_price_paise: offerPricePaise,
      currency: input.currency,
      duration_minutes: input.durationMinutes,
      is_active: input.isActive,
      updated_at: nowIso,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    console.error("updateAdminCourse error:", error);
    throw new Error(
      `Failed to update course: ${error?.message || "Unknown error"}`
    );
  }

  // Invalidate public and admin caches so changes propagate immediately
  try {
    revalidatePath("/");
    revalidatePath("/course");
    revalidatePath("/course/watercolour-foundation");
    revalidatePath("/course/watercolour-artistry-foundation");
    revalidatePath(`/course/${updated.slug}`);
    revalidatePath("/admin/courses");
    revalidatePath("/api/cohort-batches/active");
  } catch (revalErr) {
    console.warn("Path revalidation warning:", revalErr);
  }

  const details = parseCourseDetails(updated.slug, updated.description);
  const imagePath =
    COURSE_IMAGES[updated.slug] || "/images/foundation.jpeg";

  return {
    id: updated.id,
    slug: updated.slug,
    title: updated.title,
    description: updated.description,
    originalPricePaise: updated.original_price_paise,
    offerPricePaise: updated.offer_price_paise,
    originalPrice: Math.round(updated.original_price_paise / 100),
    offerPrice: Math.round(updated.offer_price_paise / 100),
    currency: updated.currency,
    durationMinutes: updated.duration_minutes,
    isActive: updated.is_active,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
    imagePath,
    details,
  };
}

/**
 * Retrieves the two primary courses for the public /course catalog.
 */
export async function getPublicCourses(): Promise<AdminCourseData[]> {
  const adminClient = createAdminClient();

  const { data: courses, error } = await adminClient
    .from("courses")
    .select(`
      id,
      slug,
      title,
      description,
      original_price_paise,
      offer_price_paise,
      currency,
      duration_minutes,
      is_active,
      created_at,
      updated_at
    `)
    .in("slug", [
      "watercolour-foundation",
      "watercolour-artistry-foundation",
    ])
    .eq("is_active", true);

  if (error || !courses || courses.length === 0) {
    // Return baseline mock objects if DB query fails
    return [
      {
        id: "e1111111-2222-3333-4444-555555555555",
        slug: "watercolour-foundation",
        title: "WATERCOLOUR FOUNDATION",
        description: null,
        originalPricePaise: 199000,
        offerPricePaise: 99000,
        originalPrice: 1990,
        offerPrice: 990,
        currency: "INR",
        durationMinutes: 180,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imagePath: "/images/foundation.jpeg",
        details: DEFAULT_FOUNDATION_DETAILS,
      },
      {
        id: "e2222222-2222-3333-4444-555555555555",
        slug: "watercolour-artistry-foundation",
        title: "WATERCOLOUR ARTISTRY + FOUNDATION COURSE",
        description: null,
        originalPricePaise: 1499000,
        offerPricePaise: 999000,
        originalPrice: 14990,
        offerPrice: 9990,
        currency: "INR",
        durationMinutes: 2160,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imagePath: "/images/ARTISTRY.jpeg",
        details: DEFAULT_ARTISTRY_DETAILS,
      },
    ];
  }

  // Ensure deterministic order: Foundation first, Artistry second
  const order = [
    "watercolour-foundation",
    "watercolour-artistry-foundation",
  ];

  const sortedCourses = [...courses].sort(
    (a, b) => order.indexOf(a.slug) - order.indexOf(b.slug)
  );

  return sortedCourses.map((c) => {
    const details = parseCourseDetails(c.slug, c.description);
    const imagePath =
      COURSE_IMAGES[c.slug] || "/images/foundation.jpeg";

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      originalPricePaise: c.original_price_paise,
      offerPricePaise: c.offer_price_paise,
      originalPrice: Math.round(c.original_price_paise / 100),
      offerPrice: Math.round(c.offer_price_paise / 100),
      currency: c.currency,
      durationMinutes: c.duration_minutes,
      isActive: c.is_active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      imagePath,
      details,
    };
  });
}

/**
 * Retrieves a single public course by slug with active cohort batch info.
 */
export async function getPublicCourseBySlug(
  slug: string
): Promise<{
  course: AdminCourseData;
  activeBatch: {
    id: string;
    batchName: string;
    startDate: string;
    startTime: string;
    endTime: string;
    totalSeats: number;
    seatsBooked: number;
    seatsRemaining: number;
    isSoldOut: boolean;
  } | null;
} | null> {
  const adminClient = createAdminClient();

  const { data: course, error } = await adminClient
    .from("courses")
    .select(`
      id,
      slug,
      title,
      description,
      original_price_paise,
      offer_price_paise,
      currency,
      duration_minutes,
      is_active,
      created_at,
      updated_at
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !course) {
    if (
      slug === "watercolour-foundation" ||
      slug === "watercolour-artistry-foundation"
    ) {
      const isFoundation = slug === "watercolour-foundation";
      return {
        course: {
          id: isFoundation
            ? "e1111111-2222-3333-4444-555555555555"
            : "e2222222-2222-3333-4444-555555555555",
          slug,
          title: isFoundation
            ? "WATERCOLOUR FOUNDATION"
            : "WATERCOLOUR ARTISTRY + FOUNDATION COURSE",
          description: null,
          originalPricePaise: isFoundation ? 199000 : 1499000,
          offerPricePaise: isFoundation ? 99000 : 999000,
          originalPrice: isFoundation ? 1990 : 14990,
          offerPrice: isFoundation ? 990 : 9990,
          currency: "INR",
          durationMinutes: isFoundation ? 180 : 2160,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          imagePath: COURSE_IMAGES[slug] || "/images/foundation.jpeg",
          details: isFoundation
            ? DEFAULT_FOUNDATION_DETAILS
            : DEFAULT_ARTISTRY_DETAILS,
        },
        activeBatch: {
          id: isFoundation
            ? "b1111111-2222-3333-4444-555555555555"
            : "b2222222-2222-3333-4444-555555555555",
          batchName: isFoundation
            ? "Watercolour Foundation — Upcoming Live Batch"
            : "Watercolour Artistry — 3-Month Live Journey Batch",
          startDate: isFoundation ? "2026-11-01" : "2026-11-05",
          startTime: "6:30 PM",
          endTime: "8:00 PM",
          totalSeats: isFoundation ? 100 : 50,
          seatsBooked: 0,
          seatsRemaining: isFoundation ? 100 : 50,
          isSoldOut: false,
        },
      };
    }
    return null;
  }

  // Fetch active batch for this course
  const { data: batches } = await adminClient
    .from("cohort_batches")
    .select(
      "id, batch_name, start_date, start_time, end_time, total_seats, seats_booked, is_enrollment_open"
    )
    .eq("course_id", course.id)
    .eq("is_enrollment_open", true)
    .order("start_date", { ascending: true })
    .limit(1);

  const batch = batches && batches.length > 0 ? batches[0] : null;
  const seatsRemaining = batch
    ? Math.max(0, batch.total_seats - batch.seats_booked)
    : 0;

  const details = parseCourseDetails(course.slug, course.description);
  const imagePath =
    COURSE_IMAGES[course.slug] || "/images/foundation.jpeg";

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      originalPricePaise: course.original_price_paise,
      offerPricePaise: course.offer_price_paise,
      originalPrice: Math.round(course.original_price_paise / 100),
      offerPrice: Math.round(course.offer_price_paise / 100),
      currency: course.currency,
      durationMinutes: course.duration_minutes,
      isActive: course.is_active,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      imagePath,
      details,
    },
    activeBatch: batch
      ? {
          id: batch.id,
          batchName: batch.batch_name,
          startDate: batch.start_date,
          startTime: batch.start_time,
          endTime: batch.end_time,
          totalSeats: batch.total_seats,
          seatsBooked: batch.seats_booked,
          seatsRemaining,
          isSoldOut: seatsRemaining <= 0,
        }
      : null,
  };
}
