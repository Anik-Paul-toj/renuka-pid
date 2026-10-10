import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  updateGalleryImage,
  deleteGalleryImage,
} from "@/lib/gallery/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/media/[id]
 * Update gallery image metadata, publication status, or display order.
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

    const updated = await updateGalleryImage(id, {
      title: body.title,
      altText: body.altText,
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : undefined,
      displayOrder: typeof body.displayOrder === "number" ? body.displayOrder : undefined,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/media/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update media item." },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/media/[id]
 * Delete gallery image from Cloudinary and database.
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
    await deleteGalleryImage(id);

    return NextResponse.json({ success: true, message: "Gallery asset deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/admin/media/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete media asset." },
      { status: 400 }
    );
  }
}
