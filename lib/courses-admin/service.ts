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
  coverImagePublicId?: string | null;
  details: CourseContentDetails;
  activeBatch?: any | null;
}

import {
  parseCourseDetails,
  COURSE_IMAGES,
  DEFAULT_FOUNDATION_DETAILS,
  DEFAULT_ARTISTRY_DETAILS,
  DEFAULT_WORKSHOP_DETAILS,
} from "./details";
export * from "./details";
import { getBatchByCourseId, SafeBatchScheduleData } from "@/lib/batches-admin/service";

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
    const coverImage = (c as any).cover_image_url || details.coverImage;
    const coverImagePublicId =
      (c as any).cover_image_public_id || details.coverImagePublicId || null;
    const isWorkshop = c.slug === "the-watercolour" || c.slug === "the-watercolour-roadmap";
    const imagePath =
      coverImage ||
      COURSE_IMAGES[c.slug] ||
      (isWorkshop ? "" : "/images/foundation.jpeg");

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
  const coverImage = (c as any).cover_image_url || details.coverImage;
  const coverImagePublicId =
    (c as any).cover_image_public_id || details.coverImagePublicId || null;
  const isWorkshop = c.slug === "the-watercolour" || c.slug === "the-watercolour-roadmap";
  const imagePath =
    coverImage ||
    COURSE_IMAGES[c.slug] ||
    (isWorkshop ? "" : "/images/foundation.jpeg");

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
  const coverImage = (updated as any).cover_image_url || details.coverImage;
  const coverImagePublicId =
    (updated as any).cover_image_public_id || details.coverImagePublicId || null;
  const imagePath =
    coverImage || COURSE_IMAGES[updated.slug] || "/images/foundation.jpeg";

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
 * Retrieves the courses for the public /course catalog:
 * 1. The WATERCOLOUR Roadmap: One-Day Masterclass
 * 2. WATERCOLOUR FOUNDATION
 * 3. WATERCOLOUR ARTISTRY + FOUNDATION COURSE
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
      "the-watercolour",
      "the-watercolour-roadmap",
      "watercolour-foundation",
      "watercolour-artistry-foundation",
    ])
    .eq("is_active", true);

  if (error || !courses || courses.length === 0) {
    // Return baseline mock objects if DB query fails
    return [
      {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "the-watercolour",
        title: "The WATERCOLOUR Roadmap: From “I Can’t Paint” to “I Painted This Myself”",
        description: null,
        originalPricePaise: 59900,
        offerPricePaise: 9900,
        originalPrice: 599,
        offerPrice: 99,
        currency: "INR",
        durationMinutes: 120,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imagePath: "",
        details: DEFAULT_WORKSHOP_DETAILS,
      },
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

  // Ensure deterministic order: 1. Masterclass, 2. Foundation, 3. Artistry
  const order = [
    "the-watercolour",
    "the-watercolour-roadmap",
    "watercolour-foundation",
    "watercolour-artistry-foundation",
  ];

  // If both "the-watercolour" and "the-watercolour-roadmap" exist, deduplicate to only keep one
  const dedupedCourses = courses.filter((c, idx, arr) => {
    if (c.slug === "the-watercolour-roadmap") {
      return !arr.some((other) => other.slug === "the-watercolour");
    }
    return true;
  });

  const sortedCourses = [...dedupedCourses].sort(
    (a, b) => order.indexOf(a.slug) - order.indexOf(b.slug)
  );

  const coursesWithBatches = await Promise.all(
    sortedCourses.map(async (c) => {
      const details = parseCourseDetails(c.slug, c.description);
      const isWorkshop =
        c.slug === "the-watercolour" || c.slug === "the-watercolour-roadmap";
      const coverImage = (c as any).cover_image_url || details.coverImage;
      const coverImagePublicId =
        (c as any).cover_image_public_id || details.coverImagePublicId || null;
      const imagePath =
        coverImage ||
        COURSE_IMAGES[c.slug] ||
        (isWorkshop ? "" : "/images/foundation.jpeg");
      const activeBatch = await getBatchByCourseId(c.id);

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
        activeBatch,
      };
    })
  );

  return coursesWithBatches;
}

/**
 * Retrieves a single public course by slug with active cohort batch info.
 */
