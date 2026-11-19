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
  isBatchDateAnnounced,
  calculateRegistrationClosingDateTime,
  getTodayISTString,
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
  registrationClosesBeforeHours?: number;
  calculatedClosingDateTimeFormatted?: string;
  calculatedClosingTime?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  totalSeats: number;
  seatsBooked: number;
  seatsRemaining: number;
  isEnrollmentOpen: boolean;
  status: BatchStatus;
  registrationMode?: "paid" | "free";
  isFreeRegistration?: boolean;
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
 * Formats a raw database batch row into SafeBatchScheduleData.
 * Respects TBA status, completed status, date announcement rules, and date-specific inventory.
 */
export function formatBatchRecord(batchData: any): SafeBatchScheduleData {
  const course = batchData.courses;
  const courseDetails = course?.slug
    ? parseCourseDetails(course.slug, course.description)
    : null;

  // Retrieve batch-specific metadata if stored by batch ID; fallback to course level only for single legacy batch
  const batchMeta =
    (courseDetails as any)?.batchSchedules?.[batchData.id] ||
    (courseDetails as any)?.batchSchedule;

  const registrationClosesBeforeHours =
    batchData.registration_closes_before_hours ??
    batchMeta?.registrationClosesBeforeHours ??
    2;

  const closing = calculateRegistrationClosingDateTime(
    batchData.start_date,
    batchData.start_time,
    registrationClosesBeforeHours
  );

  const lastRegistrationDate =
    batchData.last_registration_date ||
    closing?.closingDateStr ||
    batchData.start_date ||
    batchMeta?.lastRegistrationDate;

  const seatsRemaining = Math.max(0, batchData.total_seats - batchData.seats_booked);
  const isSoldOut = seatsRemaining <= 0;
  const isExpired = isRegistrationDeadlineExpired(lastRegistrationDate, new Date(), {
    startDate: batchData.start_date,
    startTime: batchData.start_time,
    registrationClosesBeforeHours,
  });

  const dateAnnounced = isBatchDateAnnounced(batchData.start_date);

  // Check explicit admin status saved in course description metadata for this specific batch
  const explicitStatus: BatchStatus | undefined =
    (courseDetails as any)?.batchSchedules?.[batchData.id]?.status ||
    ((courseDetails as any)?.batchSchedule?.id === batchData.id || !(courseDetails as any)?.batchSchedules
      ? (courseDetails as any)?.batchSchedule?.status
      : undefined);

  const isTba =
    explicitStatus === "tba" ||
    !dateAnnounced ||
    batchData.start_date === "2099-12-31" ||
    batchData.start_date === "TBA";

  // Per-batch status derivation: strictly isolated to this batch record
  let status: BatchStatus = "open";
  if (isTba) {
    status = "tba";
  } else if (explicitStatus === "completed") {
    status = "completed";
  } else if (explicitStatus === "closed") {
    status = "closed";
  } else if (explicitStatus === "upcoming") {
    status = "upcoming";
  } else if (!batchData.is_enrollment_open) {
    const today = getTodayISTString();
    if (batchData.start_date < today) {
      status = "completed";
    } else {
      status = "closed";
    }
  } else if (isExpired || isSoldOut) {
    status = "closed";
  } else {
    status = "open";
  }

  // Enrollment is open ONLY if explicitly open, date announced, not TBA, not completed, not expired, not sold out
  const isEnrollmentOpen =
    status === "open" &&
    Boolean(batchData.is_enrollment_open) &&
    !isTba &&
    !isExpired &&
    !isSoldOut;

  const isWorkshop =
    course?.slug === "the-watercolour" ||
    course?.slug === "the-watercolour-roadmap";

  const registrationMode: "paid" | "free" =
    (courseDetails as any)?.batchSchedules?.[batchData.id]?.registrationMode ||
    (courseDetails as any)?.batchSchedule?.registrationMode ||
    (courseDetails as any)?.registrationMode ||
    "paid";

  const isFreeRegistration = isWorkshop && registrationMode === "free";

  const coverImageUrl =
    batchData.cover_image_url ||
    (course as any)?.cover_image_url ||
    courseDetails?.coverImage ||
    (course?.slug && COURSE_IMAGES[course.slug]) ||
    (isWorkshop ? null : "/images/foundation.jpeg");

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
    startDate: isTba ? "TBA" : batchData.start_date,
    endDate: isTba ? null : batchData.end_date,
    lastRegistrationDate: isTba ? "" : lastRegistrationDate,
    registrationClosesBeforeHours: isTba ? undefined : registrationClosesBeforeHours,
    calculatedClosingDateTimeFormatted: isTba ? undefined : closing?.closingDateTimeFormatted,
    calculatedClosingTime: isTba ? undefined : closing?.closingTimeStr,
    startTime: isTba ? "" : batchData.start_time,
    endTime: isTba ? "" : batchData.end_time,
    timezone: batchData.timezone || "Asia/Kolkata",
    totalSeats: batchData.total_seats,
    seatsBooked: batchData.seats_booked,
    seatsRemaining,
    isEnrollmentOpen,
    status,
    registrationMode,
    isFreeRegistration,
    isExpired: isTba ? false : isExpired,
    isSoldOut,
    formattedStartDate: isTba ? "To Be Announced" : formatBatchDateIST(batchData.start_date),
    formattedLastRegistrationDate: isTba ? "" : formatBatchDateIST(lastRegistrationDate),
    formattedTiming: isTba ? "" : formatBatchTimeIST(batchData.start_time, batchData.end_time),
    coverImageUrl,
    coverImagePublicId,
    createdAt: batchData.created_at,
    updatedAt: batchData.updated_at,
  };
}

