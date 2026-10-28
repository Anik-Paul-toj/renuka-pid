/**
 * WhatsApp Group Invitation Service & Configuration.
 * 
 * Provides approved WhatsApp group links for enrolled students.
 * Respects course-specific and batch-specific WhatsApp group links if configured,
 * safely defaulting to the studio's approved group link.
 */

export const APPROVED_DEFAULT_WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/GoSIrqZ12A46AS7zcj1zSv";

export interface WhatsAppGroupResolveOptions {
  courseSlug?: string | null;
  batchMetadata?: {
    whatsapp_group_url?: string;
    whatsappGroupUrl?: string;
  } | null;
  courseDetails?: {
    whatsapp_group_url?: string;
    whatsappGroupUrl?: string;
  } | null;
}

/**
 * Explicit list of course slugs eligible to display the WhatsApp group invitation.
 * Only 'Watercolour Foundation' and 'Watercolour Artistry + Foundation' are eligible.
 */
export const WHATSAPP_ELIGIBLE_COURSE_SLUGS = [
  "watercolour-foundation",
  "watercolour-artistry-foundation",
] as const;

/**
 * Explicit list of course IDs eligible for the WhatsApp group invitation.
 */
export const WHATSAPP_ELIGIBLE_COURSE_IDS = [
  "e1111111-2222-3333-4444-555555555555", // Watercolour Foundation
  "e2222222-2222-3333-4444-555555555555", // Watercolour Artistry + Foundation
] as const;

/**
 * Slugs and ID for The WATERCOLOUR Roadmap masterclass (which is explicitly NOT eligible).
 */
export const ROADMAP_MASTERCLASS_SLUGS = [
  "the-watercolour",
  "the-watercolour-roadmap",
  "the-watercolour-roadmap-one-day-masterclass",
] as const;

export const ROADMAP_MASTERCLASS_ID = "11111111-1111-1111-1111-111111111111";

export interface CourseEligibilityParams {
  courseSlug?: string | null;
  courseId?: string | null;
}

/**
 * Determines whether a course is eligible to display the WhatsApp group invitation.
 * Uses stable course ID and slug (not display title or fragile text comparison).
 * 
 * Returns true ONLY for:
 * 1. Watercolour Foundation (slug: "watercolour-foundation")
 * 2. Watercolour Artistry + Foundation (slug: "watercolour-artistry-foundation")
 * 
 * Returns false for The WATERCOLOUR Roadmap masterclass and any unverified/unmatched course.
 */
export function isWhatsAppGroupEligibleCourse(
  params?: CourseEligibilityParams | null
): boolean {
  if (!params) return false;

  const normalizedSlug = params.courseSlug?.trim().toLowerCase();
  const normalizedId = params.courseId?.trim().toLowerCase();

  // If identified as Roadmap masterclass, explicitly return false
  if (
    (normalizedId && normalizedId === ROADMAP_MASTERCLASS_ID) ||
    (normalizedSlug && ROADMAP_MASTERCLASS_SLUGS.includes(normalizedSlug as any))
  ) {
    return false;
  }

  // Check if matches eligible slug
  if (
    normalizedSlug &&
    WHATSAPP_ELIGIBLE_COURSE_SLUGS.includes(normalizedSlug as any)
  ) {
    return true;
  }

  // Check if matches eligible ID
  if (
    normalizedId &&
    WHATSAPP_ELIGIBLE_COURSE_IDS.includes(normalizedId as any)
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves the appropriate WhatsApp group invitation link for a booking or course.
 */
export function resolveWhatsAppGroupUrl(
  options?: WhatsAppGroupResolveOptions
): string {
  if (options?.batchMetadata?.whatsappGroupUrl?.trim()) {
    return options.batchMetadata.whatsappGroupUrl.trim();
  }
  if (options?.batchMetadata?.whatsapp_group_url?.trim()) {
    return options.batchMetadata.whatsapp_group_url.trim();
  }
  if (options?.courseDetails?.whatsappGroupUrl?.trim()) {
    return options.courseDetails.whatsappGroupUrl.trim();
  }
  if (options?.courseDetails?.whatsapp_group_url?.trim()) {
    return options.courseDetails.whatsapp_group_url.trim();
  }

  return APPROVED_DEFAULT_WHATSAPP_GROUP_URL;
}
