import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmationEmail } from "@/lib/notifications/service";
import crypto from "crypto";

export interface PaymentServiceError {
  code:
    | "INVALID_INPUT"
    | "BOOKING_NOT_FOUND"
    | "BOOKING_EXPIRED"
    | "ALREADY_PAID"
    | "RAZORPAY_API_ERROR"
    | "INVALID_PAYMENT_SIGNATURE"
    | "ORDER_MISMATCH"
    | "PAYMENT_NOT_CAPTURED"
    | "INTERNAL_ERROR";
  message: string;
  statusCode: number;
}

export type PaymentServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: PaymentServiceError };

function getRazorpayConfig() {
  const keyId =
    process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing Razorpay credentials: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured."
    );
  }

  return { keyId, keySecret, webhookSecret };
}

/**
 * Creates or retrieves an existing Razorpay order for a pending booking.
 * If the booking amount is 0, auto-confirms the booking immediately.
 */
export async function createOrderForBooking(
  bookingReference: string
): Promise<
  PaymentServiceResult<{
    orderId?: string;
    amountPaise: number;
    currency: string;
    keyId: string;
    autoConfirmed?: boolean;
    bookingStatus: "pending" | "confirmed";
    courseTitle: string;
    customer: {
      fullName: string;
      email: string;
      phone?: string | null;
    };
  }>
> {
  const adminClient = createAdminClient();
  const { keyId, keySecret } = getRazorpayConfig();

  // 1. Authoritative Booking Lookup
  const { data: booking, error: bookingErr } = await adminClient
    .from("bookings")
    .select(
      `
      id,
      booking_reference,
      status,
      amount_paise,
      currency,
      expires_at,
      seat_released,
      cohort_batches (
        batch_name,
        courses (
          title
        )
      ),
      customers (
        full_name,
        email,
        phone,
        whatsapp_phone
      )
    `
    )
    .eq("booking_reference", bookingReference)
    .maybeSingle();

  if (bookingErr || !booking) {
    return {
      success: false,
      error: {
        code: "BOOKING_NOT_FOUND",
        message: "No booking found with this reference.",
        statusCode: 404,
      },
    };
  }

  if (booking.status === "confirmed") {
    return {
      success: false,
      error: {
        code: "ALREADY_PAID",
        message: "This booking has already been paid and confirmed.",
        statusCode: 400,
      },
    };
  }

  if (booking.seat_released || new Date(booking.expires_at) <= new Date()) {
    return {
      success: false,
      error: {
        code: "BOOKING_EXPIRED",
        message: "This reservation has expired. Please select a batch again.",
        statusCode: 410,
      },
    };
  }

  const batch = (booking as any).cohort_batches;
  const courseTitle = batch?.courses?.title || "Masterclass";
  const customer = (booking as any).customers;

  // 2. Zero-Amount Auto-Confirmation (Requirement 14)
  if (booking.amount_paise === 0) {
    await adminClient
      .from("bookings")
      .update({
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    // Trigger transactional confirmation notification asynchronously
    sendBookingConfirmationEmail(booking.id).catch((err) => {
      console.error("Zero-amount: Confirmation notification error:", err);
    });

    return {
      success: true,
      data: {
        amountPaise: 0,
        currency: booking.currency,
        keyId,
        autoConfirmed: true,
        bookingStatus: "confirmed",
        courseTitle,
        customer: {
          fullName: customer?.full_name || "Valued Student",
          email: customer?.email || "",
          phone: customer?.phone || customer?.whatsapp_phone || null,
        },
      },
    };
  }

  // 3. Idempotency Check: Existing unpaid Razorpay order in payments table
  const { data: existingPayment } = await adminClient
    .from("payments")
    .select("id, razorpay_order_id, amount_paise, currency, status")
    .eq("booking_id", booking.id)
    .eq("status", "created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPayment?.razorpay_order_id) {
    return {
      success: true,
      data: {
        orderId: existingPayment.razorpay_order_id,
        amountPaise: existingPayment.amount_paise,
        currency: existingPayment.currency,
        keyId,
        autoConfirmed: false,
        bookingStatus: "pending",
        courseTitle,
        customer: {
          fullName: customer?.full_name || "Valued Student",
          email: customer?.email || "",
          phone: customer?.phone || customer?.whatsapp_phone || null,
        },
      },
    };
  }

  // 4. Create Order with Razorpay REST API
  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
  const orderPayload = {
    amount: booking.amount_paise,
    currency: booking.currency,
    receipt: booking.booking_reference,
    notes: {
      booking_reference: booking.booking_reference,
      customer_email: customer?.email || "",
    },
  };

  try {
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(orderPayload),
    });

    const rzpOrder = await rzpRes.json().catch(() => null);

    if (!rzpRes.ok || !rzpOrder?.id) {
      return {
        success: false,
        error: {
          code: "RAZORPAY_API_ERROR",
          message: rzpOrder?.error?.description || "Unable to initiate payment with Razorpay.",
          statusCode: 502,
        },
      };
    }

    // 5. Store Created Payment Record in Database
    await adminClient.from("payments").insert({
      booking_id: booking.id,
      razorpay_order_id: rzpOrder.id,
      amount_paise: rzpOrder.amount,
      currency: rzpOrder.currency,
      status: "created",
      payload_snapshot: rzpOrder,
    });

    return {
      success: true,
      data: {
        orderId: rzpOrder.id,
        amountPaise: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId,
        autoConfirmed: false,
        bookingStatus: "pending",
        courseTitle,
        customer: {
          fullName: customer?.full_name || "Valued Student",
          email: customer?.email || "",
          phone: customer?.phone || customer?.whatsapp_phone || null,
        },
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to connect to payment provider.",
        statusCode: 500,
      },
    };
  }
}

