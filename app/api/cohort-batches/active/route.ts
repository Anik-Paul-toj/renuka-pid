import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBatchByCourseId, getBatchById, getBatchesByCourseId } from "@/lib/batches-admin/service";
import { parseCourseDetails } from "@/lib/courses-admin/details";
import { isBatchDateAnnounced } from "@/lib/batches-admin/format";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get("courseSlug");
    const courseId = searchParams.get("courseId");
    const batchId = searchParams.get("batchId");

    let targetCourseId = courseId;
    let targetCourse: any = null;
    let batchSchedule: any = null;

    if (batchId) {
      batchSchedule = await getBatchById(batchId);
      if (batchSchedule?.courseId) {
        targetCourseId = batchSchedule.courseId;
      }
    }

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
      targetCourseId || (batchSchedule?.courseId ?? "11111111-1111-1111-1111-111111111111");

    if (!batchSchedule) {
      batchSchedule = await getBatchByCourseId(resolvedCourseId);
      // Fallback: If courseId was actually a batch ID
      if (!batchSchedule && courseId) {
        batchSchedule = await getBatchById(courseId);
      }
    }

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

    const courseDetails = courseData?.slug
      ? parseCourseDetails(courseData.slug, courseData.description)
      : null;

    const isMasterclass =
      courseData?.slug === "the-watercolour" ||
      courseData?.slug === "the-watercolour-roadmap" ||
      courseData?.id === "11111111-1111-1111-1111-111111111111" ||
      batchSchedule.courseSlug === "the-watercolour" ||
      batchSchedule.courseSlug === "the-watercolour-roadmap";

    const isFreeRegistration =
      isMasterclass &&
      (batchSchedule.registrationMode === "free" ||
        (batchSchedule as any)?.isFreeRegistration ||
        (courseDetails as any)?.batchSchedule?.registrationMode === "free" ||
        courseDetails?.registrationMode === "free" ||
        courseData?.offer_price_paise === 0);

    const effectiveOfferPricePaise = isFreeRegistration ? 0 : courseData?.offer_price_paise ?? 9900;
    const effectiveOfferPrice = isFreeRegistration ? 0 : Math.round(effectiveOfferPricePaise / 100);

    const isRegistrationClosed =
      !batchSchedule.isEnrollmentOpen ||
      batchSchedule.isExpired ||
      batchSchedule.isSoldOut;

    let availableBatches: any[] = [];
    try {
      const allCourseBatches = await getBatchesByCourseId(resolvedCourseId);
      availableBatches = allCourseBatches
        .filter((b) => isBatchDateAnnounced(b.startDate) && b.status !== "completed")
        .map((b) => ({
          id: b.id,
          batchName: b.batchName,
          startDate: b.startDate,
          endDate: b.endDate,
          startTime: b.startTime,
          endTime: b.endTime,
          totalSeats: b.totalSeats,
          seatsBooked: b.seatsBooked,
          seatsRemaining: b.seatsRemaining,
          isSoldOut: b.isSoldOut,
          isEnrollmentOpen: b.isEnrollmentOpen,
          formattedStartDate: b.formattedStartDate,
          formattedTiming: b.formattedTiming,
          lastRegistrationDate: b.lastRegistrationDate,
          formattedLastRegistrationDate: b.formattedLastRegistrationDate,
        }));
    } catch {
      availableBatches = [];
    }

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
          offerPrice: effectiveOfferPrice,
          offerPricePaise: effectiveOfferPricePaise,
          registrationMode: isFreeRegistration ? "free" : "paid",
          course: courseData
            ? {
                id: courseData.id,
                title: courseData.title,
                slug: courseData.slug,
                description: courseData.description,
                details: courseDetails,
                originalPricePaise: courseData.original_price_paise,
                offerPricePaise: effectiveOfferPricePaise,
                originalPrice: Math.round(
                  courseData.original_price_paise / 100
                ),
                offerPrice: effectiveOfferPrice,
                currency: courseData.currency,
                durationMinutes: courseData.duration_minutes,
                isActive: courseData.is_active,
                registrationMode: isFreeRegistration ? "free" : "paid",
              }
            : {
                id: batchSchedule.courseId,
                title: batchSchedule.courseTitle,
                slug: batchSchedule.courseSlug,
                originalPrice: 599,
                offerPrice: effectiveOfferPrice,
                currency: "INR",
                registrationMode: isFreeRegistration ? "free" : "paid",
              },
        },
        availableBatches,
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
