import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  uploadGalleryImageBuffer,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/cloudinary/service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/cms/image
 * Upload an image for a CMS section (e.g. hero instructor photo) and return its URL.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
    }
    if (!session.adminProfile.is_active) {
      return NextResponse.json({ error: "Forbidden. Admin account is inactive." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as any;
    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "A valid image file is required." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image format (${file.type}). Use JPEG, PNG, WEBP, or AVIF.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image must be 10MB or smaller." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadGalleryImageBuffer(buffer, file.name || "cms-image", file.type);
    return NextResponse.json({ success: true, url: result.secureUrl });
  } catch (error: any) {
    console.error("POST /api/admin/cms/image error:", error);
    return NextResponse.json({ error: error?.message || "Failed to upload image." }, { status: 500 });
  }
}
