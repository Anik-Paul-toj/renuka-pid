import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getAdminVideoTestimonials,
  createVideoTestimonial,
} from "@/lib/testimonials/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/testimonials
 * Retrieve all testimonials for authenticated admin users.
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

    const data = await getAdminVideoTestimonials();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("GET /api/admin/testimonials error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load testimonials." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/testimonials
 * Create a new student video testimonial.
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

    if (!session.adminProfile.is_active) {
      return NextResponse.json(
        { error: "Forbidden. Admin account is inactive." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { studentName, description, youtubeUrl, courseName, displayOrder, isPublished } = body;

    const testimonial = await createVideoTestimonial({
      studentName,
      description,
      youtubeUrl,
      courseName,
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    });

    return NextResponse.json({ success: true, testimonial }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/testimonials error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create video testimonial." },
      { status: 400 }
    );
  }
}
