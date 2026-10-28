import React from "react";
import { getPublicLandingContent } from "@/lib/cms/public-loader";
import { LandingPageClient } from "@/components/LandingPageClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicGalleryImages } from "@/lib/gallery/service";
import { getPublicVideoTestimonials } from "@/lib/testimonials/service";
import { isRegistrationDeadlineExpired } from "@/lib/batches-admin/format";

export const dynamic = "force-dynamic";

async function getActivePublicMasterclassBatch(courseId?: string) {
  if (!courseId) return null;
  try {
    const supabase = createAdminClient();

    let batches: any[] | null = null;
    const { data, error } = await supabase
      .from("cohort_batches")
      .select(
        "id, course_id, batch_name, start_date, end_date, last_registration_date, start_time, end_time, timezone, total_seats, seats_booked, is_enrollment_open"
      )
      .eq("course_id", courseId)
      .eq("is_enrollment_open", true)
      .order("start_date", { ascending: true })
      .limit(1);

    if (error && (error.code === "42703" || error.message?.includes("last_registration_date"))) {
      const { data: fallbackData } = await supabase
        .from("cohort_batches")
        .select(
          "id, course_id, batch_name, start_date, end_date, start_time, end_time, timezone, total_seats, seats_booked, is_enrollment_open"
        )
        .eq("course_id", courseId)
        .eq("is_enrollment_open", true)
        .order("start_date", { ascending: true })
        .limit(1);
      batches = fallbackData;
    } else {
      batches = data;
    }

    if (!batches || batches.length === 0) return null;

    const b = batches[0];
    const seatsRemaining = Math.max(0, b.total_seats - b.seats_booked);
    const isSoldOut = seatsRemaining <= 0;
    const effectiveDeadline = b.last_registration_date || b.start_date;
    const isExpired = isRegistrationDeadlineExpired(effectiveDeadline, new Date(), {
      startDate: b.start_date,
      startTime: b.start_time,
    });
    const isRegistrationClosed = !b.is_enrollment_open || isExpired || isSoldOut;

    return {
      id: b.id,
      courseId: b.course_id,
      batchName: b.batch_name,
      startDate: b.start_date,
      endDate: b.end_date,
      lastRegistrationDate: effectiveDeadline,
      startTime: b.start_time,
      endTime: b.end_time,
      timezone: b.timezone || "Asia/Kolkata",
      totalSeats: b.total_seats,
      seatsBooked: b.seats_booked,
      seatsRemaining,
      isSoldOut,
      isEnrollmentOpen: Boolean(b.is_enrollment_open),
      isExpired,
      isRegistrationClosed,
    };
  } catch {
    return null;
  }
}

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

  const activeBatch = activeCourse
    ? await getActivePublicMasterclassBatch(activeCourse.id)
    : null;

  return (
    <LandingPageClient
      content={content}
      initialCourse={activeCourse}
      initialBatch={activeBatch}
      initialGalleryImages={galleryImages}
      initialTestimonials={testimonials}
    />
  );
}
