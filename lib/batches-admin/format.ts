/**
 * Date and time formatting utilities strictly aligned with India Standard Time (Asia/Kolkata).
 */

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Formats a YYYY-MM-DD date string into a friendly, artistic date (e.g., "01 Nov 2026").
 */
export function formatBatchDateIST(dateStr?: string | null): string {
  if (!dateStr) return "To be announced";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    // Construct in UTC at noon to prevent local browser shift
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formats a YYYY-MM-DD date string into a full weekday date (e.g., "Saturday, 14 November 2026").
 */
export function formatBatchDateWithWeekdayIST(dateStr?: string | null): string {
  if (!dateStr) return "To be announced";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formats batch timing with start and optional end time and IST label.
 * Example: "6:30 PM – 8:00 PM IST"
 */
export function formatBatchTimeIST(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) return "TBA";
  let start = startTime.trim();
  let end = endTime ? endTime.trim() : "";

  // Strip trailing IST to prevent duplicates
  start = start.replace(/\s*ist\s*$/i, "").trim();
  if (end) {
    end = end.replace(/\s*ist\s*$/i, "").trim();
  }

  if (!end || end === start) {
    return `${start} IST`;
  }
  return `${start} – ${end} IST`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata timezone.
 */
export function getTodayISTString(referenceDate: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: IST_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(referenceDate);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Returns the current date (YYYY-MM-DD) and time components strictly in Asia/Kolkata timezone.
 */
export function getNowIST(referenceDate: Date = new Date()): {
  dateStr: string;
  hours: number;
  minutes: number;
  seconds: number;
} {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: IST_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = dtf.formatToParts(referenceDate);
    const findPart = (type: string) =>
      parts.find((p) => p.type === type)?.value || "0";
    const year = findPart("year");
    const month = findPart("month");
    const day = findPart("day");
    const hours = parseInt(findPart("hour"), 10) % 24;
    const minutes = parseInt(findPart("minute"), 10);
    const seconds = parseInt(findPart("second"), 10);
    return {
      dateStr: `${year}-${month}-${day}`,
      hours,
      minutes,
      seconds,
    };
  } catch {
    const iso = referenceDate.toISOString();
    return {
      dateStr: iso.slice(0, 10),
      hours: referenceDate.getUTCHours(),
      minutes: referenceDate.getUTCMinutes(),
      seconds: referenceDate.getUTCSeconds(),
    };
  }
}

/**
 * Parses a start time string (e.g. "6:00 PM", "6:00 PM IST", "11:00 AM - 1:00 PM", "18:30")
 * into hours (0-23) and minutes (0-59).
 */
export function parseStartTimeToHoursMinutes(
  timeStr?: string | null
): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();
  // If there's a range like "11:00 AM – 1:00 PM", isolate the start time component
  const firstPart = trimmed.split(/[-–—]/)[0].trim();

  // Match 12-hour format e.g. "6:00 PM", "11:30 AM", "6 PM", "11 am"
  const match12 = firstPart.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3].toLowerCase();
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  // Match 24-hour format e.g. "18:00", "09:30"
  const match24 = firstPart.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  return null;
}

export interface RegistrationClosingResult {
  closingDateStr: string; // "YYYY-MM-DD" strictly in Asia/Kolkata
  closingTimeStr: string; // e.g. "9:00 AM"
  closingDateFormatted: string; // e.g. "14 Nov 2026"
  closingDateTimeFormatted: string; // e.g. "14 Nov 2026, 9:00 AM"
  closingTimestampMs: number; // Unix timestamp ms when registration cutoff occurs
  batchStartTimestampMs: number; // Unix timestamp ms when batch class starts
  closingIso: string;
  cutoffHours: number;
  isExpired: boolean; // whether referenceDate >= closingTimestampMs
  hasStarted: boolean; // whether referenceDate >= batchStartTimestampMs
}

/**
 * Calculates the exact registration closing datetime in Asia/Kolkata timezone (UTC+05:30)
 * based on batch start date, start time, and configured closing cutoff hours.
 *
 * Correctly computes across calendar days and midnight boundaries.
 */
