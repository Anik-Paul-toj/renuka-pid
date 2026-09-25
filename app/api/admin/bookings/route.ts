import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { adminBookingsQuerySchema } from "@/lib/validations/booking-admin";
import { getBookingsList } from "@/lib/bookings-admin/service";

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
            message: "Authentication required to access booking records.",
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Query Parameters
    const url = new URL(request.url);
    const rawParams = {
      page: url.searchParams.get("page") || "1",
      limit: url.searchParams.get("limit") || "20",
      search: url.searchParams.get("search") || "",
      status: url.searchParams.get("status") || "all",
      paymentStatus: url.searchParams.get("paymentStatus") || "all",
      batchId: url.searchParams.get("batchId") || "all",
    };

    const validationResult = adminBookingsQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid query parameters.",
          },
        },
        { status: 400 }
      );
    }

    // 3. Query Bookings List
    const result = await getBookingsList(validationResult.data);

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
    console.error("GET /api/admin/bookings unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while querying booking directory.",
        },
      },
      { status: 500 }
    );
  }
}
