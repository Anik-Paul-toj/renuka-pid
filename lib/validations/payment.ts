import { z } from "zod";

export const createPaymentOrderSchema = z.object({
  bookingReference: z
    .string()
    .trim()
    .min(3, "Booking reference is required")
    .max(100, "Booking reference is invalid"),
});

export const verifyPaymentSchema = z.object({
  bookingReference: z
    .string()
    .trim()
    .min(3, "Booking reference is required"),
  razorpayOrderId: z
    .string()
    .trim()
    .min(5, "Razorpay order ID is required"),
  razorpayPaymentId: z
    .string()
    .trim()
    .min(5, "Razorpay payment ID is required"),
  razorpaySignature: z
    .string()
    .trim()
    .min(10, "Razorpay signature is required"),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
