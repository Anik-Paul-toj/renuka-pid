import { z } from "zod";

const uuidPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const courseCreditRuleSchema = z.object({
  sourceCourseId: z.string().regex(uuidPattern, "Invalid source course ID"),
  targetCourseId: z.string().regex(uuidPattern, "Invalid target course ID"),
  creditAmountPaise: z
    .number()
    .int("Credit amount must be an integer in paise")
    .positive("Credit amount must be greater than zero"),
  isActive: z.boolean().default(true),
  description: z.string().max(255).optional().nullable(),
});

export const updateCreditRuleSchema = z.object({
  creditAmountPaise: z
    .number()
    .int("Credit amount must be an integer in paise")
    .positive("Credit amount must be greater than zero")
    .optional(),
  creditAmountRupees: z
    .number()
    .int("Credit amount must be an integer in rupees")
    .positive("Credit amount must be greater than zero")
    .optional(),
  isActive: z.boolean().optional(),
  description: z.string().max(255).optional().nullable(),
});

export const checkCreditEligibilitySchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Please provide a valid phone number")
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^[0-9+\s\-().]*$/, "Phone number contains invalid characters"),
  sourceBookingReference: z
    .string()
    .trim()
    .min(3, "Please provide your Foundation booking reference (e.g. REF-...)")
    .max(50, "Booking reference is too long"),
  targetBatchId: z.string().regex(uuidPattern, "Invalid batch ID").optional(),
  targetCourseId: z.string().regex(uuidPattern, "Invalid course ID").optional(),
});

export type CourseCreditRuleInput = z.infer<typeof courseCreditRuleSchema>;
export type UpdateCreditRuleInput = z.infer<typeof updateCreditRuleSchema>;
export type CheckCreditEligibilityInput = z.infer<typeof checkCreditEligibilitySchema>;
