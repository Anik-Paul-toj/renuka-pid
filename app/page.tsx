import React from "react";
import { getPublicLandingContent } from "@/lib/cms/public-loader";
import { LandingPageClient } from "@/components/LandingPageClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicGalleryImages } from "@/lib/gallery/service";
import { getPublicVideoTestimonials } from "@/lib/testimonials/service";

export const dynamic = "force-dynamic";

async function getActivePublicCourse() {
  try {
    const supabase = createAdminClient();

    // 1. Authoritatively fetch the landing page Masterclass course by slug
    const { data: masterclassCourse } = await supabase
      .from("courses")
      .select("id, title, slug, original_price_paise, offer_price_paise, duration_minutes")
      .in("slug", ["the-watercolour", "the-watercolour-roadmap"])
      .eq("is_active", true)
      .maybeSingle();

    if (masterclassCourse) {
      return {
        id: masterclassCourse.id,
        title: masterclassCourse.title,
        slug: masterclassCourse.slug,
        originalPrice: Math.round(masterclassCourse.original_price_paise / 100),
        offerPrice: Math.round(masterclassCourse.offer_price_paise / 100),
        durationMinutes: masterclassCourse.duration_minutes,
      };
    }

    // 2. Fallback: Find active batch associated with the masterclass
    const { data: batches } = await supabase
      .from("cohort_batches")
      .select(`
        id,
        course_id,
        courses (
          id,
          title,
          slug,
          original_price_paise,
          offer_price_paise,
          duration_minutes,
          is_active
        )
      `)
      .eq("is_enrollment_open", true)
      .order("start_date", { ascending: true })
      .limit(10);

    const masterclassBatch =
      batches?.find(
        (b: any) =>
          b.courses?.slug === "the-watercolour" ||
          b.courses?.slug === "the-watercolour-roadmap"
      ) || batches?.[0];

    const course = (masterclassBatch as any)?.courses;
    if (course && course.is_active) {
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        originalPrice: Math.round(course.original_price_paise / 100),
        offerPrice: Math.round(course.offer_price_paise / 100),
        durationMinutes: course.duration_minutes,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export default async function MasterclassLandingPage() {
  const [content, activeCourse, galleryImages, testimonials] = await Promise.all([
    getPublicLandingContent(),
    getActivePublicCourse(),
    getPublicGalleryImages(),
    getPublicVideoTestimonials(),
  ]);

  return (
    <LandingPageClient
      content={content}
      initialCourse={activeCourse}
      initialGalleryImages={galleryImages}
      initialTestimonials={testimonials}
    />
  );
}
