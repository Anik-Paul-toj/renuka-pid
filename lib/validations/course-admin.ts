import { z } from "zod";

export const courseScheduleItemSchema = z.object({
  label: z.string().trim().min(1, "Label cannot be empty"),
  detail: z.string().trim(),
});

export type CourseScheduleItem = z.infer<typeof courseScheduleItemSchema>;

export const courseDetailsSchema = z.object({
  // 2. Listing Card Content
  cardSubtitle: z.string().trim().optional(),
  cardSummary: z.string().trim().optional(),
  cardDescription: z.string().trim().optional(),
  subjects: z.string().trim().optional(),
  cardPriceLabel: z.string().trim().optional(),

  // 4. Duration & Session Information
  sessionCountText: z.string().trim().optional(),
  sessionDurationText: z.string().trim().optional(),
  durationMonthsText: z.string().trim().optional(),

  // 5. Course Description
  fullDescription: z.string().trim().optional(),

  // 6. Learning Outcomes
  learningOutcomesHeading: z.string().trim().optional(),
  learningOutcomesSubheading: z.string().trim().optional(),
  learningOutcomes: z.array(z.string().trim()).default([]),

  // 7. Schedule
  scheduleHeading: z.string().trim().optional(),
  scheduleItems: z.array(courseScheduleItemSchema).default([]),
  scheduleNote: z.string().trim().optional(),

  // 8. Additional Content & CTA
  whyHeading: z.string().trim().optional(),
  whyDescription: z.string().trim().optional(),
  whyCallout: z.string().trim().optional(),
  ctaText: z.string().trim().optional(),
});

export type CourseContentDetails = z.infer<typeof courseDetailsSchema>;

export const courseUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Course title must be at least 3 characters")
      .max(200, "Course title cannot exceed 200 characters"),
    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .max(100, "Slug cannot exceed 100 characters")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must consist of lowercase letters, numbers, and hyphens (e.g. watercolour-foundation)"
      ),
    description: z
      .string()
      .trim()
      .max(50000, "Description cannot exceed 50000 characters")
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    originalPrice: z
      .number({ message: "Original price must be a valid number" })
      .int("Original price must be a whole number of Rupees")
      .positive("Original price must be greater than 0"),
    offerPrice: z
      .number({ message: "Offer price must be a valid number" })
      .int("Offer price must be a whole number of Rupees")
      .positive("Offer price must be greater than 0"),
    currency: z.literal("INR"),
    durationMinutes: z
      .number({ message: "Duration must be a valid number" })
      .int("Duration must be a whole number of minutes")
      .positive("Duration must be greater than 0"),
    isActive: z.boolean(),
    details: courseDetailsSchema.optional(),
  })
  .refine((data) => data.offerPrice <= data.originalPrice, {
    message: "Offer price cannot exceed the original MRP price",
    path: ["offerPrice"],
  });

export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
