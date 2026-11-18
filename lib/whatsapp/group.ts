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
 * ONLY 'Watercolour Artistry + Foundation' is eligible.
 * Masterclass and Watercolour Foundation are strictly NOT eligible.
 */
export const WHATSAPP_ELIGIBLE_COURSE_SLUGS = [
  "watercolour-artistry-foundation",
] as const;

/**
 * Explicit list of course IDs eligible for the WhatsApp group invitation.
 * ONLY Watercolour Artistry + Foundation ID is eligible.
 */
export const WHATSAPP_ELIGIBLE_COURSE_IDS = [
  "e2222222-2222-3333-4444-555555555555", // Watercolour Artistry + Foundation
] as const;

/**
 * Slugs and ID for Watercolour Foundation (which is explicitly NOT eligible for WhatsApp group).
 */
export const FOUNDATION_COURSE_SLUGS = [
  "watercolour-foundation",
] as const;

export const FOUNDATION_COURSE_ID = "e1111111-2222-3333-4444-555555555555";

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
 * 1. Watercolour Artistry + Foundation (slug: "watercolour-artistry-foundation")
 * 
 * Returns false for:
 * - The WATERCOLOUR Roadmap masterclass
 * - Watercolour Foundation (Foundation students receive email confirmation & voucher, not group link)
 * - Any unverified or unmatched course.
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

  // If identified as Watercolour Foundation, explicitly return false
  if (
    (normalizedId && normalizedId === FOUNDATION_COURSE_ID) ||
    (normalizedSlug && FOUNDATION_COURSE_SLUGS.includes(normalizedSlug as any))
  ) {
    return false;
  }

  // Check if matches eligible slug (Watercolour Artistry + Foundation)
  if (
    normalizedSlug &&
    WHATSAPP_ELIGIBLE_COURSE_SLUGS.includes(normalizedSlug as any)
  ) {
    return true;
  }

  // Check if matches eligible ID (Watercolour Artistry + Foundation)
  if (
    normalizedId &&
    WHATSAPP_ELIGIBLE_COURSE_IDS.includes(normalizedId as any)
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves the appropriate WhatsApp group invitation link for an eligible booking or course.
 * If the course is not eligible (Masterclass or Foundation), returns an empty string to prevent leakage.
 */
export function resolveWhatsAppGroupUrl(
  options?: WhatsAppGroupResolveOptions
): string {
  if (
    options?.courseSlug &&
    !isWhatsAppGroupEligibleCourse({ courseSlug: options.courseSlug })
  ) {
    return "";
  }

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
