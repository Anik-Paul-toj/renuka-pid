import { z } from "zod";

export const templateCategoryEnum = z.enum(["UTILITY", "MARKETING", "AUTHENTICATION"]);
export type TemplateCategory = z.infer<typeof templateCategoryEnum>;

export const templatePurposeEnum = z.enum([
  "confirmation",
  "upcoming_batches",
  "batch_reminder",
]);
export type TemplatePurpose = z.infer<typeof templatePurposeEnum>;

export const templateStatusEnum = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PAUSED",
  "DISABLED",
  "IN_APPEAL",
  "DELETED",
]);
export type TemplateStatus = z.infer<typeof templateStatusEnum>;

export const variableDefinitionSchema = z.object({
  placeholder: z.string().trim().regex(/^\{\{\d+\}\}$/, "Placeholder must be in format {{1}}, {{2}}, etc."),
  name: z.string().trim().min(1, "Variable name is required"),
  sampleValue: z.string().trim().min(1, "Sample value is required for Meta approval"),
  sourceField: z
    .enum([
      "student_name",
      "course_name",
      "batch_name",
      "batch_date",
      "batch_time",
      "booking_reference",
      "zoom_link",
      "custom",
    ])
    .default("custom"),
});
export type VariableDefinition = z.infer<typeof variableDefinitionSchema>;

export const headerComponentSchema = z.object({
  type: z.literal("HEADER"),
  format: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).default("TEXT"),
  text: z.string().trim().max(60, "Header text must not exceed 60 characters").optional(),
  example: z
    .object({
      header_text: z.array(z.string()).optional(),
    })
    .optional(),
});

export const bodyComponentSchema = z.object({
  type: z.literal("BODY"),
  text: z
    .string()
    .trim()
    .min(1, "Body text is required")
    .max(1024, "Body text must not exceed 1024 characters"),
  example: z
    .object({
      body_text: z.array(z.array(z.string())).optional(),
    })
    .optional(),
});

export const footerComponentSchema = z.object({
  type: z.literal("FOOTER"),
  text: z.string().trim().max(60, "Footer text must not exceed 60 characters"),
});

export const buttonItemSchema = z.object({
  type: z.enum(["QUICK_REPLY", "URL"]),
  text: z.string().trim().min(1, "Button label is required").max(25, "Button label must not exceed 25 characters"),
  url: z.string().trim().url("Valid URL required").optional(),
});

export const buttonsComponentSchema = z.object({
  type: z.literal("BUTTONS"),
  buttons: z.array(buttonItemSchema).max(3, "At most 3 buttons are supported"),
});

export const templateComponentSchema = z.discriminatedUnion("type", [
  headerComponentSchema,
  bodyComponentSchema,
  footerComponentSchema,
  buttonsComponentSchema,
]);
export type TemplateComponent = z.infer<typeof templateComponentSchema>;

export const createWhatsAppTemplateSchema = z.object({
  internalTitle: z
    .string()
    .trim()
    .min(2, "Internal title must be at least 2 characters")
    .max(100, "Internal title must not exceed 100 characters"),
  metaTemplateName: z
    .string()
    .trim()
    .min(2, "Meta template name must be at least 2 characters")
    .max(512, "Meta template name must not exceed 512 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Meta template name must contain only lowercase alphanumeric characters and underscores (no spaces or hyphens)."
    ),
  category: templateCategoryEnum.default("UTILITY"),
  templatePurpose: templatePurposeEnum.default("batch_reminder"),
  assignedCourseId: z.string().uuid("Invalid course identifier").nullable().optional(),
  isDefaultConfirmation: z.boolean().default(false),
  language: z.string().trim().min(2).max(10).default("en_US"),
  components: z.array(templateComponentSchema).min(1, "At least a BODY component is required"),
  variableDefinitions: z.array(variableDefinitionSchema).default([]),
});
export type CreateWhatsAppTemplateInput = z.infer<typeof createWhatsAppTemplateSchema>;

export const updateWhatsAppTemplateSchema = createWhatsAppTemplateSchema.partial();
export type UpdateWhatsAppTemplateInput = z.infer<typeof updateWhatsAppTemplateSchema>;
