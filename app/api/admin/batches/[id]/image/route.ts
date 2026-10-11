import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  uploadCourseCoverBuffer,
} from "@/lib/cloudinary/service";
import {
  updateCourseCoverImage,
  resetCourseCoverImage,
} from "@/lib/courses-admin/service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Resolves the course ID from either a course ID/slug or a batch ID.
 */
async function resolveCourseId(idOrSlug: string): Promise<string> {
  const adminClient = createAdminClient();

  // 1. Check if identifier is already a course ID or slug
  const { data: course } = await adminClient
    .from("courses")
    .select("id")
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle();

  if (course?.id) {
    return course.id;
  }

  // 2. Check if identifier is a batch ID
  const { data: batch } = await adminClient
    .from("cohort_batches")
    .select("course_id")
    .eq("id", idOrSlug)
    .maybeSingle();

  if (batch?.course_id) {
    return batch.course_id;
  }

  // 3. Fallback to passed identifier
  return idOrSlug;
}

/**
 * POST /api/admin/batches/[id]/image
 * Uploads a replacement course cover image to Cloudinary (folder: renuka-art-studio/course-covers)
 * and updates the corresponding course and batch record.
 */
export async function POST(
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

    if (!session.adminProfile.is_active || session.adminProfile.role === "editor") {
      return NextResponse.json(
        { error: "Forbidden. Admin privileges required to update course cover image." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const targetCourseId = await resolveCourseId(id);

    const formData = await request.formData();
    const file = formData.get("file") as any;

    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "A valid image file is required in the 'file' field." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported image format (${file.type}). Please upload a JPEG, PNG, WEBP, or AVIF image.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Image size exceeds the maximum limit of 10MB (${(
            file.size /
            (1024 * 1024)
          ).toFixed(1)}MB provided).`,
        },
        { status: 400 }
      );
    }

    // Convert file to Buffer and upload to Cloudinary course-covers folder
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadCourseCoverBuffer(
      buffer,
      file.name || "course-cover",
      file.type
    );

    // Save and revalidate
    const updateResult = await updateCourseCoverImage(
      targetCourseId,
      uploadResult.secureUrl,
      uploadResult.publicId
    );

    return NextResponse.json({
      success: true,
      coverImageUrl: updateResult.coverImageUrl,
      coverImagePublicId: updateResult.coverImagePublicId,
      message: "Course cover image uploaded and updated successfully via Cloudinary.",
    });
  } catch (error: any) {
    console.error("POST /api/admin/batches/[id]/image error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload course cover image." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/batches/[id]/image
 * Resets a course cover image back to default studio artwork.
 */
export async function DELETE(
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

    if (!session.adminProfile.is_active || session.adminProfile.role === "editor") {
      return NextResponse.json(
        { error: "Forbidden. Admin privileges required to reset course cover image." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const targetCourseId = await resolveCourseId(id);

    const result = await resetCourseCoverImage(targetCourseId);

    return NextResponse.json({
      success: true,
      coverImageUrl: result.coverImageUrl,
      message: "Course cover image reset to default studio artwork.",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/batches/[id]/image error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to reset course cover image." },
      { status: 500 }
    );
  }
}
