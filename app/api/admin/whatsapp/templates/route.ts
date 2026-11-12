import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getWhatsAppTransport } from "@/lib/whatsapp/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin authentication required." } },
        { status: 401 }
      );
    }

    const transport = getWhatsAppTransport();
    const templates = transport.getApprovedTemplates ? await transport.getApprovedTemplates() : [];

    return NextResponse.json(
      {
        success: true,
        data: templates,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: err.message || "Failed to fetch approved templates." } },
      { status: 500 }
    );
  }
}

