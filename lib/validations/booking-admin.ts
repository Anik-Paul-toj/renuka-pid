import { z } from "zod";

export const adminBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional().default(""),
  status: z
    .enum(["all", "pending", "confirmed", "cancelled", "refunded"])
    .optional()
    .default("all"),
  paymentStatus: z
    .enum(["all", "created", "authorized", "captured", "failed", "refunded"])
    .optional()
    .default("all"),
  batchId: z.string().trim().optional().default("all"),
});

export type AdminBookingsQuery = z.infer<typeof adminBookingsQuerySchema>;

export const cancelBookingActionSchema = z.object({
  reason: z.string().trim().max(200).optional().default("cancelled"),
});

export type CancelBookingActionInput = z.infer<typeof cancelBookingActionSchema>;
