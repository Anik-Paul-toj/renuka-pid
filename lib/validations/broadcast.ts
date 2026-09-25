import { z } from "zod";

export const audienceTypeEnum = z.enum([
  "all",
  "course",
  "batch",
  "confirmed",
]);

export type AudienceType = z.infer<typeof audienceTypeEnum>;

export const targetFilterSchema = z.object({
  audience: audienceTypeEnum.default("all"),
  courseId: z.string().uuid("Invalid course identifier").nullable().optional(),
  courseName: z.string().nullable().optional(),
  batchId: z.string().uuid("Invalid batch identifier").nullable().optional(),
  batchName: z.string().nullable().optional(),
  subject: z.string().min(1, "Subject is required").max(255, "Subject must be under 255 characters"),
  date: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  joinLink: z.string().nullable().optional(),
  confirmedOnly: z.boolean().nullable().optional(),
});

export type TargetFilterInput = z.infer<typeof targetFilterSchema>;

export const createBroadcastSchema = z.object({
  title: z
    .string()
    .min(1, "Broadcast name is required")
    .max(120, "Broadcast name must be under 120 characters"),
  channel: z.enum(["email", "whatsapp", "both"]).default("email"),
  targetFilter: targetFilterSchema,
  content: z
    .string()
    .min(1, "Message content is required")
    .max(10000, "Message content must be under 10000 characters"),
});

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;

export const updateBroadcastSchema = z.object({
  title: z
    .string()
    .min(1, "Broadcast name is required")
    .max(120, "Broadcast name must be under 120 characters")
    .optional(),
  channel: z.enum(["email", "whatsapp", "both"]).optional(),
  targetFilter: targetFilterSchema.optional(),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(10000, "Message content must be under 10000 characters")
    .optional(),
});

export type UpdateBroadcastInput = z.infer<typeof updateBroadcastSchema>;

export const broadcastQuerySchema = z.object({
  search: z.string().optional().default(""),
  status: z.enum(["all", "draft", "pending", "processing", "completed", "failed"]).default("all"),
  channel: z.enum(["all", "email", "whatsapp", "both"]).default("all"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type BroadcastQuery = z.infer<typeof broadcastQuerySchema>;
