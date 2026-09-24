import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: batches, error } = await supabase
      .from("public_cohort_batches")
      .select("id, course_id, batch_name, start_date, end_date, start_time, end_time, timezone, total_seats, seats_booked, is_enrollment_open")
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
        { status: 404 }
      );
    }

    const batch = batches[0];
    const seatsRemaining = Math.max(0, batch.total_seats - batch.seats_booked);

    return NextResponse.json({
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
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve cohort batch information.",
        },
      },
      { status: 500 }
    );
  }
}
