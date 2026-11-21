import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCourseDetails } from "@/lib/courses-admin/details";
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

/**
 * DELETE /api/admin/batches/[id]
 * Permanently deletes a batch that has no bookings. Batches with any booking
 * (including cancelled ones) are refused so booking and payment history stays intact.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }
    if (!session.adminProfile.is_active || session.adminProfile.role === "editor") {
      return NextResponse.json({ error: "Forbidden. Only administrators can delete batches." }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: batch } = await supabase
      .from("cohort_batches")
      .select("id, course_id, batch_name")
      .eq("id", id)
      .maybeSingle();
    if (!batch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const { count, error: countErr } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", id);
    if (countErr) {
      return NextResponse.json({ error: "Could not verify bookings for this batch." }, { status: 500 });
    }
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `This batch has ${count} booking${count === 1 ? "" : "s"} and cannot be deleted. Set its status to Closed or Completed instead.`,
        },
        { status: 409 }
      );
    }

    const { error: delErr } = await supabase.from("cohort_batches").delete().eq("id", id);
    if (delErr) {
      return NextResponse.json({ error: "Failed to delete batch." }, { status: 500 });
    }

    // Tidy course metadata: drop this batch's saved settings and the live pointer if it pointed here
    const { data: course } = await supabase
      .from("courses")
      .select("id, slug, description")
      .eq("id", batch.course_id)
      .maybeSingle();
    if (course) {
      try {
        const details: any = parseCourseDetails(course.slug, course.description);
        let changed = false;
        if (details.liveBatchId === id) {
          delete details.liveBatchId;
          changed = true;
        }
        if (details.batchSchedules && details.batchSchedules[id]) {
          delete details.batchSchedules[id];
          changed = true;
        }
        if (changed) {
          await supabase
            .from("courses")
            .update({ description: JSON.stringify(details), updated_at: new Date().toISOString() })
            .eq("id", course.id);
        }
      } catch {
        // metadata cleanup is best-effort
      }
      revalidatePath("/");
      revalidatePath("/course");
      revalidatePath(`/course/${course.slug}`);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("DELETE /api/admin/batches/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete batch." }, { status: 500 });
  }
}
