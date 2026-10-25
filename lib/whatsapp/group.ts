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
