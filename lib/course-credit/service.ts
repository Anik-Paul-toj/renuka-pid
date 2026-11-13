import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  comparePhoneNumbers,
  createCreditVerificationToken,
  normalizeEmail,
} from "./identity";

export interface CreditEligibilityResult {
  eligible: boolean;
  reason?: string;
  sourceBookingId?: string;
  ruleId?: string;
  creditVerificationToken?: string;
  sourceCourseTitle?: string;
  targetCourseTitle?: string;
  originalAmountPaise: number;
  creditAmountPaise: number;
  payableAmountPaise: number;
}

export interface CourseDiscountBenefit {
  isEligible: boolean;
  creditAmountPaise: number;
  discountReferenceId?: string | null;
  targetCourseId?: string;
  targetCourseTitle?: string;
  description?: string;
}

// Fallback constant IDs from migration
export const FOUNDATION_COURSE_ID = "e1111111-2222-3333-4444-555555555555";
export const ARTISTRY_COURSE_ID = "e2222222-2222-3333-4444-555555555555";

/**
 * Determines whether a purchased course qualifies for the upgrade credit.
 * The discount amount is dynamic and equals the authoritative Watercolour Foundation course price
 * at the time the student purchases the course (e.g. ₹599, ₹990, ₹1,499, ₹2,499).
 * Preserves strict business rules:
 * - Roadmap Masterclass: No upgrade discount
 * - Watercolour Foundation: Eligible for dynamic Foundation credit towards Artistry + Foundation
 * - Artistry + Foundation: No additional upgrade credit
 */
export function getCourseDiscountBenefit(
  course?: {
    id?: string | null;
    slug?: string | null;
    title?: string | null;
    offer_price_paise?: number | null;
  } | null,
  booking?: {
    booking_reference?: string | null;
    amount_paise?: number | null;
    original_amount_paise?: number | null;
  } | string | null
): CourseDiscountBenefit {
  if (!course) {
    return { isEligible: false, creditAmountPaise: 0 };
  }

  const isFoundation =
    course.slug === "watercolour-foundation" ||
    course.id === FOUNDATION_COURSE_ID;

  if (isFoundation) {
    let earnedPaise = 0;
    let refId: string | null = null;

    if (typeof booking === "object" && booking !== null) {
      refId = booking.booking_reference || null;
      if (typeof booking.amount_paise === "number" && booking.amount_paise > 0) {
        earnedPaise = booking.amount_paise;
      } else if (typeof booking.original_amount_paise === "number" && booking.original_amount_paise > 0) {
        earnedPaise = booking.original_amount_paise;
      }
    } else if (typeof booking === "string") {
      refId = booking;
    }

    if (earnedPaise === 0 && typeof course.offer_price_paise === "number" && course.offer_price_paise > 0) {
      earnedPaise = course.offer_price_paise;
    }

    const earnedRupees = Math.round(earnedPaise / 100);
    const amountLabel = earnedRupees > 0 ? `₹${earnedRupees.toLocaleString("en-IN")}` : "full course";

    return {
      isEligible: true,
      creditAmountPaise: earnedPaise,
      discountReferenceId: refId,
      targetCourseId: ARTISTRY_COURSE_ID,
      targetCourseTitle: "WATERCOLOUR ARTISTRY + FOUNDATION COURSE",
      description: `Eligible for ${amountLabel} credit towards Artistry + Foundation`,
    };
  }

  return {
    isEligible: false,
    creditAmountPaise: 0,
  };
}

/**
 * Retrieves the active credit rule for a target course.
 */
export async function getCreditRuleForTargetCourse(targetCourseId: string) {
  const adminClient = createAdminClient();

  try {
    const { data: rule, error } = await adminClient
      .from("course_credit_rules")
      .select("*")
      .eq("target_course_id", targetCourseId)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && rule) {
      return rule;
    }
  } catch {
    // Fallback if table not yet migrated
  }

  // Baseline fallback for default rule: Foundation -> Artistry
  if (targetCourseId === ARTISTRY_COURSE_ID) {
    let fallbackAmount = 99000;
    try {
      const { data: fc } = await adminClient
        .from("courses")
        .select("offer_price_paise")
        .eq("id", FOUNDATION_COURSE_ID)
        .maybeSingle();
      if (fc?.offer_price_paise) {
        fallbackAmount = fc.offer_price_paise;
      }
    } catch {
      // fallback
    }

    return {
      id: "c1111111-3333-4444-5555-666666666666",
      source_course_id: FOUNDATION_COURSE_ID,
      target_course_id: ARTISTRY_COURSE_ID,
      credit_amount_paise: fallbackAmount,
      is_active: true,
      description: "Default Foundation to Artistry credit dynamically matching Foundation course price",
    };
  }

  return null;
}

/**
 * Evaluates whether a customer is eligible for a credit toward a target course.
 * Requires verification of possession of the registered customer's phone number
 * to prevent guest credit hijacking by unverified email input.
 */
