import { NextRequest, NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/validations/booking";
import { processBooking } from "@/lib/booking/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Malformed request payload. Expected JSON object.",
          },
        },
        { status: 400 }
      );
    }

    const validationResult = createBookingSchema.safeParse(body);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: issue ? `${issue.path.join(".")}: ${issue.message}` : "Validation failed.",
          },
        },
        { status: 400 }
      );
    }

    const bookingResult = await processBooking(validationResult.data);

    if (!bookingResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: bookingResult.error.code,
            message: bookingResult.error.message,
          },
        },
        { status: bookingResult.error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: bookingResult.data,
      },
      { status: bookingResult.data.isExisting ? 200 : 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while processing your booking.",
        },
      },
      { status: 500 }
    );
  }
}
