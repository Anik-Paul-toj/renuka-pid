import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeCreditForBooking } from "@/lib/course-credit/service";
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

  return { keyId, keySecret, webhookSecret };
}

/**
 * Creates or retrieves an existing Razorpay order for a pending booking.
 * The authoritative amount comes exclusively from the server-side database record.
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

  if (!keyId || !keySecret) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Razorpay payment gateway credentials are not configured on the server.",
        statusCode: 500,
      },
    };
  }

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

  // Validate authoritative amount
  if (
    typeof booking.amount_paise !== "number" ||
    booking.amount_paise < 0 ||
    isNaN(booking.amount_paise)
  ) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Invalid booking amount registered for this course.",
        statusCode: 400,
      },
    };
  }

  // Validate authoritative currency
  const currency = (booking.currency || "INR").toUpperCase();
  if (currency !== "INR") {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: `Unsupported currency '${booking.currency}'. Only INR is supported for Razorpay payments.`,
        statusCode: 400,
      },
    };
  }

  const batch = (booking as any).cohort_batches;
  const courseTitle = batch?.courses?.title || "Masterclass";
  const customer = (booking as any).customers;

  // 2. Zero-Amount Auto-Confirmation (Free / Complimentary courses)
  if (booking.amount_paise === 0) {
    await adminClient
      .from("bookings")
      .update({
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    return {
      success: true,
      data: {
        amountPaise: 0,
        currency,
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

  if (
    existingPayment?.razorpay_order_id &&
    existingPayment.amount_paise === booking.amount_paise &&
    existingPayment.currency?.toUpperCase() === currency
  ) {
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

  // 4. Create Order with Razorpay REST API using authoritative database amount
  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
  const orderPayload = {
    amount: booking.amount_paise,
    currency,
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
  } catch {
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
 * Cryptographically verifies Razorpay payment signature using HMAC-SHA256,
 * verifies payment status with Razorpay REST API, and transitions both payment
 * and booking to confirmed/captured.
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
  const { keyId, keySecret } = getRazorpayConfig();

  if (!keyId || !keySecret) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Razorpay payment gateway credentials are not configured on the server.",
        statusCode: 500,
      },
    };
  }

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
      pmtData.amount !== booking.amount_paise
    ) {
      return {
        success: false,
        error: {
          code: "PAYMENT_NOT_CAPTURED",
          message: "Payment details could not be verified with the payment gateway.",
          statusCode: 400,
        },
      };
    }

    // If status is authorized and not yet captured, attempt capture
    let finalPaymentData = pmtData;
    if (pmtData.status === "authorized") {
      try {
        const captureRes = await fetch(
          `https://api.razorpay.com/v1/payments/${input.razorpayPaymentId}/capture`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              amount: booking.amount_paise,
              currency: booking.currency || "INR",
            }),
          }
        );
        const captureData = await captureRes.json().catch(() => null);
        if (captureRes.ok && captureData?.status === "captured") {
          finalPaymentData = captureData;
        }
      } catch {
        // Fall back to original verification data
      }
    }

    if (
      finalPaymentData.status !== "captured" &&
      finalPaymentData.status !== "authorized"
    ) {
      return {
        success: false,
        error: {
          code: "PAYMENT_NOT_CAPTURED",
          message: "Payment is not in a captured state.",
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
        payload_snapshot: finalPaymentData,
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

    // Atomically consume any reserved course credit permanently
    await consumeCreditForBooking(booking.id);

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
  } catch {
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
 * Supported events: payment.captured, order.paid, payment.failed
 * Idempotently reconciles database state.
 */
export async function handleWebhookEvent(
  rawBody: string,
  signature: string
): Promise<{ status: number; message: string; handled: boolean }> {
  const { webhookSecret } = getRazorpayConfig();

  if (!webhookSecret) {
    return { status: 500, message: "Webhook secret not configured on server.", handled: false };
  }

  // 1. Verify Webhook Signature using raw body and HMAC-SHA256
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
    const orderEntity = event.payload?.order?.entity;
    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id || null;

    if (!orderId) {
      return { status: 200, message: "No order ID in event payload.", handled: true };
    }

    const { data: payment } = await adminClient
      .from("payments")
      .select("id, booking_id, status, razorpay_payment_id")
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
          razorpay_payment_id: paymentId || payment.razorpay_payment_id || null,
          payload_snapshot: paymentEntity || orderEntity || event.payload,
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

      // Atomically consume any reserved course credit permanently
      await consumeCreditForBooking(payment.booking_id);

      return { status: 200, message: "Payment captured successfully.", handled: true };
    }

    return { status: 200, message: "Payment already captured (idempotent).", handled: true };
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

    // Do NOT release seat prematurely; preserve 15-min reservation window per business rules
    return { status: 200, message: "Payment marked failed; seat reserved until expiry.", handled: true };
  }

  return { status: 200, message: `Event ${eventName} ignored.`, handled: true };
}
