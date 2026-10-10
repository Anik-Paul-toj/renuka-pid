import { NextRequest, NextResponse } from "next/server";
import { checkCreditEligibilitySchema } from "@/lib/validations/course-credit";
import { checkCreditEligibility } from "@/lib/course-credit/service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Malformed request payload. Expected JSON object.",
          },
        },
        { status: 400 }
      );
    }

    const validationResult = checkCreditEligibilitySchema.safeParse(body);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: issue ? `${issue.path.join(".")}: ${issue.message}` : "Validation failed.",
          },
        },
        { status: 400 }
      );
    }

    const { email, phone, targetBatchId, sourceBookingReference } = validationResult.data;
    let targetCourseId = validationResult.data.targetCourseId;

    if (!targetCourseId && targetBatchId) {
      const adminClient = createAdminClient();
      const { data: batch } = await adminClient
        .from("cohort_batches")
        .select("course_id")
        .eq("id", targetBatchId)
        .maybeSingle();

      if (batch) {
        targetCourseId = batch.course_id;
      }
    }

    if (!targetCourseId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Either targetCourseId or targetBatchId must be provided.",
          },
        },
        { status: 400 }
      );
    }

    const eligibility = await checkCreditEligibility(
      email,
      targetCourseId,
      phone,
      sourceBookingReference
    );

    // Strictly sanitize output: do not expose internal database IDs (sourceBookingId, ruleId)
    const sanitizedData = {
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      creditVerificationToken: eligibility.creditVerificationToken,
      sourceCourseTitle: eligibility.sourceCourseTitle,
      targetCourseTitle: eligibility.targetCourseTitle,
      originalAmountPaise: eligibility.originalAmountPaise,
      creditAmountPaise: eligibility.creditAmountPaise,
      payableAmountPaise: eligibility.payableAmountPaise,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Failed to check credit eligibility.",
        },
      },
      { status: 500 }
    );
  }
}
