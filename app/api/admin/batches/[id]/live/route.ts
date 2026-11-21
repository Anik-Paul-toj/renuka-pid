import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCourseDetails } from "@/lib/courses-admin/details";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/batches/[id]/live
 * Marks this batch as the one shown live on the website for its course.
 * Stored in the course details JSON (details.liveBatchId); no schema change needed.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }
    if (session.adminProfile.role === "editor") {
      return NextResponse.json({ error: "Editors cannot change the live batch." }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: batch } = await supabase
      .from("cohort_batches")
      .select("id, course_id")
      .eq("id", id)
      .maybeSingle();
    if (!batch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    const { data: course } = await supabase
      .from("courses")
      .select("id, slug, description")
      .eq("id", batch.course_id)
      .single();
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const details: any = parseCourseDetails(course.slug, course.description);
    details.liveBatchId = id;

    const { error } = await supabase
      .from("courses")
      .update({ description: JSON.stringify(details), updated_at: new Date().toISOString() })
      .eq("id", course.id);
    if (error) {
      return NextResponse.json({ error: "Failed to set live batch." }, { status: 500 });
    }

    revalidatePath("/");
    revalidatePath("/course");
    revalidatePath(`/course/${course.slug}`);

    return NextResponse.json({ success: true, liveBatchId: id });
  } catch (error: any) {
    console.error("POST /api/admin/batches/[id]/live error:", error);
    return NextResponse.json({ error: "Failed to set live batch." }, { status: 500 });
  }
}
