import { z } from "zod";

export const batchStatusEnum = z.enum(["open", "closed", "upcoming", "completed"]);
export type BatchStatus = z.infer<typeof batchStatusEnum>;

export const batchScheduleSchema = z
  .object({
    batchName: z
      .string()
      .trim()
      .min(2, "Batch name must be at least 2 characters long.")
      .max(120, "Batch name must be at most 120 characters."),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format.")
      .optional()
      .nullable(),
    lastRegistrationDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Last registration date must be in YYYY-MM-DD format."),
    startTime: z
      .string()
      .trim()
      .min(1, "Batch start time is required.")
      .max(50, "Batch start time must be at most 50 characters."),
    endTime: z
      .string()
      .trim()
      .max(50, "Batch end time must be at most 50 characters.")
      .optional()
      .nullable(),
    status: batchStatusEnum.default("open"),
    totalSeats: z
      .number()
      .int()
      .positive("Total seats must be greater than 0.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Constraint: The registration deadline must not be earlier than the batch start date.
    if (data.lastRegistrationDate && data.startDate) {
      if (data.lastRegistrationDate < data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lastRegistrationDate"],
          message: "The registration deadline must not be earlier than the batch start date.",
        });
      }
    }

    if (data.endDate && data.startDate) {
      if (data.endDate < data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "Batch end date cannot be earlier than batch start date.",
        });
      }
    }
  });

export type BatchScheduleInput = z.infer<typeof batchScheduleSchema>;
