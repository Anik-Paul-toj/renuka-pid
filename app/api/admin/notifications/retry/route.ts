import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { retryNotificationSchema } from "@/lib/validations/notification";
import { sendBookingConfirmationEmail } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Admin Session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access admin notification operations.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Payload
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

    const validationResult = retryNotificationSchema.safeParse(body);
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

    // 3. Dispatch Notification with Idempotency or Force Retry
    // Note: Recipient is derived entirely server-side from the verified booking's customer record
    const result = await sendBookingConfirmationEmail(
      validationResult.data.bookingReference,
      { forceRetry: validationResult.data.forceRetry }
    );

    if (!result.success) {
      const statusCode =
        result.code === "BOOKING_NOT_FOUND"
          ? 404
          : result.code === "BOOKING_NOT_CONFIRMED"
          ? 400
          : 500;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code || "NOTIFICATION_FAILED",
            message: result.error || "Failed to process notification.",
          },
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          alreadySent: result.alreadySent || false,
          providerMessageId: result.providerMessageId || null,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while processing the notification retry.",
        },
      },
      { status: 500 }
    );
  }
}
