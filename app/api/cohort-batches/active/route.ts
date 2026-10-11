import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formatBatchDateIST,
  formatBatchTimeIST,
  isRegistrationDeadlineExpired,
} from "@/lib/batches-admin/format";
import { parseCourseDetails } from "@/lib/courses-admin/service";

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

    // Try selecting with last_registration_date first
    let batches: any[] | null = null;
    let { data: bData, error: bErr } = await supabase
      .from("cohort_batches")
      .select(
        "id, course_id, batch_name, start_date, end_date, last_registration_date, start_time, end_time, timezone, total_seats, seats_booked, is_enrollment_open"
      )
      .eq("is_enrollment_open", true)
      .order("start_date", { ascending: true })
      .limit(10);

    if (bErr && (bErr.code === "42703" || bErr.message?.includes("last_registration_date"))) {
      const { data: fallbackData } = await supabase
        .from("cohort_batches")
        .select(
          "id, course_id, batch_name, start_date, end_date, start_time, end_time, timezone, total_seats, seats_booked, is_enrollment_open"
        )
        .eq("is_enrollment_open", true)
        .order("start_date", { ascending: true })
        .limit(10);
      batches = fallbackData;
    } else {
      batches = bData;
    }

    if (targetCourseId && batches) {
      batches = batches.filter((b) => b.course_id === targetCourseId);
    }

    if (!batches || batches.length === 0) {
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
    const isSoldOut = seatsRemaining <= 0;

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

    const courseDetails = courseData?.slug
      ? parseCourseDetails(courseData.slug, courseData.description)
      : null;
    const fallbackMetaDeadline = (courseDetails as any)?.batchSchedule?.lastRegistrationDate;
    const lastRegistrationDate =
      batch.last_registration_date || fallbackMetaDeadline || batch.start_date;

    const isExpired = isRegistrationDeadlineExpired(lastRegistrationDate);
    const isRegistrationClosed = !batch.is_enrollment_open || isExpired || isSoldOut;

    return NextResponse.json(
      {
        success: true,
        batch: {
          id: batch.id,
          courseId: batch.course_id,
          batchName: batch.batch_name,
          startDate: batch.start_date,
          endDate: batch.end_date,
          lastRegistrationDate,
          startTime: batch.start_time,
          endTime: batch.end_time,
          timezone: batch.timezone || "Asia/Kolkata",
          totalSeats: batch.total_seats,
          seatsBooked: batch.seats_booked,
          seatsRemaining,
          isEnrollmentOpen: batch.is_enrollment_open && !isExpired && !isSoldOut,
          isRegistrationClosed,
          isExpired,
          isSoldOut,
          formattedStartDate: formatBatchDateIST(batch.start_date),
          formattedLastRegistrationDate: formatBatchDateIST(lastRegistrationDate),
          formattedTiming: formatBatchTimeIST(batch.start_time, batch.end_time),
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
    console.error("API /api/cohort-batches/active error:", err);
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
