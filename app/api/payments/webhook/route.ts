import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@/lib/payment/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature header" },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    const result = await handleWebhookEvent(rawBody, signature);

    return NextResponse.json(
      { message: result.message, handled: result.handled },
      { status: result.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Webhook processing failure" },
      { status: 500 }
    );
  }
}
