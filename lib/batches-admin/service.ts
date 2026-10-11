import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BatchScheduleInput,
  batchScheduleSchema,
  BatchStatus,
} from "@/lib/validations/batch-schedule";
import {
  formatBatchDateIST,
  formatBatchTimeIST,
  isRegistrationDeadlineExpired,
} from "./format";
import { parseCourseDetails, COURSE_IMAGES } from "@/lib/courses-admin/details";

export interface SafeBatchScheduleData {
  id: string;
  courseId: string;
  courseTitle?: string;
  courseSlug?: string;
  batchName: string;
  startDate: string;
  endDate: string | null;
  lastRegistrationDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  totalSeats: number;
  seatsBooked: number;
  seatsRemaining: number;
  isEnrollmentOpen: boolean;
  status: BatchStatus;
  isExpired: boolean;
  isSoldOut: boolean;
  formattedStartDate: string;
  formattedLastRegistrationDate: string;
  formattedTiming: string;
  coverImageUrl?: string;
  coverImagePublicId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper to safely extract batch from database with column fallback resilience (e.g. PGRST204 / 42703)
 */
export async function getBatchByCourseId(
  courseId: string
): Promise<SafeBatchScheduleData | null> {
  const supabase = createAdminClient();

  // 1. Try querying with last_registration_date included
  let batchData: any = null;
  const { data: primaryData, error: primaryErr } = await supabase
    .from("cohort_batches")
    .select(
      `
      id,
      course_id,
      batch_name,
      start_date,
      end_date,
      last_registration_date,
      start_time,
      end_time,
      timezone,
      total_seats,
      seats_booked,
      is_enrollment_open,
      created_at,
      updated_at,
      courses (
        id,
        title,
        slug,
        description
      )
    `
    )
    .eq("course_id", courseId)
    .order("start_date", { ascending: true })
    .limit(1);

  if (!primaryErr && primaryData && primaryData.length > 0) {
    batchData = primaryData[0];
  } else if (
    primaryErr &&
    (primaryErr.code === "42703" || primaryErr.message?.includes("last_registration_date"))
  ) {
    // Column last_registration_date not yet added in DB, query without it
    const { data: fallbackData } = await supabase
      .from("cohort_batches")
      .select(
        `
        id,
        course_id,
        batch_name,
        start_date,
        end_date,
        start_time,
        end_time,
        timezone,
        total_seats,
        seats_booked,
        is_enrollment_open,
        created_at,
        updated_at,
        courses (
          id,
          title,
          slug,
          description
        )
      `
      )
      .eq("course_id", courseId)
      .order("start_date", { ascending: true })
      .limit(1);

    if (fallbackData && fallbackData.length > 0) {
      batchData = fallbackData[0];
    }
  }

  if (!batchData) {
    return null;
  }

  const course = batchData.courses;
  const courseDetails = course?.slug
    ? parseCourseDetails(course.slug, course.description)
    : null;

  // Derive lastRegistrationDate with priority: DB column > metadata fallback > startDate
  const fallbackMetaDeadline =
    (courseDetails as any)?.batchSchedule?.lastRegistrationDate;
  const lastRegistrationDate =
    batchData.last_registration_date || fallbackMetaDeadline || batchData.start_date;

  const seatsRemaining = Math.max(0, batchData.total_seats - batchData.seats_booked);
  const isSoldOut = seatsRemaining <= 0;
  const isExpired = isRegistrationDeadlineExpired(lastRegistrationDate);

  // Derive batch status
  let status: BatchStatus = "open";
  if (!batchData.is_enrollment_open) {
    status = "closed";
  } else if (isExpired || isSoldOut) {
    status = "closed";
  }

  const coverImageUrl =
    batchData.cover_image_url ||
    (course as any)?.cover_image_url ||
    courseDetails?.coverImage ||
    (course?.slug ? COURSE_IMAGES[course.slug] : "/images/foundation.jpeg");

  const coverImagePublicId =
    batchData.cover_image_public_id ||
    (course as any)?.cover_image_public_id ||
    courseDetails?.coverImagePublicId ||
    null;

  return {
    id: batchData.id,
    courseId: batchData.course_id,
    courseTitle: course?.title,
    courseSlug: course?.slug,
    batchName: batchData.batch_name,
    startDate: batchData.start_date,
    endDate: batchData.end_date,
    lastRegistrationDate,
    startTime: batchData.start_time,
    endTime: batchData.end_time,
    timezone: batchData.timezone || "Asia/Kolkata",
    totalSeats: batchData.total_seats,
    seatsBooked: batchData.seats_booked,
    seatsRemaining,
    isEnrollmentOpen: batchData.is_enrollment_open && !isExpired && !isSoldOut,
    status,
    isExpired,
    isSoldOut,
    formattedStartDate: formatBatchDateIST(batchData.start_date),
    formattedLastRegistrationDate: formatBatchDateIST(lastRegistrationDate),
    formattedTiming: formatBatchTimeIST(batchData.start_time, batchData.end_time),
    coverImageUrl,
    coverImagePublicId,
    createdAt: batchData.created_at,
    updatedAt: batchData.updated_at,
  };
}

/**
 * Retrieves a single batch by ID with course info.
 */
export async function getBatchById(batchId: string): Promise<SafeBatchScheduleData | null> {
  const supabase = createAdminClient();

  let batchData: any = null;
  const { data: primaryData, error: primaryErr } = await supabase
    .from("cohort_batches")
    .select(
      `
      id,
      course_id,
      batch_name,
      start_date,
      end_date,
      last_registration_date,
      start_time,
      end_time,
      timezone,
      total_seats,
      seats_booked,
      is_enrollment_open,
      created_at,
      updated_at,
      courses (
        id,
        title,
        slug,
        description
      )
    `
    )
    .eq("id", batchId)
    .maybeSingle();

  if (!primaryErr && primaryData) {
    batchData = primaryData;
  } else if (
    primaryErr &&
    (primaryErr.code === "42703" || primaryErr.message?.includes("last_registration_date"))
  ) {
    const { data: fallbackData } = await supabase
      .from("cohort_batches")
      .select(
        `
        id,
        course_id,
        batch_name,
        start_date,
        end_date,
        start_time,
        end_time,
        timezone,
        total_seats,
        seats_booked,
        is_enrollment_open,
        created_at,
        updated_at,
        courses (
          id,
          title,
          slug,
          description
        )
      `
      )
      .eq("id", batchId)
      .maybeSingle();

    batchData = fallbackData;
  }

  if (!batchData) return null;

  const course = batchData.courses;
  const courseDetails = course?.slug
    ? parseCourseDetails(course.slug, course.description)
    : null;

  const fallbackMetaDeadline =
    (courseDetails as any)?.batchSchedule?.lastRegistrationDate;
  const lastRegistrationDate =
    batchData.last_registration_date || fallbackMetaDeadline || batchData.start_date;

  const seatsRemaining = Math.max(0, batchData.total_seats - batchData.seats_booked);
  const isSoldOut = seatsRemaining <= 0;
  const isExpired = isRegistrationDeadlineExpired(lastRegistrationDate);

  let status: BatchStatus = "open";
  if (!batchData.is_enrollment_open) {
    status = "closed";
  } else if (isExpired || isSoldOut) {
    status = "closed";
  }

  const coverImageUrl =
    batchData.cover_image_url ||
    (course as any)?.cover_image_url ||
    courseDetails?.coverImage ||
    (course?.slug ? COURSE_IMAGES[course.slug] : "/images/foundation.jpeg");

  const coverImagePublicId =
    batchData.cover_image_public_id ||
    (course as any)?.cover_image_public_id ||
    courseDetails?.coverImagePublicId ||
    null;

  return {
    id: batchData.id,
    courseId: batchData.course_id,
    courseTitle: course?.title,
    courseSlug: course?.slug,
    batchName: batchData.batch_name,
    startDate: batchData.start_date,
    endDate: batchData.end_date,
    lastRegistrationDate,
    startTime: batchData.start_time,
    endTime: batchData.end_time,
    timezone: batchData.timezone || "Asia/Kolkata",
    totalSeats: batchData.total_seats,
    seatsBooked: batchData.seats_booked,
    seatsRemaining,
    isEnrollmentOpen: batchData.is_enrollment_open && !isExpired && !isSoldOut,
    status,
    isExpired,
    isSoldOut,
    formattedStartDate: formatBatchDateIST(batchData.start_date),
    formattedLastRegistrationDate: formatBatchDateIST(lastRegistrationDate),
    formattedTiming: formatBatchTimeIST(batchData.start_time, batchData.end_time),
    coverImageUrl,
    coverImagePublicId,
    createdAt: batchData.created_at,
    updatedAt: batchData.updated_at,
  };
}

/**
 * Updates batch scheduling details safely with server-side validation and DB fallback.
 */
export async function updateBatchSchedule(
  batchId: string,
  rawInput: BatchScheduleInput,
  _updatedByEmail: string
): Promise<SafeBatchScheduleData> {
  const supabase = createAdminClient();

  // Server-side Zod validation
  const validation = batchScheduleSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    throw new Error(firstIssue?.message || "Invalid batch schedule input.");
  }
  const input = validation.data;

