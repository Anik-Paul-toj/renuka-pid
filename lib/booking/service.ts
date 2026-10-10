import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateBookingInput } from "@/lib/validations/booking";
import { verifyCreditVerificationToken } from "@/lib/course-credit/identity";
import crypto from "crypto";

export interface SafeBookingDetails {
  bookingReference: string;
  status: "pending" | "confirmed" | "cancelled" | "refunded";
  courseTitle: string;
  batchName: string;
  startDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  amountPaise: number;
  currency: string;
  expiresAt: string;
  customer: {
    fullName: string;
    email: string;
  };
  seatsRemaining?: number;
  isExisting?: boolean;
  originalAmountPaise?: number;
  discountAmountPaise?: number;
  creditApplied?: boolean;
  creditMessage?: string | null;
}

export type BookingServiceError = {
  code:
    | "INVALID_INPUT"
    | "BATCH_NOT_FOUND"
    | "COURSE_INACTIVE"
    | "ENROLLMENT_CLOSED"
    | "SOLD_OUT"
    | "CREDIT_ALREADY_USED"
    | "INVALID_CREDIT_TOKEN"
    | "CREDIT_MIGRATION_REQUIRED"
    | "CREDIT_RESERVATION_FAILED"
    | "CREDIT_SNAPSHOT_MISMATCH"
    | "COLLISION_RETRY_FAILED"
    | "INTERNAL_ERROR";
  message: string;
  statusCode: number;
};

export type BookingServiceResult =
  | { success: true; data: SafeBookingDetails }
  | { success: false; error: BookingServiceError };

/**
 * Generates a human-friendly, high-entropy unique booking reference.
 * Format: REF-TIMESTAMP-RANDOM (e.g., REF-KYZ8A1-7F3A)
 */
