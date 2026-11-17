import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getBatchByCourseId,
  getBatchesByCourseId,
  createBatch,
} from "@/lib/batches-admin/service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/batches
 * Retrieves batch schedules for admin panel.
 * Supports courseId (single active or all batches via ?all=true)
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
    const all = searchParams.get("all") === "true";

    if (courseId) {
      if (all) {
        const batches = await getBatchesByCourseId(courseId);
        return NextResponse.json({
          success: true,
          batches,
        });
      }
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
        if (all) {
          const courseBatches = await getBatchesByCourseId(c.id);
          batches.push(...courseBatches);
        } else {
          const b = await getBatchByCourseId(c.id);
          if (b) batches.push(b);
        }
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

/**
 * POST /api/admin/batches
 * Creates a brand new batch for a course with its own independent capacity.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.courseId) {
      return NextResponse.json(
        { error: "Course ID and batch details are required." },
        { status: 400 }
      );
    }

    const createdBatch = await createBatch(
      body.courseId,
      body,
      session.adminProfile?.email || "admin@renukaartstudio.com"
    );

    return NextResponse.json({
      success: true,
      batch: createdBatch,
    });
  } catch (error: any) {
    console.error("POST /api/admin/batches error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create batch." },
      { status: 400 }
    );
  }
}
