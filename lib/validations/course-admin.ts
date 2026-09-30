import { z } from "zod";

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
        "Slug must consist of lowercase letters, numbers, and hyphens (e.g. watercolor-masterclass)"
      ),
    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
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
  })
  .refine((data) => data.offerPrice <= data.originalPrice, {
    message: "Offer price cannot exceed the original MRP price",
    path: ["offerPrice"],
  });

export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
