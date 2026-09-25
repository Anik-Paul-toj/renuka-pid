import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Meta Webhook Challenge Handshake (GET)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Support sandbox/development handshake verification in testing environments
  if (process.env.MOCK_WHATSAPP === "true" && mode === "subscribe" && token === "test_verify_token") {
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    { success: false, error: "Forbidden: Invalid webhook verification token." },
    { status: 403 }
  );
}

/**
 * Meta Webhook Status Event Dispatch (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    // Verify HMAC-SHA256 signature if app secret is configured
    if (appSecret && process.env.MOCK_WHATSAPP !== "true") {
      const signatureHeader = request.headers.get("x-hub-signature-256");
      if (!signatureHeader) {
        return NextResponse.json(
          { success: false, error: "Missing signature header." },
          { status: 401 }
        );
      }

      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex")}`;

      if (signatureHeader !== expectedSignature) {
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature." },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody || "{}");
    if (!payload || !payload.entry || !Array.isArray(payload.entry)) {
      return NextResponse.json({ success: true, processed: 0 }, { status: 200 });
    }

    const adminClient = createAdminClient();
    let processedCount = 0;

    for (const entry of payload.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const statuses = change.value?.statuses || [];
        for (const st of statuses) {
          const providerMessageId = st.id;
          const statusName = st.status; // "sent", "delivered", "read", "failed"
          const timestamp = st.timestamp
            ? new Date(parseInt(st.timestamp, 10) * 1000).toISOString()
            : new Date().toISOString();

          if (!providerMessageId) continue;

          // Lookup matching log record
          const { data: existingLog } = await adminClient
            .from("notification_logs")
            .select("id, status, delivered_at, read_at")
            .eq("provider_message_id", providerMessageId)
            .maybeSingle();

          if (!existingLog) continue;

          const updates: any = {};

          if (statusName === "sent") {
            if (existingLog.status !== "delivered" && existingLog.status !== "read") {
              updates.status = "sent";
            }
          } else if (statusName === "delivered") {
            if (existingLog.status !== "read") {
              updates.status = "delivered";
            }
            if (!existingLog.delivered_at) {
              updates.delivered_at = timestamp;
            }
          } else if (statusName === "read") {
            updates.status = "read";
            if (!existingLog.read_at) {
              updates.read_at = timestamp;
            }
          } else if (statusName === "failed") {
            updates.status = "failed";
            const errorDetails = st.errors?.[0]?.title || st.errors?.[0]?.message || "Delivery failed by provider.";
            updates.error_message = errorDetails;
          }

          if (Object.keys(updates).length > 0) {
            await adminClient
              .from("notification_logs")
              .update(updates)
              .eq("id", existingLog.id);
            processedCount++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount }, { status: 200 });
  } catch (err: any) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process webhook." },
      { status: 500 }
    );
  }
}