export async function checkCreditEligibility(
  email: string,
  targetCourseId: string,
  phone?: string | null,
  sourceBookingReference?: string | null
): Promise<CreditEligibilityResult> {
  const adminClient = createAdminClient();
  const normalizedEmail = normalizeEmail(email);

  // 1. Get Target Course Details
  const { data: targetCourse } = await adminClient
    .from("courses")
    .select("id, title, offer_price_paise")
    .eq("id", targetCourseId)
    .maybeSingle();

  const originalAmountPaise = targetCourse?.offer_price_paise || 999000;

  // 2. Identity Verification Factors: Phone number and Foundation Booking Reference are strictly required
  if (!phone || phone.trim().length === 0) {
    return {
      eligible: false,
      reason: "Phone number is required to verify Foundation course credit entitlement.",
      originalAmountPaise,
      creditAmountPaise: 0,
      payableAmountPaise: originalAmountPaise,
    };
  }

  if (!sourceBookingReference || sourceBookingReference.trim().length === 0) {
    return {
      eligible: false,
      reason: "Foundation booking confirmation reference (e.g. REF-...) is required to verify credit eligibility.",
      originalAmountPaise,
      creditAmountPaise: 0,
      payableAmountPaise: originalAmountPaise,
    };
  }

  // 3. Lookup Active Credit Rule for Target Course
  const rule = await getCreditRuleForTargetCourse(targetCourseId);
  if (!rule || !rule.is_active) {
    return {
      eligible: false,
      reason: "No active discount rule configured for this course.",
      originalAmountPaise,
      creditAmountPaise: 0,
      payableAmountPaise: originalAmountPaise,
    };
  }

  // 4. Find Customer by Email
  const { data: customer } = await adminClient
    .from("customers")
    .select("id, full_name, email, phone, whatsapp_phone")
    .eq("email", normalizedEmail)
    .maybeSingle();

  // Unified generic response to prevent email and phone enumeration
  const genericNotFoundMessage =
    "No eligible Foundation booking found for the provided details. Please verify your email, phone, and booking reference.";

  if (!customer) {
    return {
      eligible: false,
      reason: genericNotFoundMessage,
      originalAmountPaise,
      creditAmountPaise: 0,
      payableAmountPaise: originalAmountPaise,
    };
  }

  // 5. Possession Verification: Ensure submitted phone matches the customer's recorded phone
  const phoneMatches =
    comparePhoneNumbers(phone, customer.phone) ||
    comparePhoneNumbers(phone, customer.whatsapp_phone);

  if (!phoneMatches) {
    return {
      eligible: false,
      reason: genericNotFoundMessage,
      originalAmountPaise,
      creditAmountPaise: 0,
      payableAmountPaise: originalAmountPaise,
    };
  }

  // 6. Find all Confirmed, Unreleased Bookings for the Source Course
  const { data: sourceBookings, error: bookingErr } = await adminClient
    .from("bookings")
    .select(
      `
      id,
      booking_reference,
      status,
      seat_released,
      amount_paise,
      cohort_batches!inner (
        course_id,
        courses (
          title
        )
      ),
      payments (
        id,
        status,
        amount_paise
      )
    `
    )
    .eq("customer_id", customer.id)
    .eq("status", "confirmed")
    .eq("seat_released", false)
    .eq("cohort_batches.course_id", rule.source_course_id);

  if (bookingErr || !sourceBookings || sourceBookings.length === 0) {
    return {
      eligible: false,
      reason: "No confirmed, paid purchase of the Foundation course found.",
      originalAmountPaise,
      creditAmountPaise: 0,
      payableAmountPaise: originalAmountPaise,
    };
  }

  // 7. Filter for bookings that have a captured and unrefunded payment
  const qualifyingBookings = sourceBookings.filter((b) => {
    const payments = (b as any).payments || [];
    const hasCaptured = payments.some(
      (p: any) => p.status === "captured" && p.status !== "refunded"
    );
    const hasRefunded = payments.some((p: any) => p.status === "refunded");
    return hasCaptured && !hasRefunded && b.status !== "refunded";
  });

  if (qualifyingBookings.length === 0) {
    return {
      eligible: false,
      reason: genericNotFoundMessage,
      originalAmountPaise,
      creditAmountPaise: 0,
      payableAmountPaise: originalAmountPaise,
    };
  }

  const cleanRef = sourceBookingReference.trim().toUpperCase();
  const matchingBookings = qualifyingBookings.filter((b) => b.booking_reference === cleanRef);
  if (matchingBookings.length === 0) {
    return {
      eligible: false,
      reason: genericNotFoundMessage,
      originalAmountPaise,
      creditAmountPaise: 0,
      payableAmountPaise: originalAmountPaise,
    };
  }

  // 8. Check Double-Use Protection on booking_credits
  // Iterate through matching bookings to find one whose credit is not yet consumed or reserved
  for (const qb of matchingBookings) {
    let creditActive = false;

    try {
      const { data: existingCredits } = await adminClient
        .from("booking_credits")
        .select(
          `
          id,
          status,
          target_booking_id,
          bookings!booking_credits_target_booking_id_fkey (
            status,
            seat_released,
            expires_at
          )
        `
        )
        .eq("source_booking_id", qb.id)
        .in("status", ["reserved", "consumed"]);

      if (existingCredits && existingCredits.length > 0) {
        for (const ec of existingCredits) {
          if (ec.status === "consumed") {
            creditActive = true;
            break;
          }

          if (ec.status === "reserved") {
            // Check if target booking expired or was released
            const targetBooking = (ec as any).bookings;
            const isExpired =
              targetBooking?.seat_released ||
              (targetBooking?.expires_at &&
                new Date(targetBooking.expires_at) <= new Date());

            if (isExpired) {
              // Automatically release expired reservation
              await adminClient
                .from("booking_credits")
                .update({
                  status: "released",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", ec.id);
            } else {
              creditActive = true;
              break;
            }
          }
        }
      }
    } catch {
      // In case booking_credits table not yet created, fallback to bookings check
      const { data: targetBookings } = await adminClient
        .from("bookings")
        .select("id, status, seat_released, expires_at, cohort_batches!inner(course_id)")
        .eq("customer_id", customer.id)
        .eq("cohort_batches.course_id", rule.target_course_id)
        .in("status", ["confirmed", "pending"])
        .eq("seat_released", false);

      if (targetBookings && targetBookings.length > 0) {
        const activeTarget = targetBookings.find(
          (tb) =>
            tb.status === "confirmed" ||
            (tb.status === "pending" && new Date(tb.expires_at) > new Date())
        );
        if (activeTarget) {
          creditActive = true;
        }
      }
    }

    if (!creditActive) {
      // Found an eligible qualifying Foundation purchase whose credit is free to use!
      // The credit amount is authoritatively derived from the student's Foundation purchase:
      // What the student paid/earned for the Foundation course at the time of purchase (e.g. ₹599, ₹990, ₹1,499, ₹2,499)
      const foundationEarnedPaise =
        typeof qb.amount_paise === "number" && qb.amount_paise > 0
          ? qb.amount_paise
          : (typeof (qb as any).original_amount_paise === "number" && (qb as any).original_amount_paise > 0
              ? (qb as any).original_amount_paise
              : (qb as any).cohort_batches?.courses?.offer_price_paise || 0);

      const creditAmountPaise = Math.min(foundationEarnedPaise, originalAmountPaise);
      const payableAmountPaise = Math.max(0, originalAmountPaise - creditAmountPaise);

      // Generate tamper-proof Identity Verification Token
      // Cryptographically binds credit entitlement to the customer's phone, email, and target course
      const creditVerificationToken = createCreditVerificationToken({
        email: normalizedEmail,
        phone: phone.trim(),
        targetCourseId,
        sourceBookingId: qb.id,
        ruleId: rule.id,
        discountAmountPaise: creditAmountPaise,
      });

      // Do NOT expose sourceBookingId or ruleId in the public eligibility result
      return {
        eligible: true,
        creditVerificationToken,
        sourceCourseTitle: (qb as any).cohort_batches?.courses?.title || "WATERCOLOUR FOUNDATION",
        targetCourseTitle: targetCourse?.title || "WATERCOLOUR ARTISTRY + FOUNDATION COURSE",
        originalAmountPaise,
        creditAmountPaise,
        payableAmountPaise,
      };
    }
  }

  return {
    eligible: false,
    reason: "Your Foundation course credit has already been used or is reserved by an active booking.",
    originalAmountPaise,
    creditAmountPaise: 0,
    payableAmountPaise: originalAmountPaise,
  };
}

/**
 * Permanently consumes a reserved credit upon successful payment capture.
 */
export async function consumeCreditForBooking(targetBookingId: string): Promise<boolean> {
  const adminClient = createAdminClient();
  const nowIso = new Date().toISOString();

  try {
    const { error } = await adminClient
      .from("booking_credits")
      .update({
        status: "consumed",
        updated_at: nowIso,
      })
      .eq("target_booking_id", targetBookingId)
      .eq("status", "reserved");

    return !error;
  } catch {
    return false;
  }
}

/**
 * Releases a reserved credit if a pending booking expires or is cancelled before payment.
 */
export async function releaseCreditForBooking(targetBookingId: string): Promise<boolean> {
  const adminClient = createAdminClient();
  const nowIso = new Date().toISOString();

  try {
    const { error } = await adminClient
      .from("booking_credits")
      .update({
        status: "released",
        updated_at: nowIso,
      })
      .eq("target_booking_id", targetBookingId)
      .eq("status", "reserved");

    return !error;
  } catch {
    return false;
  }
}
