import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getTemplateById,
  updateTemplateDraft,
  deleteTemplateDraft,
} from "@/lib/whatsapp/template-management";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const template = await getTemplateById(id);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get template" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json().catch(() => null);

    const updated = await updateTemplateDraft(id, body);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update template draft" },
      { status: 400 }
    );
  }
}

export async function DELETE(
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
    const deleted = await deleteTemplateDraft(id);

    if (!deleted) {
      return NextResponse.json({ error: "Template not found or cannot be deleted" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Template draft deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete template" },
      { status: 500 }
    );
  }
}
