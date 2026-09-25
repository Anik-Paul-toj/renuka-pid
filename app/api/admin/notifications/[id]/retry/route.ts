import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { retryNotificationById } from "@/lib/notifications-admin/service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to retry notifications.",
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

    // Role check: Only admin and super_admin can trigger retries
    const allowedRoles = ["admin", "super_admin"];
    if (!allowedRoles.includes(session.adminProfile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Editors cannot trigger notification retries.",
          },
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Notification log ID is required.",
          },
        },
        { status: 400 }
      );
    }

    const result = await retryNotificationById(id);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.statusCode === 400 ? "INELIGIBLE_FOR_RETRY" : "RETRY_FAILED",
            message: result.error || "Failed to retry notification.",
          },
        },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          providerMessageId: result.providerMessageId,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/notifications/[id]/retry error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while retrying the notification.",
        },
      },
      { status: 500 }
    );
  }
}
