import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { adminPaymentsQuerySchema } from "@/lib/validations/payment-admin";
import { getPaymentsList } from "@/lib/payments-admin/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate Admin Session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access payment records.",
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

    // 2. Parse & Validate Query Parameters
    const url = new URL(request.url);
    const rawParams = {
      page: url.searchParams.get("page") || "1",
      limit: url.searchParams.get("limit") || "20",
      search: url.searchParams.get("search") || "",
      status: url.searchParams.get("status") || "all",
      courseId: url.searchParams.get("courseId") || "all",
      batchId: url.searchParams.get("batchId") || "all",
      from: url.searchParams.get("from") || "",
      to: url.searchParams.get("to") || "",
    };

    const validationResult = adminPaymentsQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: issue
              ? `${issue.path.join(".")}: ${issue.message}`
              : "Invalid query parameters.",
          },
        },
        { status: 400 }
      );
    }

    // 3. Query Payments List
    const result = await getPaymentsList(validationResult.data);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DB_ERROR",
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
    console.error("GET /api/admin/payments unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while querying payments.",
        },
      },
      { status: 500 }
    );
  }
}
