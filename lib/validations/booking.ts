import { z } from "zod";

export const createBookingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(255, "Email address must not exceed 255 characters")
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^[0-9+\s\-().]*$/, "Phone number contains invalid characters")
    .optional()
    .or(z.literal("")),
  batchId: z
    .string()
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      "Invalid batch ID format"
    ),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
