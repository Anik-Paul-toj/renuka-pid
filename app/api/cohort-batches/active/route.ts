import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBatchByCourseId } from "@/lib/batches-admin/service";

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

    const resolvedCourseId =
      targetCourseId || "11111111-1111-1111-1111-111111111111";
    const batchSchedule = await getBatchByCourseId(resolvedCourseId);

    if (!batchSchedule) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_ACTIVE_BATCH",
            message: "No active workshop batch is currently scheduled.",
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

    let courseData: any = targetCourse;
    if (!courseData && batchSchedule.courseId) {
      const { data: c } = await supabase
        .from("courses")
        .select(
          "id, title, slug, description, original_price_paise, offer_price_paise, currency, duration_minutes, is_active"
        )
        .eq("id", batchSchedule.courseId)
        .maybeSingle();
      courseData = c;
    }

    const isRegistrationClosed =
      !batchSchedule.isEnrollmentOpen ||
      batchSchedule.isExpired ||
      batchSchedule.isSoldOut;

    return NextResponse.json(
      {
        success: true,
        batch: {
          id: batchSchedule.id,
          courseId: batchSchedule.courseId,
          batchName: batchSchedule.batchName,
          startDate: batchSchedule.startDate,
          endDate: batchSchedule.endDate,
          lastRegistrationDate: batchSchedule.lastRegistrationDate,
          registrationClosesBeforeHours:
            batchSchedule.registrationClosesBeforeHours,
          calculatedClosingDateTimeFormatted:
            batchSchedule.calculatedClosingDateTimeFormatted,
          calculatedClosingTime: batchSchedule.calculatedClosingTime,
          startTime: batchSchedule.startTime,
          endTime: batchSchedule.endTime,
          timezone: batchSchedule.timezone || "Asia/Kolkata",
          totalSeats: batchSchedule.totalSeats,
          seatsBooked: batchSchedule.seatsBooked,
          seatsRemaining: batchSchedule.seatsRemaining,
          isEnrollmentOpen: batchSchedule.isEnrollmentOpen,
          isRegistrationClosed,
          isExpired: batchSchedule.isExpired,
          isSoldOut: batchSchedule.isSoldOut,
          formattedStartDate: batchSchedule.formattedStartDate,
          formattedLastRegistrationDate:
            batchSchedule.formattedLastRegistrationDate,
          formattedTiming: batchSchedule.formattedTiming,
          course: courseData
            ? {
                id: courseData.id,
                title: courseData.title,
                slug: courseData.slug,
                description: courseData.description,
                originalPricePaise: courseData.original_price_paise,
                offerPricePaise: courseData.offer_price_paise,
                originalPrice: Math.round(
                  courseData.original_price_paise / 100
                ),
                offerPrice: Math.round(courseData.offer_price_paise / 100),
                currency: courseData.currency,
                durationMinutes: courseData.duration_minutes,
                isActive: courseData.is_active,
              }
            : {
                id: batchSchedule.courseId,
                title: batchSchedule.courseTitle,
                slug: batchSchedule.courseSlug,
                originalPrice: 599,
                offerPrice: 99,
                currency: "INR",
              },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/cohort-batches/active error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error?.message || "Failed to retrieve active batch.",
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