/**
 * Helper to safely extract batch from database with column fallback resilience (e.g. PGRST204 / 42703)
 */
export async function getBatchByCourseId(
  courseId: string
): Promise<SafeBatchScheduleData | null> {
  const supabase = createAdminClient();

  // 1. Try querying with last_registration_date and registration_closes_before_hours included
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
      registration_closes_before_hours,
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
    .order("start_date", { ascending: true });

  let rawList: any[] = [];

  if (!primaryErr && primaryData && primaryData.length > 0) {
    rawList = primaryData;
  } else if (
    primaryErr &&
    (primaryErr.code === "42703" ||
      primaryErr.message?.includes("last_registration_date") ||
      primaryErr.message?.includes("registration_closes_before_hours"))
  ) {
    // Columns not yet added in DB, query safe core columns
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
      .order("start_date", { ascending: true });

    if (fallbackData && fallbackData.length > 0) {
      rawList = fallbackData;
    }
  }

  if (rawList.length === 0) {
    return null;
  }

  // Canonical Batch Resolution:
  // 1. Prioritize open, unexpired batches starting on or after today (Asia/Kolkata)
  // 2. Otherwise pick any open batch
  // 3. Otherwise pick the most recently scheduled / updated batch (never an ancient past batch)
  const today = getTodayISTString();
  const openBatches = rawList.filter((b: any) => b.is_enrollment_open);
  const upcomingOpen = openBatches.filter(
    (b: any) => isBatchDateAnnounced(b.start_date) && b.start_date >= today
  );

  if (upcomingOpen.length > 0) {
    batchData = upcomingOpen[0];
  } else if (openBatches.length > 0) {
    batchData = openBatches[0];
  } else {
    const sortedByLatest = [...rawList].sort((a: any, b: any) =>
      (b.updated_at || b.created_at || b.start_date || "").localeCompare(
        a.updated_at || a.created_at || a.start_date || ""
      )
    );
    batchData = sortedByLatest[0];
  }

  return formatBatchRecord(batchData);
}

/**
 * Retrieves all batches for a specific course (maintaining date-specific capacity).
 */
export async function getBatchesByCourseId(
  courseId: string
): Promise<SafeBatchScheduleData[]> {
  const supabase = createAdminClient();

  let batchesData: any[] = [];
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
      registration_closes_before_hours,
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
    .order("start_date", { ascending: true });

  if (!primaryErr && primaryData) {
    batchesData = primaryData;
  } else {
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
      .order("start_date", { ascending: true });

    if (fallbackData) {
      batchesData = fallbackData;
    }
  }

  return batchesData.map(formatBatchRecord);
}

/**
 * Creates a brand-new batch with its own independent capacity.
 * Starts with zero registrations (seats_booked = 0).
 */