  // Determine is_enrollment_open
  const isEnrollmentOpen = input.status === "open" || input.status === "upcoming";
  const nowIso = new Date().toISOString();

  // Attempt 1: Update with last_registration_date
  let updateErr: any = null;
  let updatedRow: any = null;

  const fullUpdatePayload: any = {
    batch_name: input.batchName,
    start_date: input.startDate,
    end_date: input.endDate || null,
    start_time: input.startTime,
    end_time: input.endTime || null,
    last_registration_date: input.lastRegistrationDate,
    is_enrollment_open: isEnrollmentOpen,
    updated_at: nowIso,
  };

  if (input.totalSeats && input.totalSeats > 0) {
    fullUpdatePayload.total_seats = input.totalSeats;
  }

  const { data: res1, error: err1 } = await supabase
    .from("cohort_batches")
    .update(fullUpdatePayload)
    .eq("id", batchId)
    .select(`*, courses (id, title, slug, description)`)
    .single();

  if (err1 && (err1.code === "42703" || err1.message?.includes("last_registration_date"))) {
    // Column last_registration_date is not yet present on table; update without it
    delete fullUpdatePayload.last_registration_date;
    const { data: res2, error: err2 } = await supabase
      .from("cohort_batches")
      .update(fullUpdatePayload)
      .eq("id", batchId)
      .select(`*, courses (id, title, slug, description)`)
      .single();

    if (err2 || !res2) {
      throw new Error(`Failed to update batch: ${err2?.message || "Unknown error"}`);
    }
    updatedRow = res2;

    // Persist lastRegistrationDate safely in course description JSON so it is not lost
    try {
      const course = res2.courses;
      if (course) {
        const details = parseCourseDetails(course.slug, course.description);
        (details as any).batchSchedule = {
          lastRegistrationDate: input.lastRegistrationDate,
          batchName: input.batchName,
          status: input.status,
          updatedAt: nowIso,
        };
        await supabase
          .from("courses")
          .update({
            description: JSON.stringify(details),
            updated_at: nowIso,
          })
          .eq("id", course.id);
      }
    } catch (metaErr) {
      console.warn("Failed to save batch metadata in course JSON:", metaErr);
    }
  } else if (err1 || !res1) {
    throw new Error(`Failed to update batch: ${err1?.message || "Unknown error"}`);
  } else {
    updatedRow = res1;

    // Also sync to course details metadata for double certainty
    try {
      const course = res1.courses;
      if (course) {
        const details = parseCourseDetails(course.slug, course.description);
        (details as any).batchSchedule = {
          lastRegistrationDate: input.lastRegistrationDate,
          batchName: input.batchName,
          status: input.status,
          updatedAt: nowIso,
        };
        await supabase
          .from("courses")
          .update({
            description: JSON.stringify(details),
            updated_at: nowIso,
          })
          .eq("id", course.id);
      }
    } catch {
      // Ignore background sync warning
    }
  }

