import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { listTemplates, createTemplateDraft } from "@/lib/whatsapp/template-management";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const purpose = searchParams.get("purpose") || undefined;

    const templates = await listTemplates({ search, status, category, purpose });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const template = await createTemplateDraft(body, session.adminProfile.email);

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create template draft" },
      { status: 400 }
    );
  }
}
