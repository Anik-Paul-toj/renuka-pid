import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { sendUpcomingClassReminderWhatsApp } from "@/lib/whatsapp/service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin authentication required." } },
        { status: 401 }
      );
    }

    const { id: batchId } = await params;
    if (!batchId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Batch ID is required." } },
        { status: 400 }
      );
    }

    const result = await sendUpcomingClassReminderWhatsApp({
      batchId,
      adminUserId: session.adminProfile.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "DISPATCH_FAILED", message: result.error || "Failed to dispatch reminders." } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: err.message || "An unexpected error occurred." } },
      { status: 500 }
    );
  }
}

