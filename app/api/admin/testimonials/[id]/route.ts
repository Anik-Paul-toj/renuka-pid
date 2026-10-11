import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  updateVideoTestimonial,
  deleteVideoTestimonial,
} from "@/lib/testimonials/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/testimonials/[id]
 * Update testimonial details, publication status, or order.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json().catch(() => ({}));

    const updated = await updateVideoTestimonial(id, {
      studentName: body.studentName,
      description: body.description,
      youtubeUrl: body.youtubeUrl,
      courseName: body.courseName,
      displayOrder: typeof body.displayOrder === "number" ? body.displayOrder : undefined,
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : undefined,
    });

    return NextResponse.json({ success: true, testimonial: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/testimonials/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update testimonial." },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/testimonials/[id]
 * Delete a video testimonial permanently.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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
    await deleteVideoTestimonial(id);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/admin/testimonials/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete testimonial." },
      { status: 400 }
    );
  }
}
