import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { replaceGalleryImage } from "@/lib/gallery/service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/media/[id]/replace
 * Replace an existing gallery asset's image file in Cloudinary and update database.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "A valid replacement image file is required." },
        { status: 400 }
      );
    }

    const updated = await replaceGalleryImage(id, file);

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("POST /api/admin/media/[id]/replace error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to replace image." },
      { status: 400 }
    );
  }
}
