import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { assignConfirmationTemplate } from "@/lib/whatsapp/template-management";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
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
    const body = await request.json().catch(() => ({}));

    const result = await assignConfirmationTemplate(id, {
      courseId: body.courseId !== undefined ? body.courseId : undefined,
      isDefault: body.isDefault !== undefined ? body.isDefault : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to assign confirmation template" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.template,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