export function calculateRegistrationClosingDateTime(
  startDate?: string | null,
  startTime?: string | null,
  cutoffHours: number = 2,
  referenceDate: Date = new Date()
): RegistrationClosingResult | null {
  if (!startDate || !startDate.trim()) return null;
  const parts = startDate.trim().split("-").map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;

  const parsedTime = parseStartTimeToHoursMinutes(startTime) || {
    hours: 18,
    minutes: 30,
  };

  // Asia/Kolkata is strictly fixed at UTC+05:30 (no DST)
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const batchStartUtcMs =
    Date.UTC(parts[0], parts[1] - 1, parts[2], parsedTime.hours, parsedTime.minutes, 0) -
    istOffsetMs;

  const safeCutoffHours = [1, 2, 3, 4, 6, 12, 24].includes(Number(cutoffHours))
    ? Number(cutoffHours)
    : 2;

  const closingTimestampMs = batchStartUtcMs - safeCutoffHours * 3600 * 1000;

  // Format closing date & time strictly in Asia/Kolkata
  const closingDate = new Date(closingTimestampMs);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const partsOut = dtf.formatToParts(closingDate);
  const findP = (t: string) => partsOut.find((p) => p.type === t)?.value || "";
  const y = findP("year");
  const m = findP("month");
  const d = findP("day");
  const h = findP("hour");
  const min = findP("minute");
  const dayPeriod = findP("dayPeriod");

  // 24-hour parts for ISO string
  const dtf24 = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts24 = dtf24.formatToParts(closingDate);
  const h24 = parts24.find((p) => p.type === "hour")?.value || "00";
  const m24 = parts24.find((p) => p.type === "minute")?.value || "00";

  const closingDateStr = `${y}-${m}-${d}`;
  const closingTimeStr = `${h}:${min} ${dayPeriod}`;
  const closingDateFormatted = formatBatchDateIST(closingDateStr);
  const closingDateTimeFormatted = `${closingDateFormatted}, ${closingTimeStr}`;
  const closingIso = `${closingDateStr}T${h24}:${m24}:00+05:30`;

  const nowMs = referenceDate.getTime();
  const isExpired = nowMs >= closingTimestampMs;
  const hasStarted = nowMs >= batchStartUtcMs;

  return {
    closingDateStr,
    closingTimeStr,
    closingDateFormatted,
    closingDateTimeFormatted,
    closingTimestampMs,
    batchStartTimestampMs: batchStartUtcMs,
    closingIso,
    cutoffHours: safeCutoffHours,
    isExpired,
    hasStarted,
  };
}

export interface RegistrationDeadlineOptions {
  startDate?: string | null;
  startTime?: string | null;
  registrationClosesBeforeHours?: number | null;
}

/**
 * Checks if the registration deadline or class start has passed based on India Standard Time (Asia/Kolkata).
 *
 * Rules:
 * 1. If options.startDate is provided, calculates exact cutoff using registrationClosesBeforeHours (default 2 hrs).
 * 2. If current time in Asia/Kolkata >= closing datetime: expired (true).
 * 3. If todayInKolkata > effectiveDeadline date: expired (true).
 * 4. Otherwise: open (false).
 */
