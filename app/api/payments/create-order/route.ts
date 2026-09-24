import { NextRequest, NextResponse } from "next/server";
import { createPaymentOrderSchema } from "@/lib/validations/payment";
import { createOrderForBooking } from "@/lib/payment/service";

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

    const validationResult = createPaymentOrderSchema.safeParse(body);
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

    const result = await createOrderForBooking(validationResult.data.bookingReference);

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

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while initiating payment.",
        },
      },
      { status: 500 }
    );
  }
}
