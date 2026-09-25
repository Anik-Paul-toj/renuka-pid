import { z } from "zod";

/**
 * Validation schema for admin/studio settings.
 * Only validates safe, configurable application settings.
 * Never handles secrets, API keys, or private database parameters.
 */
export const settingsSchema = z.object({
  studioName: z
    .string()
    .trim()
    .min(1, "Studio name is required")
    .max(100, "Studio name cannot exceed 100 characters"),
  instructorName: z
    .string()
    .trim()
    .min(1, "Instructor name is required")
    .max(100, "Instructor name cannot exceed 100 characters"),
  websiteUrl: z
    .string()
    .trim()
    .url("Website must be a valid URL (e.g., https://artandsoulstudio.com)")
    .or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .email("Contact email must be a valid email address"),
  contactPhone: z
    .string()
    .trim()
    .max(30, "Phone number cannot exceed 30 characters")
    .optional()
    .default(""),
  supportWhatsapp: z
    .string()
    .trim()
    .max(30, "WhatsApp contact cannot exceed 30 characters")
    .optional()
    .default(""),
  defaultSenderName: z
    .string()
    .trim()
    .min(1, "Default sender name is required")
    .max(100, "Sender name cannot exceed 100 characters"),
  replyToEmail: z
    .string()
    .trim()
    .email("Reply-to email must be a valid email address"),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
