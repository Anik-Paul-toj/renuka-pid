import { NextRequest, NextResponse } from "next/server";
import { getBookingByReference } from "@/lib/booking/service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingReference: string }> }
) {
  try {
    const { bookingReference } = await params;

    if (!bookingReference || typeof bookingReference !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "A valid booking reference is required.",
          },
        },
        { status: 400 }
      );
    }

    const result = await getBookingByReference(bookingReference);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.error.code,
            message: result.error.message,
          },
        },
        { status: result.error.statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve booking reference details.",
        },
      },
      { status: 500 }
    );
  }
}
