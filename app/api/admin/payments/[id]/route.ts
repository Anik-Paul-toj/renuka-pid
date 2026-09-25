import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getPaymentDetailsById } from "@/lib/payments-admin/service";

export const dynamic = "force-dynamic";

export async function GET(
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
            message: "Authentication required to access payment details.",
          },
        },
        { status: 401 }
      );
    }

    if (!session.adminProfile?.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin account is inactive.",
          },
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Payment ID parameter is required.",
          },
        },
        { status: 400 }
      );
    }

    // 2. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Payment ID must be a valid UUID.",
          },
        },
        { status: 400 }
      );
    }

    // 3. Query Payment Details
    const result = await getPaymentDetailsById(id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.statusCode === 404 ? "PAYMENT_NOT_FOUND" : "DB_ERROR",
            message: result.error,
          },
        },
        { status: result.statusCode }
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
    console.error("GET /api/admin/payments/[id] unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching payment details.",
        },
      },
      { status: 500 }
    );
  }
}
