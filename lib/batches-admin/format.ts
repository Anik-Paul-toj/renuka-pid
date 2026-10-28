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

export interface RegistrationDeadlineOptions {
  startDate?: string | null;
  startTime?: string | null;
}

/**
 * Checks if the registration deadline or class start has passed based on India Standard Time (Asia/Kolkata).
 *
 * Rules:
 * 1. If todayInKolkata > effectiveDeadline: expired (true).
 * 2. If options.startDate is provided and todayInKolkata > options.startDate: expired (true).
 * 3. On the class date (todayInKolkata === options.startDate):
 *    If startTime is provided and current time in Asia/Kolkata >= startTime: expired (true).
 * 4. On the registration deadline date (todayInKolkata === effectiveDeadline):
 *    If startTime is provided and current time in Asia/Kolkata >= startTime: expired (true).
 * 5. Otherwise: open (false).
 */
export function isRegistrationDeadlineExpired(
  lastRegistrationDate?: string | null,
  referenceDate: Date = new Date(),
  options?: RegistrationDeadlineOptions
): boolean {
  const effectiveDeadline = lastRegistrationDate || options?.startDate;
  if (!effectiveDeadline && !options?.startDate) return false;

  try {
    const { dateStr: todayIST, hours: nowH, minutes: nowM, seconds: nowS } =
      getNowIST(referenceDate);

    // 1. If today is strictly after the deadline date -> expired
    if (effectiveDeadline && todayIST > effectiveDeadline) {
      return true;
    }

    // 2. If today is strictly after the class start date -> expired
    if (options?.startDate && todayIST > options.startDate) {
      return true;
    }

    const parsedTime = parseStartTimeToHoursMinutes(options?.startTime);

    // 3. If today is the class start date and class has started -> expired
    if (options?.startDate && todayIST === options.startDate && parsedTime) {
      const nowTotalSec = nowH * 3600 + nowM * 60 + nowS;
      const targetTotalSec = parsedTime.hours * 3600 + parsedTime.minutes * 60;
      if (nowTotalSec >= targetTotalSec) {
        return true;
      }
    }

    // 4. If today is the registration deadline date and cutoff time is reached -> expired
    if (effectiveDeadline && todayIST === effectiveDeadline && parsedTime) {
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
  isSoldOut?: boolean;
}): "open" | "closed" | "upcoming" | "completed" {
  if (batch.isSoldOut) return "closed";
  if (!batch.isEnrollmentOpen) return "closed";
  if (
    isRegistrationDeadlineExpired(batch.lastRegistrationDate, new Date(), {
      startDate: batch.startDate,
      startTime: batch.startTime,
    })
  ) {
    return "closed";
  }
  return "open";
}
