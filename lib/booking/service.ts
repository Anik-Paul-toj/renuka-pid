import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateBookingInput } from "@/lib/validations/booking";
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
}

export type BookingServiceError = {
  code:
    | "INVALID_INPUT"
    | "BATCH_NOT_FOUND"
    | "COURSE_INACTIVE"
    | "ENROLLMENT_CLOSED"
    | "SOLD_OUT"
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
 * Creates or retrieves a booking atomically using the database authoritative rules.
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

  // Authoritative values from database
  const amountPaise = course.offer_price_paise;
  const currency = course.currency || "INR";
  const courseTitle = course.title;
  const normalizedEmail = input.email.trim().toLowerCase();
  const trimmedName = input.fullName.trim();
  const formattedPhone = input.phone && input.phone.trim().length > 0 ? input.phone.trim() : null;

  // 2. Customer Lookup or Reuse
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

  // 3. Idempotency Check: Existing active pending/confirmed reservation for this customer & batch
  const nowIso = new Date().toISOString();
  const { data: existingBooking } = await adminClient
    .from("bookings")
    .select("id, booking_reference, status, amount_paise, currency, expires_at, created_at")
    .eq("customer_id", customerId)
    .eq("batch_id", input.batchId)
    .in("status", ["pending", "confirmed"])
    .eq("seat_released", false)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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

  // 4. Atomic Seat Reservation via reserve_seat_atomic RPC
  let bookingReference = generateBookingReference();
  let reservationAttempts = 0;
  let rpcSuccess = false;
  let rpcData: any = null;

  while (reservationAttempts < 3 && !rpcSuccess) {
    reservationAttempts++;
    const { data: result, error: rpcErr } = await adminClient.rpc(
      "reserve_seat_atomic",
      {
        p_batch_id: input.batchId,
        p_customer_id: customerId,
        p_amount_paise: amountPaise,
        p_booking_reference: bookingReference,
      }
    );

    if (rpcErr) {
      // Check if reference collision occurred (unique index violation)
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

  // Fetch the newly created booking record to ensure authoritative expires_at
  const { data: createdBooking, error: fetchBookingErr } = await adminClient
    .from("bookings")
    .select("id, booking_reference, status, amount_paise, currency, expires_at")
    .eq("id", rpcData.booking_id)
    .single();

  if (fetchBookingErr || !createdBooking) {
    // If fetching fails, compensating release ensures no dangling seat
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

  const { data: booking, error } = await adminClient
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
    `
    )
    .eq("booking_reference", bookingReference)
    .maybeSingle();

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
      currency: booking.currency,
      expiresAt: booking.expires_at,
      customer: {
        fullName: customer?.full_name || "Valued Student",
        email: customer?.email || "",
      },
    },
  };
}
