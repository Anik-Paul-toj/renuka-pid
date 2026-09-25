import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getStudentById } from "@/lib/students/service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate Admin Session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access student details.",
          },
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Student ID parameter is required.",
          },
        },
        { status: 400 }
      );
    }

    // 2. Query Student Detail
    const result = await getStudentById(id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.statusCode === 404 ? "STUDENT_NOT_FOUND" : "DB_ERROR",
            message: result.error,
          },
        },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /api/admin/students/[id] unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching student details.",
        },
      },
      { status: 500 }
    );
  }
}
