import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { getBatchByCourseId } from "@/lib/batches-admin/service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/batches
 * Retrieves batch schedules for admin panel.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (courseId) {
      const batch = await getBatchByCourseId(courseId);
      return NextResponse.json({
        success: true,
        batch,
      });
    }

    // Fetch batches for all active courses
    const supabase = createAdminClient();
    const { data: courses } = await supabase
      .from("courses")
      .select("id, slug, title")
      .in("slug", [
        "the-watercolour",
        "the-watercolour-roadmap",
        "watercolour-foundation",
        "watercolour-artistry-foundation",
      ])
      .order("created_at", { ascending: true });

    const batches = [];
    if (courses) {
      for (const c of courses) {
        const b = await getBatchByCourseId(c.id);
        if (b) batches.push(b);
      }
    }

    return NextResponse.json({
      success: true,
      batches,
    });
  } catch (error: any) {
    console.error("GET /api/admin/batches error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve batches." },
      { status: 500 }
    );
  }
}