export async function getPublicCourseBySlug(
  slug: string
): Promise<{
  course: AdminCourseData;
  activeBatch: SafeBatchScheduleData | null;
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
      slug === "the-watercolour" ||
      slug === "the-watercolour-roadmap"
    ) {
      const activeBatch: SafeBatchScheduleData = {
        id: "22222222-2222-2222-2222-222222222222",
        courseId: "11111111-1111-1111-1111-111111111111",
        batchName: "Live Masterclass — 28 Oct 2026",
        startDate: "2026-10-28",
        endDate: "2026-10-28",
        lastRegistrationDate: "2026-10-28",
        startTime: "6:30 PM",
        endTime: "8:30 PM",
        timezone: "Asia/Kolkata",
        totalSeats: 200,
        seatsBooked: 1,
        seatsRemaining: 199,
        isEnrollmentOpen: true,
        status: "open",
        isExpired: false,
        isSoldOut: false,
        formattedStartDate: "28 Oct 2026",
        formattedLastRegistrationDate: "28 Oct 2026",
        formattedTiming: "6:30 PM – 8:30 PM IST",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        course: {
          id: "11111111-1111-1111-1111-111111111111",
          slug,
          title:
            "The WATERCOLOUR Roadmap: From “I Can’t Paint” to “I Painted This Myself”",
          description: null,
          originalPricePaise: 59900,
          offerPricePaise: 9900,
          originalPrice: 599,
          offerPrice: 99,
          currency: "INR",
          durationMinutes: 120,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          imagePath: "",
          details: DEFAULT_WORKSHOP_DETAILS,
          activeBatch,
        },
        activeBatch,
      };
    }

    if (
      slug === "watercolour-foundation" ||
      slug === "watercolour-artistry-foundation"
    ) {
      const isFoundation = slug === "watercolour-foundation";
      const activeBatch: SafeBatchScheduleData = {
        id: isFoundation
          ? "b1111111-2222-3333-4444-555555555555"
          : "b2222222-2222-3333-4444-555555555555",
        courseId: isFoundation
          ? "e1111111-2222-3333-4444-555555555555"
          : "e2222222-2222-3333-4444-555555555555",
        batchName: isFoundation
          ? "Watercolour Foundation — Upcoming Live Batch"
          : "Watercolour Artistry — 3-Month Live Journey Batch",
        startDate: isFoundation ? "2026-11-01" : "2026-11-05",
        endDate: isFoundation ? "2026-11-02" : "2027-02-05",
        lastRegistrationDate: isFoundation ? "2026-11-01" : "2026-11-05",
        startTime: "6:30 PM",
        endTime: "8:00 PM",
        timezone: "Asia/Kolkata",
        totalSeats: isFoundation ? 100 : 50,
        seatsBooked: 0,
        seatsRemaining: isFoundation ? 100 : 50,
        isEnrollmentOpen: true,
        status: "open",
        isExpired: false,
        isSoldOut: false,
        formattedStartDate: isFoundation ? "01 Nov 2026" : "05 Nov 2026",
        formattedLastRegistrationDate: isFoundation ? "01 Nov 2026" : "05 Nov 2026",
        formattedTiming: "6:30 PM – 8:00 PM IST",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

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
          activeBatch,
        },
        activeBatch,
      };
    }
    return null;
  }

  // Fetch dynamic batch schedule for this course
  const activeBatch = await getBatchByCourseId(course.id);
  const details = parseCourseDetails(course.slug, course.description);
  const coverImage = (course as any).cover_image_url || details.coverImage;
  const coverImagePublicId =
    (course as any).cover_image_public_id || details.coverImagePublicId || null;
  const isWorkshop =
    course.slug === "the-watercolour" ||
    course.slug === "the-watercolour-roadmap";
  const imagePath =
    coverImage ||
    COURSE_IMAGES[course.slug] ||
    (isWorkshop ? "" : "/images/foundation.jpeg");

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
      activeBatch,
    },
    activeBatch,
  };
}

/**
 * Updates a course and its cohort batch cover image via Cloudinary.
 * Resilient to database column state: saves to columns if present,
 * and maintains JSON synchronization in courses.description.
 */
