import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  getAdminGalleryImages,
  uploadGalleryImage,
} from "@/lib/gallery/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/media
 * Retrieve all gallery media assets for authenticated admin management.
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

    const items = await getAdminGalleryImages();
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("GET /api/admin/media error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load media assets." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/media
 * Upload a new image to Cloudinary and persist in media_assets.
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

    const formData = await request.formData();
    const file = formData.get("file") as any;

    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "A valid image file is required in the 'file' field." },
        { status: 400 }
      );
    }

    const title = (formData.get("title") as string) || "";
    const altText = (formData.get("altText") as string) || title;
    const isPublishedRaw = formData.get("isPublished");
    const isPublished = isPublishedRaw === null ? true : isPublishedRaw === "true" || isPublishedRaw === "1";
    const displayOrderRaw = formData.get("displayOrder");
    const displayOrder = displayOrderRaw ? parseInt(displayOrderRaw as string, 10) || 0 : 0;

    const item = await uploadGalleryImage(
      file,
      {
        title,
        altText,
        isPublished,
        displayOrder,
      },
      session.user.id
    );

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/media error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image." },
      { status: 400 }
    );
  }
}
