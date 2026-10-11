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
 * Checks if the registration deadline has passed based on today's date in Asia/Kolkata.
 * Returns true if today is strictly AFTER the lastRegistrationDate.
 */
export function isRegistrationDeadlineExpired(
  lastRegistrationDate?: string | null,
  referenceDate: Date = new Date()
): boolean {
  if (!lastRegistrationDate) return false;
  try {
    const todayInKolkata = getTodayISTString(referenceDate);
    return todayInKolkata > lastRegistrationDate;
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
  isSoldOut?: boolean;
}): "open" | "closed" | "upcoming" | "completed" {
  if (batch.isSoldOut) return "closed";
  if (!batch.isEnrollmentOpen) return "closed";
  if (isRegistrationDeadlineExpired(batch.lastRegistrationDate)) return "closed";
  return "open";
}