export async function updateCourseCoverImage(
  courseIdOrSlug: string,
  coverImageUrl: string,
  coverImagePublicId: string
): Promise<{ success: boolean; coverImageUrl: string; coverImagePublicId: string }> {
  const adminClient = createAdminClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    courseIdOrSlug
  );

  let query = adminClient.from("courses").select("id, slug, description");
  if (isUuid) {
    query = query.eq("id", courseIdOrSlug);
  } else {
    query = query.eq("slug", courseIdOrSlug);
  }

  const { data: course, error: fetchErr } = await query.single();
  if (fetchErr || !course) {
    throw new Error(`Course not found for identifier: ${courseIdOrSlug}`);
  }

  const currentDetails = parseCourseDetails(course.slug, course.description);
  const updatedDetails = {
    ...currentDetails,
    coverImage: coverImageUrl,
    coverImagePublicId,
  };
  const updatedDescriptionJson = JSON.stringify(updatedDetails);

  // 1. Resilient update on courses: try column update with fallback to description JSON
  try {
    const { error: colErr } = await adminClient
      .from("courses")
      .update({
        cover_image_url: coverImageUrl,
        cover_image_public_id: coverImagePublicId,
        description: updatedDescriptionJson,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", course.id);

    if (colErr) {
      console.warn("cover_image_url column update failed, saving to description JSON:", colErr.message);
      await adminClient
        .from("courses")
        .update({
          description: updatedDescriptionJson,
          updated_at: new Date().toISOString(),
        })
        .eq("id", course.id);
    }
  } catch (err: any) {
    console.warn("Falling back to description JSON update:", err?.message);
    await adminClient
      .from("courses")
      .update({
        description: updatedDescriptionJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id);
  }

  // 2. Also update cohort_batches for this course
  try {
    await adminClient
      .from("cohort_batches")
      .update({
        cover_image_url: coverImageUrl,
        cover_image_public_id: coverImagePublicId,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("course_id", course.id);
  } catch {}

  // 3. Invalidate caches for immediate public propagation
  try {
    revalidatePath("/");
    revalidatePath("/course");
    revalidatePath(`/course/${course.slug}`);
    revalidatePath("/course/watercolour-foundation");
    revalidatePath("/course/watercolour-artistry-foundation");
    revalidatePath("/admin/batches");
    revalidatePath("/admin/courses");
    revalidatePath("/api/cohort-batches/active");
    revalidatePath("/api/admin/batches");
  } catch (revalErr) {
    console.warn("Revalidation warning:", revalErr);
  }

  return {
    success: true,
    coverImageUrl,
    coverImagePublicId,
  };
}

/**
 * Resets a course cover image back to the default studio artwork.
 */
export async function resetCourseCoverImage(
  courseIdOrSlug: string
): Promise<{ success: boolean; coverImageUrl: string }> {
  const adminClient = createAdminClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    courseIdOrSlug
  );

  let query = adminClient.from("courses").select("id, slug, description");
  if (isUuid) {
    query = query.eq("id", courseIdOrSlug);
  } else {
    query = query.eq("slug", courseIdOrSlug);
  }

  const { data: course, error: fetchErr } = await query.single();
  if (fetchErr || !course) {
    throw new Error(`Course not found for identifier: ${courseIdOrSlug}`);
  }

  const currentDetails = parseCourseDetails(course.slug, course.description);
  const { coverImage, coverImagePublicId, ...restDetails } = currentDetails as any;
  const updatedDescriptionJson = JSON.stringify(restDetails);

  try {
    await adminClient
      .from("courses")
      .update({
        cover_image_url: null,
        cover_image_public_id: null,
        description: updatedDescriptionJson,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", course.id);
  } catch {
    await adminClient
      .from("courses")
      .update({
        description: updatedDescriptionJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id);
  }

  try {
    await adminClient
      .from("cohort_batches")
      .update({
        cover_image_url: null,
        cover_image_public_id: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("course_id", course.id);
  } catch {}

  const isWorkshop =
    course.slug === "the-watercolour" ||
    course.slug === "the-watercolour-roadmap";
  const defaultImage =
    COURSE_IMAGES[course.slug] || (isWorkshop ? "" : "/images/foundation.jpeg");

  try {
    revalidatePath("/");
    revalidatePath("/course");
    revalidatePath(`/course/${course.slug}`);
    revalidatePath("/course/watercolour-foundation");
    revalidatePath("/course/watercolour-artistry-foundation");
    revalidatePath("/admin/batches");
    revalidatePath("/admin/courses");
    revalidatePath("/api/cohort-batches/active");
    revalidatePath("/api/admin/batches");
  } catch (revalErr) {
    console.warn("Revalidation warning:", revalErr);
  }

  return {
    success: true,
    coverImageUrl: defaultImage,
  };
}
