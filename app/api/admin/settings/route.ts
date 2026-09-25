import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getSettings, updateSettings, getSystemStatus } from "@/lib/settings/service";
import { settingsSchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/settings
 * Retrieves active studio settings and read-only system integration status.
 * Requires active admin authentication.
 */
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    if (!session.adminProfile.is_active) {
      return NextResponse.json(
        { error: "Forbidden. Admin account is inactive." },
        { status: 403 }
      );
    }

    const settings = await getSettings();
    const systemStatus = getSystemStatus();

    return NextResponse.json({
      success: true,
      settings,
      systemStatus,
      role: session.adminProfile.role,
    });
  } catch (error: any) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve settings." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings
 * Updates studio and notification settings.
 * Only super_admin and admin roles are authorized to modify settings.
 * Editors are rejected with 403 Forbidden.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    if (!session.adminProfile.is_active) {
      return NextResponse.json(
        { error: "Forbidden. Admin account is inactive." },
        { status: 403 }
      );
    }

    // Role-based protection: only super_admin and admin can edit settings
    if (session.adminProfile.role === "editor") {
      return NextResponse.json(
        {
          error:
            "Forbidden: Editors have read-only access and cannot modify system settings.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = settingsSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = parseResult.error.flatten();
      const firstErrorMessage =
        Object.values(issues.fieldErrors)[0]?.[0] ||
        issues.formErrors[0] ||
        "Invalid settings submission.";

      return NextResponse.json(
        {
          error: firstErrorMessage,
          fieldErrors: issues.fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedSettings = await updateSettings(
      parseResult.data,
      session.adminProfile.email
    );

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: "Settings saved successfully.",
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Failed to save settings." },
      { status: 500 }
    );
  }
}
