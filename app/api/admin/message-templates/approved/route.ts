import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getApprovedTemplatesForBroadcast } from "@/lib/whatsapp/template-management";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get("purpose") as any;

    const approvedTemplates = await getApprovedTemplatesForBroadcast({
      purpose: purpose || undefined,
    });

    return NextResponse.json({
      success: true,
      data: approvedTemplates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get approved templates" },
      { status: 500 }
    );
  }
}
