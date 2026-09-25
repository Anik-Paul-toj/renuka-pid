import { z } from "zod";

export const paymentStatusEnum = z.enum([
  "all",
  "created",
  "authorized",
  "captured",
  "failed",
  "refunded",
]);

export type PaymentStatusFilter = z.infer<typeof paymentStatusEnum>;

export const adminPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().default(""),
  status: paymentStatusEnum.default("all"),
  courseId: z.string().optional().default("all"),
  batchId: z.string().optional().default("all"),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),
});

export type AdminPaymentsQuery = z.infer<typeof adminPaymentsQuerySchema>;
