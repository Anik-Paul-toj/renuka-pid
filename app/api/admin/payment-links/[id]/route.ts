import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { revokePaymentLink } from "@/lib/payment-links/service";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/payment-links/[id]
 * Revokes an existing payment link.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing link ID" }, { status: 400 });
    }

    const success = await revokePaymentLink(id);
    return NextResponse.json({
      success,
      message: "Payment link has been successfully revoked.",
    });
  } catch (error: any) {
    console.error("[API Admin PaymentLink PATCH error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update payment link" },
      { status: 500 }
    );
  }
}