export async function createBatch(
  courseId: string,
  rawInput: BatchScheduleInput,
  _createdByEmail?: string
): Promise<SafeBatchScheduleData> {
  const supabase = createAdminClient();

  const validation = batchScheduleSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    throw new Error(firstIssue?.message || "Invalid batch input.");
  }
  const input = validation.data;

  const nowIso = new Date().toISOString();
  const isTba = input.status === "tba";
  const effectiveStartDate =
    isTba || !input.startDate || input.startDate === "TBA" || input.startDate === "tba"
      ? "2099-12-31"
      : input.startDate;

  const isEnrollmentOpen = !isTba && input.status === "open";
  const totalSeats = input.totalSeats && input.totalSeats > 0 ? input.totalSeats : 50;

  const insertPayload: any = {
    course_id: courseId,
    batch_name: input.batchName,
    start_date: effectiveStartDate,
    end_date: input.endDate || null,
    start_time: input.startTime || "6:30 PM",
    end_time: input.endTime || "8:30 PM",
    timezone: "Asia/Kolkata",
    total_seats: totalSeats,
    seats_booked: 0, // Starts fresh with zero registrations!
    is_enrollment_open: isEnrollmentOpen,
    created_at: nowIso,
    updated_at: nowIso,
  };

  if (input.lastRegistrationDate) {
    insertPayload.last_registration_date = input.lastRegistrationDate;
  }
  if (input.registrationClosesBeforeHours) {
    insertPayload.registration_closes_before_hours = input.registrationClosesBeforeHours;
  }

  const { data: created, error } = await supabase
    .from("cohort_batches")
    .insert(insertPayload)
    .select(`*, courses (id, title, slug, description)`)
    .single();

  if (error || !created) {
    // If optional columns failed, fallback insert without them
    delete insertPayload.last_registration_date;
    delete insertPayload.registration_closes_before_hours;
    const { data: retryCreated, error: retryErr } = await supabase
      .from("cohort_batches")
      .insert(insertPayload)
      .select(`*, courses (id, title, slug, description)`)
      .single();

    if (retryErr || !retryCreated) {
      throw new Error(`Failed to create batch: ${retryErr?.message || error?.message}`);
    }
    const resultRecord = retryCreated;
    if (input.registrationMode && resultRecord?.courses) {
      try {
        const details = parseCourseDetails(resultRecord.courses.slug, resultRecord.courses.description);
        (details as any).registrationMode = input.registrationMode;
        if ((details as any).batchSchedule) {
          (details as any).batchSchedule.registrationMode = input.registrationMode;
        }
        await supabase.from("courses").update({ description: JSON.stringify(details), updated_at: nowIso }).eq("id", resultRecord.courses.id);
      } catch {}
    }
    return formatBatchRecord(resultRecord);
  }

  if (input.registrationMode && created?.courses) {
    try {
      const details = parseCourseDetails(created.courses.slug, created.courses.description);
      (details as any).registrationMode = input.registrationMode;
      if ((details as any).batchSchedule) {
        (details as any).batchSchedule.registrationMode = input.registrationMode;
      }
      await supabase.from("courses").update({ description: JSON.stringify(details), updated_at: nowIso }).eq("id", created.courses.id);
    } catch {}
  }

  return formatBatchRecord(created);
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
      registration_closes_before_hours,
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
    (primaryErr.code === "42703" ||
      primaryErr.message?.includes("last_registration_date") ||
      primaryErr.message?.includes("registration_closes_before_hours"))
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

  return formatBatchRecord(batchData);
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

  // Validate totalSeats against existing booked seats
  const { data: existingBatch } = await supabase
    .from("cohort_batches")
    .select("id, seats_booked, total_seats")
    .eq("id", batchId)
    .maybeSingle();

  if (existingBatch && input.totalSeats != null) {
    if (input.totalSeats < existingBatch.seats_booked) {
      throw new Error(
        `Total seats (${input.totalSeats}) cannot be less than the current booked seats (${existingBatch.seats_booked}).`
      );
    }
  }

  const isTba = input.status === "tba";
  const effectiveStartDate =
    isTba
      ? "2099-12-31"
      : input.startDate || "2099-12-31";

  // Ensure end date is not earlier than start date
  let effectiveEndDate = input.endDate || null;
  if (effectiveEndDate && effectiveEndDate < effectiveStartDate) {
    effectiveEndDate = effectiveStartDate;
  }

  const registrationClosesBeforeHours = input.registrationClosesBeforeHours ?? 2;
  const closing = calculateRegistrationClosingDateTime(
    effectiveStartDate,
    input.startTime,
    registrationClosesBeforeHours
  );

  const derivedLastRegDate =
    input.lastRegistrationDate || closing?.closingDateStr || effectiveStartDate;

  // Determine is_enrollment_open: ONLY open when status is explicitly "open"
  const isEnrollmentOpen = !isTba && input.status === "open";
  const nowIso = new Date().toISOString();

  let updatedRow: any = null;

  const fullUpdatePayload: any = {
    batch_name: input.batchName,
    start_date: effectiveStartDate,
    end_date: effectiveEndDate,
    start_time: input.startTime || "6:30 PM",
    end_time: input.endTime || "8:30 PM",
    last_registration_date: derivedLastRegDate,
    registration_closes_before_hours: registrationClosesBeforeHours,
    is_enrollment_open: isEnrollmentOpen,
    updated_at: nowIso,
  };

  if (input.totalSeats && input.totalSeats > 0) {
    fullUpdatePayload.total_seats = input.totalSeats;
  }

  // Helper to persist in course metadata JSON without corrupting sibling batches
  const saveCourseMetadata = async (course: any) => {
    if (!course) return;
    try {
      const details = parseCourseDetails(course.slug, course.description);
      (details as any).batchSchedules = (details as any).batchSchedules || {};
      (details as any).batchSchedules[batchId] = {
        lastRegistrationDate: derivedLastRegDate,
        registrationClosesBeforeHours,
        batchName: input.batchName,
        status: input.status,
        registrationMode: input.registrationMode || "paid",
        updatedAt: nowIso,
      };
      if (input.registrationMode) {
        (details as any).registrationMode = input.registrationMode;
      }
      if ((details as any).batchSchedule) {
        (details as any).batchSchedule.status = input.status;
        (details as any).batchSchedule.lastRegistrationDate = derivedLastRegDate;
        if (input.registrationMode) {
          (details as any).batchSchedule.registrationMode = input.registrationMode;
        }
      }
      const updatedDescription = JSON.stringify(details);
      await supabase
        .from("courses")
        .update({
          description: updatedDescription,
          updated_at: nowIso,
        })
        .eq("id", course.id);

      if (updatedRow?.courses) {
        updatedRow.courses.description = updatedDescription;
      }
    } catch (metaErr) {
      console.warn("Failed to save batch metadata in course JSON:", metaErr);
    }
  };

  const { data: res1, error: err1 } = await supabase
    .from("cohort_batches")
    .update(fullUpdatePayload)
    .eq("id", batchId)
    .select(`*, courses (id, title, slug, description)`)
    .single();

  if (
    err1 &&
    (err1.code === "42703" ||
      err1.message?.includes("registration_closes_before_hours") ||
      err1.message?.includes("last_registration_date"))
  ) {
    // Attempt fallback removing registration_closes_before_hours first
    delete fullUpdatePayload.registration_closes_before_hours;
    const { data: res2, error: err2 } = await supabase
      .from("cohort_batches")
      .update(fullUpdatePayload)
      .eq("id", batchId)
      .select(`*, courses (id, title, slug, description)`)
      .single();

    if (
      err2 &&
      (err2.code === "42703" || err2.message?.includes("last_registration_date"))
    ) {
      delete fullUpdatePayload.last_registration_date;
      const { data: res3, error: err3 } = await supabase
        .from("cohort_batches")
        .update(fullUpdatePayload)
        .eq("id", batchId)
        .select(`*, courses (id, title, slug, description)`)
        .single();

      if (err3 || !res3) {
        throw new Error(`Failed to update batch: ${err3?.message || "Unknown error"}`);
      }
      updatedRow = res3;
      await saveCourseMetadata(res3.courses);
    } else if (err2 || !res2) {
      throw new Error(`Failed to update batch: ${err2?.message || "Unknown error"}`);
    } else {
      updatedRow = res2;
      await saveCourseMetadata(res2.courses);
    }
  } else if (err1 || !res1) {
    throw new Error(`Failed to update batch: ${err1?.message || "Unknown error"}`);
  } else {
    updatedRow = res1;
    await saveCourseMetadata(res1.courses);
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

  return formatBatchRecord(updatedRow);
}
