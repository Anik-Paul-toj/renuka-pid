import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { submitTemplateToMeta } from "@/lib/whatsapp/template-management";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.adminProfile.role === "editor") {
      return NextResponse.json(
        { error: "Forbidden: Editors have read-only access." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const result = await submitTemplateToMeta(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to submit template to Meta" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        metaTemplateId: result.metaTemplateId,
        status: result.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit template" },
      { status: 500 }
    );
  }
}
