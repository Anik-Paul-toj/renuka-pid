import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getAdminCourseById,
  updateAdminCourse,
} from "@/lib/courses-admin/service";
import { courseUpdateSchema } from "@/lib/validations/course-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/courses/[id]
 * Retrieves details for a specific course.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const course = await getAdminCourseById(id);

    if (!course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      course,
    });
  } catch (error: any) {
    console.error("GET /api/admin/courses/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve course." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/courses/[id]
 * Updates course details, including title, slug, duration, and authoritative pricing in paise.
 * Only super_admin and admin roles can modify courses.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (session.adminProfile.role === "editor") {
      return NextResponse.json(
        {
          error:
            "Forbidden: Editors have read-only access and cannot modify course settings.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await getAdminCourseById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parseResult = courseUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      const issues = parseResult.error.flatten();
      const firstErrorMessage =
        Object.values(issues.fieldErrors)[0]?.[0] ||
        issues.formErrors[0] ||
        "Invalid course data.";

      return NextResponse.json(
        {
          error: firstErrorMessage,
          fieldErrors: issues.fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedCourse = await updateAdminCourse(
      id,
      parseResult.data,
      session.adminProfile.email
    );

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      message: "Course updated successfully.",
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/courses/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update course." },
      { status: 500 }
    );
  }
}
