import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getAdminCourses } from "@/lib/courses-admin/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/courses
 * Retrieves courses for admin management.
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

    const courses = await getAdminCourses();

    return NextResponse.json({
      success: true,
      courses,
      role: session.adminProfile.role,
    });
  } catch (error: any) {
    console.error("GET /api/admin/courses error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve courses." },
      { status: 500 }
    );
  }
}