export function generateBookingReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REF-${timestamp}-${randomHex}`;
}

/**
 * Creates or retrieves a booking atomically using database authoritative rules.
 * Strictly enforces token-based identity verification for Foundation credit.
 */
export async function processBooking(
  input: CreateBookingInput
): Promise<BookingServiceResult> {
  const adminClient = createAdminClient();

  // 1. Authoritative Batch & Course Verification
  const { data: batchData, error: batchErr } = await adminClient
    .from("cohort_batches")
    .select(
      `
      id,
      course_id,
      batch_name,
      start_date,
      start_time,
      end_time,
      timezone,
      total_seats,
      seats_booked,
      is_enrollment_open,
      courses (
        id,
        title,
        offer_price_paise,
        currency,
        is_active
      )
    `
    )
    .eq("id", input.batchId)
    .maybeSingle();

  if (batchErr || !batchData) {
    return {
      success: false,
      error: {
        code: "BATCH_NOT_FOUND",
        message: "The requested workshop batch was not found.",
        statusCode: 404,
      },
    };
  }

  const course = (batchData as any).courses;
  if (!course || !course.is_active) {
    return {
      success: false,
      error: {
        code: "COURSE_INACTIVE",
        message: "The course associated with this batch is currently inactive.",
        statusCode: 400,
      },
    };
  }

  if (!batchData.is_enrollment_open) {
    return {
      success: false,
      error: {
        code: "ENROLLMENT_CLOSED",
        message: "Enrollment is currently closed for this batch.",
        statusCode: 400,
      },
    };
  }

  if (batchData.seats_booked >= batchData.total_seats) {
    return {
      success: false,
      error: {
        code: "SOLD_OUT",
        message: "This workshop batch is completely sold out.",
        statusCode: 409,
      },
    };
  }

  // Authoritative course pricing from database
  const originalAmountPaise = course.offer_price_paise;
  const currency = course.currency || "INR";
  const courseTitle = course.title;
  const normalizedEmail = input.email.trim().toLowerCase();
  const trimmedName = input.fullName.trim();
  const formattedPhone = input.phone && input.phone.trim().length > 0 ? input.phone.trim() : null;

  // Release any expired pending reservations before evaluating eligibility and seats
  try {
    await adminClient.rpc("release_expired_pending_bookings");
  } catch {
    // Continue if RPC not available
  }

  // 2. Identity-Verified Credit Entitlement Evaluation
  let creditApplied = false;
  let discountAmountPaise = 0;
  let payableAmountPaise = originalAmountPaise;
  let sourceBookingId: string | null = null;
  let ruleId: string | null = null;
  let tokenNonce: string | null = null;
  let creditMessage: string | null = null;

  if (input.creditVerificationToken) {
    const tokenResult = await verifyCreditVerificationToken(
      input.creditVerificationToken,
      {
        email: normalizedEmail,
        phone: formattedPhone,
        targetCourseId: batchData.course_id,
      }
    );

    if (!tokenResult.valid || !tokenResult.payload) {
      return {
        success: false,
        error: {
          code: "INVALID_CREDIT_TOKEN",
          message:
            tokenResult.error ||
            "The credit verification token is invalid, expired, or does not match this booking.",
          statusCode: 400,
        },
      };
    }

    creditApplied = true;
    tokenNonce = tokenResult.payload.nonce;
    sourceBookingId = tokenResult.payload.sourceBookingId;
    ruleId = tokenResult.payload.ruleId;
    discountAmountPaise = tokenResult.payload.discountAmountPaise;
    payableAmountPaise = Math.max(0, originalAmountPaise - discountAmountPaise);
    creditMessage = "Foundation course credit applied.";
  }

  // 3. Customer Lookup or Reuse
  let customerId: string;
  let customerName = trimmedName;

  const { data: existingCustomer, error: custFetchErr } = await adminClient
    .from("customers")
    .select("id, full_name, email, phone, whatsapp_phone")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (custFetchErr) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred while checking customer records.",
        statusCode: 500,
      },
    };
  }

  if (existingCustomer) {
    customerId = existingCustomer.id;
    customerName = existingCustomer.full_name || trimmedName;

    // If customer updated phone/whatsapp, update record safely
    if (formattedPhone && (!existingCustomer.phone || !existingCustomer.whatsapp_phone)) {
      await adminClient
        .from("customers")
        .update({
          phone: existingCustomer.phone || formattedPhone,
          whatsapp_phone: existingCustomer.whatsapp_phone || formattedPhone,
        })
        .eq("id", customerId);
    }
  } else {
    // Create new customer
    const { data: newCustomer, error: createCustErr } = await adminClient
      .from("customers")
      .insert({
        full_name: trimmedName,
        email: normalizedEmail,
        phone: formattedPhone,
        whatsapp_phone: formattedPhone,
      })
      .select("id, full_name")
      .single();

    if (createCustErr || !newCustomer) {
      // In case of concurrent insert with identical email, query again
      const { data: retryCustomer } = await adminClient
        .from("customers")
        .select("id, full_name")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (!retryCustomer) {
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Unable to create or resolve customer record.",
            statusCode: 500,
          },
        };
      }
      customerId = retryCustomer.id;
      customerName = retryCustomer.full_name;
    } else {
      customerId = newCustomer.id;
    }
  }

  // 4. Idempotency Check: Existing active pending/confirmed reservation for this customer & batch
  const nowIso = new Date().toISOString();
  let { data: existingBooking, error: existingErr } = await adminClient
    .from("bookings")
    .select(
      "id, booking_reference, status, amount_paise, original_amount_paise, discount_amount_paise, credit_applied, currency, expires_at, created_at"
    )
    .eq("customer_id", customerId)
    .eq("batch_id", input.batchId)
    .in("status", ["pending", "confirmed"])
    .eq("seat_released", false)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If credit columns do not exist yet (pre-migration schema), query baseline columns
  if (
    existingErr &&
    (existingErr.code === "42703" ||
      existingErr.message?.includes("original_amount_paise") ||
      existingErr.message?.includes("column"))
  ) {
    const fallback = await adminClient
      .from("bookings")
      .select(
        "id, booking_reference, status, amount_paise, currency, expires_at, created_at"
      )
      .eq("customer_id", customerId)
      .eq("batch_id", input.batchId)
      .in("status", ["pending", "confirmed"])
      .eq("seat_released", false)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existingBooking = fallback.data as any;
  }

  if (existingBooking) {
    // Return existing active booking safely without re-reserving or consuming an extra seat
    return {
      success: true,
      data: {
        bookingReference: existingBooking.booking_reference,
        status: existingBooking.status as "pending" | "confirmed",
        courseTitle,
        batchName: batchData.batch_name,
        startDate: batchData.start_date,
        startTime: batchData.start_time,
        endTime: batchData.end_time,
        timezone: batchData.timezone,
        amountPaise: existingBooking.amount_paise,
        originalAmountPaise: existingBooking.original_amount_paise || originalAmountPaise,
        discountAmountPaise: existingBooking.discount_amount_paise || 0,
        creditApplied: existingBooking.credit_applied || false,
        creditMessage: existingBooking.credit_applied ? "Foundation course credit applied." : null,
        currency: existingBooking.currency,
        expiresAt: existingBooking.expires_at,
        customer: {
          fullName: customerName,
          email: normalizedEmail,
        },
        isExisting: true,
      },
    };
  }

  // 5. Atomic Seat Reservation via reserve_seat_atomic RPC
  let bookingReference = generateBookingReference();
  let reservationAttempts = 0;
  let rpcSuccess = false;
  let rpcData: any = null;

  while (reservationAttempts < 3 && !rpcSuccess) {
    reservationAttempts++;

    // When credit is applied, invoke the unified 7-arg signature with credit parameters
    if (creditApplied) {
      const rpcPayload: any = {
        p_batch_id: input.batchId,
        p_customer_id: customerId,
        p_amount_paise: payableAmountPaise,
        p_booking_reference: bookingReference,
        p_source_booking_id: sourceBookingId,
        p_rule_id: ruleId,
        p_discount_amount_paise: discountAmountPaise,
        p_token_nonce: tokenNonce,
      };

      const { data: result, error: rpcErr } = await adminClient.rpc(
        "reserve_seat_atomic",
        rpcPayload
      );

      if (rpcErr) {
        if (rpcErr.code === "23505" || rpcErr.message?.includes("booking_reference")) {
          bookingReference = generateBookingReference();
          continue;
        }

        // If credit migration is missing, FAIL CLOSED. Do NOT silently fall back to legacy RPC!
        if (
          rpcErr.code === "PGRST202" ||
          rpcErr.message?.includes("function") ||
          rpcErr.message?.includes("argument") ||
          rpcErr.message?.includes("booking_credits") ||
          rpcErr.message?.includes("original_amount_paise")
        ) {
          return {
            success: false,
            error: {
              code: "CREDIT_MIGRATION_REQUIRED",
              message:
                "Foundation course credit system is temporarily unavailable. Please complete checkout at the standard rate or contact support.",
              statusCode: 503,
            },
          };
        }

        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to reserve seat. Please try again.",
            statusCode: 500,
          },
        };
      }

      rpcData = result;
      rpcSuccess = true;
    } else {
      // Standard booking (e.g. Masterclass or full price Artistry):
      // Invoke with 4 parameters. Backwards compatible with legacy 4-arg RPC and new 7-arg RPC defaults.
      const rpcPayload: any = {
        p_batch_id: input.batchId,
        p_customer_id: customerId,
        p_amount_paise: payableAmountPaise,
        p_booking_reference: bookingReference,
      };

      const { data: result, error: rpcErr } = await adminClient.rpc(
        "reserve_seat_atomic",
        rpcPayload
      );

      if (rpcErr) {
        if (rpcErr.code === "23505" || rpcErr.message?.includes("booking_reference")) {
          bookingReference = generateBookingReference();
          continue;
        }

        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to reserve seat. Please try again.",
            statusCode: 500,
          },
        };
      }

      rpcData = result;
      rpcSuccess = true;
    }
  }

  if (!rpcSuccess || !rpcData) {
    return {
      success: false,
      error: {
        code: "COLLISION_RETRY_FAILED",
        message: "Could not allocate a unique booking reference. Please try again.",
        statusCode: 500,
      },
    };
  }

  // Check RPC domain logic result
  if (!rpcData.success) {
    const errorCode = rpcData.error_code;
    if (errorCode === "SOLD_OUT") {
      return {
        success: false,
        error: {
          code: "SOLD_OUT",
          message: "This workshop batch is completely sold out.",
          statusCode: 409,
        },
      };
    }
    if (errorCode === "ENROLLMENT_CLOSED") {
      return {
        success: false,
        error: {
          code: "ENROLLMENT_CLOSED",
          message: "Enrollment is currently closed for this batch.",
          statusCode: 400,
        },
      };
    }
    if (errorCode === "CREDIT_ALREADY_USED" || errorCode === "TOKEN_ALREADY_REDEEMED") {
      return {
        success: false,
        error: {
          code: "CREDIT_ALREADY_USED",
          message:
            errorCode === "TOKEN_ALREADY_REDEEMED"
              ? "This credit verification token has already been redeemed. Please check your eligibility again."
              : "This Foundation course credit has already been used or is reserved by an active booking.",
          statusCode: 409,
        },
      };
    }
    if (errorCode === "BATCH_NOT_FOUND") {
      return {
        success: false,
        error: {
          code: "BATCH_NOT_FOUND",
          message: "The requested batch does not exist.",
          statusCode: 404,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: rpcData.message || "Seat reservation could not be completed.",
        statusCode: 500,
      },
    };
  }

  // 6. Strict Transactional Verification
  // If credit was requested, RPC MUST confirm that credit was atomically applied
  if (creditApplied && rpcData.credit_applied !== true) {
    // Compensating release of seat if credit reservation failed
    await adminClient.rpc("release_seat_atomic", {
      p_booking_id: rpcData.booking_id,
      p_reason: "cancelled",
    });

    return {
      success: false,
      error: {
        code: "CREDIT_RESERVATION_FAILED",
        message: "Unable to allocate course credit atomically. Please try again.",
        statusCode: 500,
      },
    };
  }

  // 7. Verify authoritative persisted booking snapshot
  // Base columns exist on both pre-migration and post-migration schemas.
  // Query snapshot credit columns only when credit was applied.
  const { data: createdBookingRaw, error: fetchBookingErr } = await adminClient
    .from("bookings")
    .select(
      creditApplied
        ? ("id, booking_reference, status, amount_paise, original_amount_paise, discount_amount_paise, credit_applied, currency, expires_at" as any)
        : ("id, booking_reference, status, amount_paise, currency, expires_at" as any)
    )
    .eq("id", rpcData.booking_id)
    .single();

  const createdBooking = createdBookingRaw as any;

  if (fetchBookingErr || !createdBooking) {
    // If fetching fails, compensating release ensures no dangling seat or reservation
    await adminClient.rpc("release_seat_atomic", {
      p_booking_id: rpcData.booking_id,
      p_reason: "cancelled",
    });

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve booking confirmation.",
        statusCode: 500,
      },
    };
  }

  // If credit was applied, verify snapshot integrity in the database record
  if (
    creditApplied &&
    (!createdBooking.credit_applied ||
      createdBooking.discount_amount_paise !== discountAmountPaise)
  ) {
    await adminClient.rpc("release_seat_atomic", {
      p_booking_id: rpcData.booking_id,
      p_reason: "cancelled",
    });

    return {
      success: false,
      error: {
        code: "CREDIT_SNAPSHOT_MISMATCH",
        message: "Discrepancy detected in booking discount snapshot.",
        statusCode: 500,
      },
    };
  }

  return {
    success: true,
    data: {
      bookingReference: createdBooking.booking_reference,
      status: createdBooking.status as "pending",
      courseTitle,
      batchName: batchData.batch_name,
      startDate: batchData.start_date,
      startTime: batchData.start_time,
      endTime: batchData.end_time,
      timezone: batchData.timezone,
      amountPaise: createdBooking.amount_paise,
      originalAmountPaise,
      discountAmountPaise,
      creditApplied,
      creditMessage,
      currency: createdBooking.currency,
      expiresAt: createdBooking.expires_at,
      customer: {
        fullName: customerName,
        email: normalizedEmail,
      },
      seatsRemaining: rpcData.seats_remaining ?? undefined,
      isExisting: false,
    },
  };
}

/**
 * Retrieves customer-safe booking details by booking reference.
 * Explicitly excludes Zoom join URL, passcode, and private IDs.
 */
export async function getBookingByReference(
  bookingReference: string
): Promise<BookingServiceResult> {
  const adminClient = createAdminClient();

  const baseBookingQuery = `
      id,
      booking_reference,
      status,
      amount_paise,
      currency,
      expires_at,
      seat_released,
      cohort_batches (
        batch_name,
        start_date,
        start_time,
        end_time,
        timezone,
        courses (
          title
        )
      ),
      customers (
        full_name,
        email
      )
  `;

  let { data: booking, error } = await adminClient
    .from("bookings")
    .select(
      `
      ${baseBookingQuery},
      original_amount_paise,
      discount_amount_paise,
      credit_applied
    `
    )
    .eq("booking_reference", bookingReference)
    .maybeSingle();

  // If credit columns do not exist yet (pre-migration schema), fallback to base columns
  if (
    error &&
    (error.code === "42703" ||
      error.message?.includes("original_amount_paise") ||
      error.message?.includes("column"))
  ) {
    const fallback = await adminClient
      .from("bookings")
      .select(baseBookingQuery)
      .eq("booking_reference", bookingReference)
      .maybeSingle();
    booking = fallback.data as any;
    error = fallback.error;
  }

  if (error || !booking) {
    return {
      success: false,
      error: {
        code: "BATCH_NOT_FOUND",
        message: "Booking reference not found.",
        statusCode: 404,
      },
    };
  }

  const batch = (booking as any).cohort_batches;
  const course = batch?.courses;
  const customer = (booking as any).customers;

  return {
    success: true,
    data: {
      bookingReference: booking.booking_reference,
      status: booking.status as any,
      courseTitle: course?.title || "Masterclass",
      batchName: batch?.batch_name || "Live Batch",
      startDate: batch?.start_date || "",
      startTime: batch?.start_time || "",
      endTime: batch?.end_time || "",
      timezone: batch?.timezone || "Asia/Kolkata",
      amountPaise: booking.amount_paise,
      originalAmountPaise: booking.original_amount_paise || booking.amount_paise,
      discountAmountPaise: booking.discount_amount_paise || 0,
      creditApplied: booking.credit_applied || false,
      creditMessage: booking.credit_applied ? "Foundation course credit applied." : null,
      currency: booking.currency,
      expiresAt: booking.expires_at,
      customer: {
        fullName: customer?.full_name || "Valued Student",
        email: customer?.email || "",
      },
    },
  };
}
