import { z } from "zod";

export const retryNotificationSchema = z.object({
  bookingReference: z
    .string()
    .trim()
    .min(3, "Booking reference is required")
    .max(64, "Booking reference is too long"),
  channel: z.enum(["email", "whatsapp"]).default("email"),
  forceRetry: z.boolean().optional().default(false),
});

export type RetryNotificationInput = z.infer<typeof retryNotificationSchema>;