/**
 * Cryptographically verifies Razorpay payment signature using HMAC-SHA256
 * and transitions both payment and booking to confirmed/captured.
 */
export async function verifyPayment(input: {
  bookingReference: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<
  PaymentServiceResult<{
    bookingReference: string;
    paymentId: string;
    orderId: string;
    status: "confirmed";
    amountPaise: number;
    currency: string;
  }>
> {
  const adminClient = createAdminClient();
  const { keySecret } = getRazorpayConfig();

  // 1. Authoritative Booking & Payment Verification
  const { data: booking, error: bookingErr } = await adminClient
    .from("bookings")
    .select(
      `
      id,
      booking_reference,
      status,
      amount_paise,
      currency,
      payments (
        id,
        razorpay_order_id,
        razorpay_payment_id,
        status,
        amount_paise
      )
    `
    )
    .eq("booking_reference", input.bookingReference)
    .maybeSingle();

  if (bookingErr || !booking) {
    return {
      success: false,
      error: {
        code: "BOOKING_NOT_FOUND",
        message: "No booking found with this reference.",
        statusCode: 404,
      },
    };
  }

  // Idempotency: If already confirmed with this payment ID, return success immediately
  if (booking.status === "confirmed") {
    const existingPayment = (booking as any).payments?.find(
      (p: any) => p.razorpay_payment_id === input.razorpayPaymentId
    );
    if (existingPayment) {
      // Idempotently trigger confirmation notification (deduplicated by notification service)
      sendBookingConfirmationEmail(booking.id).catch(() => {});

      return {
        success: true,
        data: {
          bookingReference: booking.booking_reference,
          paymentId: input.razorpayPaymentId,
          orderId: input.razorpayOrderId,
          status: "confirmed",
          amountPaise: booking.amount_paise,
          currency: booking.currency,
        },
      };
    }
  }

  // Ensure payment record exists for this booking & order ID
  const linkedPayment = (booking as any).payments?.find(
    (p: any) => p.razorpay_order_id === input.razorpayOrderId
  );

  if (!linkedPayment) {
    return {
      success: false,
      error: {
        code: "ORDER_MISMATCH",
        message: "This payment order does not belong to the given booking reference.",
        statusCode: 400,
      },
    };
  }

  // 2. Cryptographic HMAC-SHA256 Signature Verification
  const bodyToSign = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(bodyToSign)
    .digest("hex");

  // Timing-safe comparison to prevent side-channel timing attacks
  const signatureValid =
    expectedSignature.length === input.razorpaySignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(input.razorpaySignature, "utf-8")
    );

  if (!signatureValid) {
    return {
      success: false,
      error: {
        code: "INVALID_PAYMENT_SIGNATURE",
        message: "Payment signature verification failed.",
        statusCode: 400,
      },
    };
  }

  // 3. Razorpay Server-to-Server Payment Verification Check
  const { keyId } = getRazorpayConfig();
  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

  try {
    const pmtRes = await fetch(
      `https://api.razorpay.com/v1/payments/${input.razorpayPaymentId}`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    const pmtData = await pmtRes.json().catch(() => null);

    if (
      !pmtRes.ok ||
      !pmtData ||
      pmtData.order_id !== input.razorpayOrderId ||
      (pmtData.status !== "captured" && pmtData.status !== "authorized")
    ) {
      return {
        success: false,
        error: {
          code: "PAYMENT_NOT_CAPTURED",
          message: "Payment could not be verified with the payment gateway.",
          statusCode: 400,
        },
      };
    }

    // 4. Update Database State: Mark Payment Captured and Booking Confirmed
    const nowIso = new Date().toISOString();

    await adminClient
      .from("payments")
      .update({
        status: "captured",
        razorpay_payment_id: input.razorpayPaymentId,
        razorpay_signature: input.razorpaySignature,
        payload_snapshot: pmtData,
        updated_at: nowIso,
      })
      .eq("id", linkedPayment.id);

    await adminClient
      .from("bookings")
      .update({
        status: "confirmed",
        updated_at: nowIso,
      })
      .eq("id", booking.id);

    // Trigger transactional confirmation notification asynchronously
    sendBookingConfirmationEmail(booking.id).catch((err) => {
      console.error("Payment verification: Confirmation notification error:", err);
    });

    return {
      success: true,
      data: {
        bookingReference: booking.booking_reference,
        paymentId: input.razorpayPaymentId,
        orderId: input.razorpayOrderId,
        status: "confirmed",
        amountPaise: booking.amount_paise,
        currency: booking.currency,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while confirming payment.",
        statusCode: 500,
      },
    };
  }
}

/**
 * Handles incoming Razorpay Webhook events asynchronously with cryptographic verification.
 */
export async function handleWebhookEvent(
  rawBody: string,
  signature: string
): Promise<{ status: number; message: string; handled: boolean }> {
  const { webhookSecret } = getRazorpayConfig();

  if (!webhookSecret) {
    return { status: 500, message: "Webhook secret not configured on server.", handled: false };
  }

  // 1. Verify Webhook Signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const signatureValid =
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8")
    );

  if (!signatureValid) {
    return { status: 400, message: "Invalid webhook signature.", handled: false };
  }

  // 2. Parse Event Payload
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { status: 400, message: "Malformed JSON payload.", handled: false };
  }

  const adminClient = createAdminClient();
  const eventName = event.event;

  // 3. Process Events Idempotently
  if (eventName === "payment.captured" || eventName === "order.paid") {
    const paymentEntity = event.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (!orderId) {
      return { status: 200, message: "No order ID in event payload.", handled: true };
    }

    const { data: payment } = await adminClient
      .from("payments")
      .select("id, booking_id, status")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (!payment) {
      return { status: 200, message: "Order not found in payments table.", handled: true };
    }

    if (payment.status !== "captured") {
      const nowIso = new Date().toISOString();
      await adminClient
        .from("payments")
        .update({
          status: "captured",
          razorpay_payment_id: paymentId || null,
          payload_snapshot: paymentEntity,
          updated_at: nowIso,
        })
        .eq("id", payment.id);

      await adminClient
        .from("bookings")
        .update({
          status: "confirmed",
          updated_at: nowIso,
        })
        .eq("id", payment.booking_id);
    }

    // Trigger transactional confirmation notification idempotently
    sendBookingConfirmationEmail(payment.booking_id).catch((err) => {
      console.error("Webhook: Confirmation notification error:", err);
    });

    return { status: 200, message: "Payment captured successfully.", handled: true };
  }

  if (eventName === "payment.failed") {
    const paymentEntity = event.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;

    if (orderId) {
      await adminClient
        .from("payments")
        .update({
          status: "failed",
          payload_snapshot: paymentEntity,
          updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", orderId)
        .eq("status", "created");
    }

    // Note: Do NOT immediately release seat per Requirement 13; preserve 15-min pending window
    return { status: 200, message: "Payment marked failed; seat reserved until expiry.", handled: true };
  }

  return { status: 200, message: `Event ${eventName} ignored.`, handled: true };
}
