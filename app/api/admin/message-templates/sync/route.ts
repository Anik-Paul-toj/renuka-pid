import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { syncTemplatesWithMeta } from "@/lib/whatsapp/template-management";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncTemplatesWithMeta();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to synchronize templates from Meta" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        syncedCount: result.syncedCount,
        importedCount: result.importedCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to sync templates" },
      { status: 500 }
    );
  }
}
