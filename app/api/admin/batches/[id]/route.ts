import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getBatchById, updateBatchSchedule } from "@/lib/batches-admin/service";
import { batchScheduleSchema } from "@/lib/validations/batch-schedule";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/batches/[id]
 * Retrieves scheduling details for a specific batch.
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

    const { id } = await params;
    const batch = await getBatchById(id);

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      batch,
    });
  } catch (error: any) {
    console.error("GET /api/admin/batches/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve batch." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/batches/[id]
 * Updates batch scheduling details (start date, registration deadline, timing, name, status).
 * Protected by admin authentication. Editors have read-only permissions.
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
            "Forbidden: Editors have read-only access and cannot modify batch schedules.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const validation = batchScheduleSchema.safeParse(body);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return NextResponse.json(
        {
          error: issue ? issue.message : "Validation failed.",
          fieldErrors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedBatch = await updateBatchSchedule(
      id,
      validation.data,
      session.user.email
    );

    return NextResponse.json({
      success: true,
      message: "Batch schedule updated successfully.",
      batch: updatedBatch,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/batches/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update batch schedule." },
      { status: 500 }
    );
  }
}
