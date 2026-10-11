import { NextResponse } from "next/server";
import { getPublicVideoTestimonials } from "@/lib/testimonials/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/testimonials
 * Public endpoint to retrieve published student video testimonials.
 */
export async function GET() {
  try {
    const testimonials = await getPublicVideoTestimonials();

    return NextResponse.json(
      { success: true, testimonials },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/testimonials error:", error);
    return NextResponse.json(
      { error: "Failed to load public testimonials." },
      { status: 500 }
    );
  }
}
