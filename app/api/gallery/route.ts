import { NextResponse } from "next/server";
import { getPublicGalleryImages } from "@/lib/gallery/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/gallery
 * Public endpoint to retrieve published gallery items with CDN-optimized URLs.
 */
export async function GET() {
  try {
    const images = await getPublicGalleryImages();

    return NextResponse.json(
      { success: true, images },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/gallery error:", error);
    return NextResponse.json(
      { error: "Failed to load public gallery images." },
      { status: 500 }
    );
  }
}
