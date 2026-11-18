import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createPaymentLink, listPaymentLinks } from "@/lib/payment-links/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payment-links
 * Lists all generated payment links for admin review.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId") || undefined;
    const batchId = searchParams.get("batchId") || undefined;

    const paymentLinks = await listPaymentLinks({ courseId, batchId });
    return NextResponse.json({ success: true, paymentLinks });
  } catch (error: any) {
    console.error("[API Admin PaymentLinks GET error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load payment links" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payment-links
 * Generates a unique, cryptographically signed, shareable payment link.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      courseId,
      batchId,
      studentName,
      studentEmail,
      studentPhone,
      customAmountPaise,
      expiresInHours,
    } = body;

    if (!courseId || !batchId) {
      return NextResponse.json(
        { error: "Course ID and Batch ID are required." },
        { status: 400 }
      );
    }

    const result = await createPaymentLink({
      courseId,
      batchId,
      studentName,
      studentEmail,
      studentPhone,
      customAmountPaise: customAmountPaise ? Number(customAmountPaise) : undefined,
      expiresInHours: expiresInHours ? Number(expiresInHours) : 48,
      createdBy: session.user?.email || "admin",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      paymentLink: result.data,
      message: "Payment link generated successfully.",
    });
  } catch (error: any) {
    console.error("[API Admin PaymentLinks POST error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment link" },
      { status: 500 }
    );
  }
}
