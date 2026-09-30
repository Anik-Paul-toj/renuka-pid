import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourseUpdateInput } from "@/lib/validations/course-admin";

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
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAdminCourses error:", error);
    throw new Error(`Failed to retrieve courses: ${error.message}`);
  }

  if (!courses || courses.length === 0) {
    // If no course exists in the database, seed the primary baseline course
    const { data: newCourse, error: insertError } = await adminClient
      .from("courses")
      .insert({
        id: "11111111-1111-1111-1111-111111111111",
        slug: "the-watercolour-roadmap",
        title: "The WATERCOLOUR Roadmap: One-Day Masterclass",
        description:
          "Begin your creative journey with mindful, step-by-step watercolour courses designed for adults 25+ — no prior experience needed.",
        original_price_paise: 59900,
        offer_price_paise: 19900,
        currency: "INR",
        duration_minutes: 120,
        is_active: true,
      })
      .select()
      .single();

    if (insertError || !newCourse) {
      console.error("Failed to seed fallback course:", insertError);
      return [];
    }

    return [
      {
        id: newCourse.id,
        slug: newCourse.slug,
        title: newCourse.title,
        description: newCourse.description,
        originalPricePaise: newCourse.original_price_paise,
        offerPricePaise: newCourse.offer_price_paise,
        originalPrice: Math.round(newCourse.original_price_paise / 100),
        offerPrice: Math.round(newCourse.offer_price_paise / 100),
        currency: newCourse.currency,
        durationMinutes: newCourse.duration_minutes,
        isActive: newCourse.is_active,
        createdAt: newCourse.created_at,
        updatedAt: newCourse.updated_at,
        batchesCount: 0,
      },
    ];
  }

  return courses.map((c: any) => {
    const batchesCount = Array.isArray(c.cohort_batches)
      ? c.cohort_batches[0]?.count || 0
      : 0;

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
    };
  });
}

/**
 * Retrieves a single course by its ID.
 */
export async function getAdminCourseById(id: string): Promise<AdminCourseData | null> {
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
  };
}

/**
 * Updates a course authoritatively in Supabase.
 * Automatically converts Rupees to integer paise before persisting.
 * Future bookings and Razorpay orders will immediately use the updated offer_price_paise.
 */
export async function updateAdminCourse(
  id: string,
  input: CourseUpdateInput,
  updatedByEmail: string
): Promise<AdminCourseData> {
  const adminClient = createAdminClient();

  // Convert normal INR Rupees to integer paise
  const originalPricePaise = Math.round(input.originalPrice * 100);
  const offerPricePaise = Math.round(input.offerPrice * 100);

  const nowIso = new Date().toISOString();

  const { data: updated, error } = await adminClient
    .from("courses")
    .update({
      title: input.title,
      slug: input.slug,
      description: input.description,
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
    throw new Error(`Failed to update course: ${error?.message || "Unknown error"}`);
  }

  // Invalidate public and admin caches so changes propagate immediately
  try {
    revalidatePath("/");
    revalidatePath("/admin/courses");
    revalidatePath("/api/cohort-batches/active");
  } catch (revalErr) {
    console.warn("Path revalidation warning:", revalErr);
  }

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
  };
}
