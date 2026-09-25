import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getWhatsAppConfigStatus } from "@/lib/whatsapp/service";

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
            message: "Authentication required to access WhatsApp status.",
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

    const status = getWhatsAppConfigStatus();

    // Never return access tokens, secrets, or credential strings
    return NextResponse.json(
      {
        success: true,
        data: {
          isConfigured: status.isConfigured,
          message: status.message,
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
          message: "Failed to retrieve WhatsApp configuration status.",
        },
      },
      { status: 500 }
    );
  }
}
