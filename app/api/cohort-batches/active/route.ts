import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get("courseSlug");
    const courseId = searchParams.get("courseId");

    let targetCourseId = courseId;
    let targetCourse: any = null;

    if (courseSlug) {
      const { data: c } = await supabase
        .from("courses")
        .select(
          "id, title, slug, description, original_price_paise, offer_price_paise, currency, duration_minutes, is_active"
        )
        .eq("slug", courseSlug)
        .maybeSingle();

      if (c) {
        targetCourse = c;
        targetCourseId = c.id;
      }
    }

    let batchQuery = supabase
      .from("cohort_batches")
      .select(
        "id, course_id, batch_name, start_date, end_date, start_time, end_time, timezone, total_seats, seats_booked, is_enrollment_open"
      )
      .eq("is_enrollment_open", true);

    if (targetCourseId) {
      batchQuery = batchQuery.eq("course_id", targetCourseId);
    }

    const { data: batches, error } = await batchQuery
      .order("start_date", { ascending: true })
      .limit(1);

    if (error || !batches || batches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_ACTIVE_BATCH",
            message: "No active workshop batch is currently open for enrollment.",
          },
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
          },
        }
      );
    }

    const batch = batches[0];
    const seatsRemaining = Math.max(0, batch.total_seats - batch.seats_booked);

    let courseData: any = targetCourse;
    if (!courseData && batch.course_id) {
      const { data: c } = await supabase
        .from("courses")
        .select(
          "id, title, slug, description, original_price_paise, offer_price_paise, currency, duration_minutes, is_active"
        )
        .eq("id", batch.course_id)
        .maybeSingle();
      courseData = c;
    }

    return NextResponse.json(
      {
        success: true,
        batch: {
          id: batch.id,
          courseId: batch.course_id,
          batchName: batch.batch_name,
          startDate: batch.start_date,
          endDate: batch.end_date,
          startTime: batch.start_time,
          endTime: batch.end_time,
          timezone: batch.timezone,
          totalSeats: batch.total_seats,
          seatsBooked: batch.seats_booked,
          seatsRemaining,
          isEnrollmentOpen: batch.is_enrollment_open,
          isSoldOut: seatsRemaining <= 0,
          course: courseData
            ? {
                id: courseData.id,
                title: courseData.title,
                slug: courseData.slug,
                description: courseData.description,
                originalPricePaise: courseData.original_price_paise,
                offerPricePaise: courseData.offer_price_paise,
                originalPrice: Math.round(courseData.original_price_paise / 100),
                offerPrice: Math.round(courseData.offer_price_paise / 100),
                currency: courseData.currency,
                durationMinutes: courseData.duration_minutes,
              }
            : null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve cohort batch information.",
        },
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  }
}
