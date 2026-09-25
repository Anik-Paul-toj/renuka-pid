import { z } from "zod";

export const studentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional().default(""),
  status: z
    .enum(["all", "confirmed", "pending", "cancelled", "refunded"])
    .optional()
    .default("all"),
  paymentStatus: z
    .enum(["all", "captured", "failed", "created", "refunded"])
    .optional()
    .default("all"),
});

export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