export function isRegistrationDeadlineExpired(
  lastRegistrationDate?: string | null,
  referenceDate: Date = new Date(),
  options?: RegistrationDeadlineOptions
): boolean {
  if (options?.startDate) {
    const cutoffHours = options.registrationClosesBeforeHours ?? 2;
    const closing = calculateRegistrationClosingDateTime(
      options.startDate,
      options.startTime,
      cutoffHours,
      referenceDate
    );
    if (closing && (closing.isExpired || closing.hasStarted)) {
      return true;
    }
  }

  const effectiveDeadline = lastRegistrationDate || options?.startDate;
  if (!effectiveDeadline) return false;

  try {
    const { dateStr: todayIST, hours: nowH, minutes: nowM, seconds: nowS } =
      getNowIST(referenceDate);

    // 1. If today is strictly after the deadline date -> expired
    if (todayIST > effectiveDeadline) {
      return true;
    }

    // 2. If options.startDate is provided and today is strictly after class start date -> expired
    if (options?.startDate && todayIST > options.startDate) {
      return true;
    }

    const parsedTime = parseStartTimeToHoursMinutes(options?.startTime);

    // 3. If today is class start date and class has started -> expired
    if (options?.startDate && todayIST === options.startDate && parsedTime) {
      const nowTotalSec = nowH * 3600 + nowM * 60 + nowS;
      const targetTotalSec = parsedTime.hours * 3600 + parsedTime.minutes * 60;
      if (nowTotalSec >= targetTotalSec) {
        return true;
      }
    }

    // 4. If today is the registration deadline date and cutoff time is reached -> expired
    if (todayIST === effectiveDeadline && parsedTime) {
      const nowTotalSec = nowH * 3600 + nowM * 60 + nowS;
      const targetTotalSec = parsedTime.hours * 3600 + parsedTime.minutes * 60;
      if (nowTotalSec >= targetTotalSec) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Derives batch status from isEnrollmentOpen, deadline, and sold-out flags.
 */
export function deriveBatchStatus(batch: {
  isEnrollmentOpen: boolean;
  lastRegistrationDate?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  registrationClosesBeforeHours?: number | null;
  isSoldOut?: boolean;
}): "open" | "closed" | "upcoming" | "completed" {
  if (batch.isSoldOut) return "closed";
  if (!batch.isEnrollmentOpen) return "closed";
  if (
    isRegistrationDeadlineExpired(batch.lastRegistrationDate, new Date(), {
      startDate: batch.startDate,
      startTime: batch.startTime,
      registrationClosesBeforeHours: batch.registrationClosesBeforeHours,
    })
  ) {
    return "closed";
  }
  return "open";
}

export interface BatchRegistrationCheckInput {
  isEnrollmentOpen?: boolean;
  lastRegistrationDate?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  registrationClosesBeforeHours?: number | null;
  isSoldOut?: boolean;
  totalSeats?: number;
  seatsBooked?: number;
}

export interface BatchRegistrationEligibility {
  isOpen: boolean;
  reason?: "not_open" | "sold_out" | "expired" | "started" | "unannounced";
  message: string;
}

/**
 * Shared authoritative registration check for any batch (Roadmap, Foundation, Artistry).
 *
 * Registration Eligibility Rules:
 * A batch accepts registrations ONLY when ALL conditions are satisfied:
 * 1. Admin has explicitly opened registration (is_enrollment_open = true).
 * 2. Batch has a valid published start date and start time.
 * 3. Current time is before the calculated registration closing datetime.
 * 4. Batch has not started.
 * 5. Available capacity is greater than zero.
 *
 * If any condition fails, returns isOpen: false with the exact human-readable reason message:
 * - "Registration is closed."
 * - "This batch is fully booked. Registration is now closed."
 * - "Registration has not opened yet."
 * - "This batch has already started."
 */
export function isBatchRegistrationOpen(
  batch?: BatchRegistrationCheckInput | null,
  referenceDate: Date = new Date()
): BatchRegistrationEligibility {
  if (!batch) {
    return {
      isOpen: false,
      reason: "not_open",
      message: "Registration is closed.",
    };
  }

  // 1. Admin explicitly opened registration
  if (batch.isEnrollmentOpen === false) {
    return {
      isOpen: false,
      reason: "not_open",
      message: "Registration is closed.",
    };
  }

  // 2. Capacity check: Available capacity must be > 0
  const seatsBooked = typeof batch.seatsBooked === "number" ? batch.seatsBooked : 0;
  const totalSeats = typeof batch.totalSeats === "number" ? batch.totalSeats : 100;
  if (batch.isSoldOut || (totalSeats > 0 && seatsBooked >= totalSeats)) {
    return {
      isOpen: false,
      reason: "sold_out",
      message: "This batch is fully booked. Registration is now closed.",
    };
  }

  // 3. Valid published start date check
  if (!batch.startDate || !isBatchDateAnnounced(batch.startDate)) {
    return {
      isOpen: false,
      reason: "unannounced",
      message: "Registration has not opened yet.",
    };
  }

  // 4. Exact calculated closing datetime check
  const cutoffHours = batch.registrationClosesBeforeHours ?? 2;
  const closing = calculateRegistrationClosingDateTime(
    batch.startDate,
    batch.startTime,
    cutoffHours,
    referenceDate
  );

  if (closing) {
    // 4a. Batch has not started
    if (closing.hasStarted) {
      return {
        isOpen: false,
        reason: "started",
        message: "This batch has already started.",
      };
    }

    // 4b. Current time is before the calculated registration closing datetime
    if (closing.isExpired) {
      return {
        isOpen: false,
        reason: "expired",
        message: "Registration is closed.",
      };
    }
  }

  // 5. Check legacy lastRegistrationDate if provided and earlier
  if (batch.lastRegistrationDate) {
    const { dateStr: todayIST } = getNowIST(referenceDate);
    if (todayIST > batch.lastRegistrationDate) {
      return {
        isOpen: false,
        reason: "expired",
        message: "Registration is closed.",
      };
    }
  }

  return {
    isOpen: true,
    message: "Registration is open.",
  };
}

/**
 * Determines whether a batch's start date is genuinely announced.
 *
 * A date is considered "not announced" when:
 * - startDate is null, undefined, or empty
 * - startDate is a well-known placeholder sentinel ("TBA", "tba", "0000-00-00", etc.)
 *
 * This is the single source of truth used by the batch service, booking service,
 * and UI components to decide whether enrolment for Foundation and Artistry courses
 * should be permitted.
 */
export function isBatchDateAnnounced(startDate?: string | null): boolean {
  if (!startDate || startDate.trim() === "") return false;
  const normalized = startDate.trim().toUpperCase();
  const sentinels = ["TBA", "0000-00-00", "N/A", "NONE", "NULL", "UNKNOWN"];
  if (sentinels.includes(normalized)) return false;
  // Ensure it looks like a real YYYY-MM-DD date
  return /^\d{4}-\d{2}-\d{2}$/.test(startDate.trim());
}

/**
 * For Foundation and Artistry courses specifically, an announced date alone is not
 * sufficient — the admin must also explicitly open registration via is_enrollment_open=true.
 * This helper combines both checks.
 *
 * For all other courses (Masterclass / Roadmap) the standard isEnrollmentOpen flag is
 * the only gate, so pass isNonCohortCourse=true to skip the date announcement guard.
 */
export function isCohortEnrolmentEligible(
  batch: {
    isEnrollmentOpen: boolean;
    startDate?: string | null;
  } | null | undefined,
  isCohortCourse: boolean = true
): boolean {
  if (!batch) return false;
  if (!batch.isEnrollmentOpen) return false;
  if (isCohortCourse && !isBatchDateAnnounced(batch.startDate)) return false;
  return true;
}
