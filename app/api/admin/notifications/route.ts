import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { notificationQuerySchema } from "@/lib/validations/notification";
import { getNotificationLogsList } from "@/lib/notifications-admin/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access notification logs.",
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

    const { searchParams } = new URL(request.url);
    const parsedQuery = notificationQuerySchema.safeParse({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "all",
      channel: searchParams.get("channel") || "all",
      type: searchParams.get("type") || "all",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_QUERY",
            message: "Invalid query parameters for notification logs.",
          },
        },
        { status: 400 }
      );
    }

    const result = await getNotificationLogsList(parsedQuery.data);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FETCH_ERROR",
            message: result.error,
          },
        },
        { status: 500 }
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
    console.error("GET /api/admin/notifications unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while querying notification logs.",
        },
      },
      { status: 500 }
    );
  }
}