  // Revalidate public & admin paths so changes reflect immediately
  try {
    revalidatePath("/");
    revalidatePath("/course");
    revalidatePath("/course/watercolour-foundation");
    revalidatePath("/course/watercolour-artistry-foundation");
    if (updatedRow?.courses?.slug) {
      revalidatePath(`/course/${updatedRow.courses.slug}`);
    }
    revalidatePath("/api/cohort-batches/active");
    revalidatePath("/admin/courses");
    revalidatePath("/admin/batches");
  } catch (revalErr) {
    console.warn("Revalidation warning:", revalErr);
  }

  const seatsRemaining = Math.max(0, updatedRow.total_seats - updatedRow.seats_booked);
  const isSoldOut = seatsRemaining <= 0;
  const isExpired = isRegistrationDeadlineExpired(input.lastRegistrationDate);

  return {
    id: updatedRow.id,
    courseId: updatedRow.course_id,
    courseTitle: updatedRow.courses?.title,
    courseSlug: updatedRow.courses?.slug,
    batchName: updatedRow.batch_name,
    startDate: updatedRow.start_date,
    endDate: updatedRow.end_date,
    lastRegistrationDate: input.lastRegistrationDate,
    startTime: updatedRow.start_time,
    endTime: updatedRow.end_time,
    timezone: updatedRow.timezone || "Asia/Kolkata",
    totalSeats: updatedRow.total_seats,
    seatsBooked: updatedRow.seats_booked,
    seatsRemaining,
    isEnrollmentOpen: isEnrollmentOpen && !isExpired && !isSoldOut,
    status: input.status,
    isExpired,
    isSoldOut,
    formattedStartDate: formatBatchDateIST(updatedRow.start_date),
    formattedLastRegistrationDate: formatBatchDateIST(input.lastRegistrationDate),
    formattedTiming: formatBatchTimeIST(updatedRow.start_time, updatedRow.end_time),
    createdAt: updatedRow.created_at,
    updatedAt: updatedRow.updated_at,
  };
}
