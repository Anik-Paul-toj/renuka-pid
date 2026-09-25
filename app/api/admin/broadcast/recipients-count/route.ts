import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { targetFilterSchema } from "@/lib/validations/broadcast";
import { resolveBroadcastRecipients } from "@/lib/broadcast/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
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

    const body = await request.json().catch(() => null);
    const validationResult = targetFilterSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid target filter criteria.",
          },
        },
        { status: 400 }
      );
    }

    // Resolve recipients strictly from database server-side
    const recipients = await resolveBroadcastRecipients(validationResult.data);

    return NextResponse.json(
      {
        success: true,
        count: recipients.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/broadcast/recipients-count error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to resolve recipient count.",
        },
      },
      { status: 500 }
    );
  }
}
