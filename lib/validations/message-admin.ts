import { z } from "zod";

export const channelEnum = z.enum(["all", "email", "whatsapp"]);
export type ChannelFilter = z.infer<typeof channelEnum>;

export const statusFilterEnum = z.enum(["all", "active", "inactive"]);
export type StatusFilter = z.infer<typeof statusFilterEnum>;

export const adminMessagesQuerySchema = z.object({
  search: z.string().optional().default(""),
  channel: channelEnum.default("all"),
  status: statusFilterEnum.default("all"),
});

export type AdminMessagesQuery = z.infer<typeof adminMessagesQuerySchema>;

export const updateMessageTemplateSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(120, "Name must be under 120 characters").optional(),
    subject: z.string().max(255, "Subject must be under 255 characters").nullable().optional(),
    body: z.string().min(1, "Template body cannot be empty").max(10000, "Template body must be under 10000 characters"),
    is_active: z.boolean().optional(),
  });

export type UpdateMessageTemplateInput = z.infer<typeof updateMessageTemplateSchema>;
