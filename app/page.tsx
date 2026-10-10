import React from "react";
import { getPublicLandingContent } from "@/lib/cms/public-loader";
import { LandingPageClient } from "@/components/LandingPageClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicGalleryImages } from "@/lib/gallery/service";

export const dynamic = "force-dynamic";

async function getActivePublicCourse() {
  try {
    const supabase = createAdminClient();
    const { data: course } = await supabase
      .from("courses")
      .select("id, title, original_price_paise, offer_price_paise, duration_minutes")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!course) return null;

    return {
      originalPrice: Math.round(course.original_price_paise / 100),
      offerPrice: Math.round(course.offer_price_paise / 100),
      durationMinutes: course.duration_minutes,
    };
  } catch {
    return null;
  }
}

export default async function MasterclassLandingPage() {
  const [content, activeCourse, galleryImages] = await Promise.all([
    getPublicLandingContent(),
    getActivePublicCourse(),
    getPublicGalleryImages(),
  ]);

  return (
    <LandingPageClient
      content={content}
      initialCourse={activeCourse}
      initialGalleryImages={galleryImages}
    />
  );
}
