import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { cancelBookingActionSchema } from "@/lib/validations/booking-admin";
import { cancelBookingById } from "@/lib/bookings-admin/service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate Admin Session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to cancel bookings.",
          },
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Booking ID is required.",
          },
        },
        { status: 400 }
      );
    }

    // 2. Parse optional cancellation reason
    const body = await request.json().catch(() => ({}));
    const validationResult = cancelBookingActionSchema.safeParse(body);
    const reason = validationResult.success ? validationResult.data.reason : "cancelled";

    // 3. Atomically Release Seat and Cancel Booking
    const result = await cancelBookingById(id, reason);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.statusCode === 404 ? "BOOKING_NOT_FOUND" : "CANCEL_FAILED",
            message: result.error || "Failed to cancel booking.",
          },
        },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          alreadyReleased: result.alreadyReleased || false,
          message: result.message || "Booking cancelled successfully.",
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/bookings/[id]/cancel unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while cancelling booking.",
        },
      },
      { status: 500 }
    );
  }
}
