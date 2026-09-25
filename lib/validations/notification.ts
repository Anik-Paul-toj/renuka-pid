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

export const notificationStatusEnum = z.enum([
  "all",
  "sent",
  "delivered",
  "read",
  "failed",
]);

export type NotificationStatusFilter = z.infer<typeof notificationStatusEnum>;

export const notificationChannelEnum = z.enum(["all", "email", "whatsapp"]);
export type NotificationChannelFilter = z.infer<typeof notificationChannelEnum>;

export const notificationQuerySchema = z.object({
  search: z.string().optional().default(""),
  status: notificationStatusEnum.default("all"),
  channel: notificationChannelEnum.default("all"),
  type: z.string().optional().default("all"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
