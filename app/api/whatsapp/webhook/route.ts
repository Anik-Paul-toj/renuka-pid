import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Resolves the configured verification token for Meta WhatsApp Webhook handshake.
 */
function getVerifyToken(): string {
  return (
    process.env.WHATSAPP_VERIFY_TOKEN ||
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
    ""
  ).trim();
}

/**
 * Resolves the configured WhatsApp App Secret for HMAC-SHA256 signature verification.
 */
function getAppSecret(): string {
  return (process.env.WHATSAPP_APP_SECRET || "").trim();
}

/**
 * Verifies Meta's X-Hub-Signature-256 header using timing-safe comparison.
 * Meta computes: sha256=HMAC_SHA256(raw_request_body, APP_SECRET)
 */
function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  try {
    const expectedHash = crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    const expectedSignature = `sha256=${expectedHash}`;

    const sigBuffer = Buffer.from(signatureHeader, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    console.error("[WhatsApp Webhook] Signature verification error:", err);
    return false;
  }
}

/**
 * Task 1.1: Meta Webhook Verification Handshake (GET)
 * 
 * Meta sends:
 * - hub.mode: 'subscribe'
 * - hub.verify_token: your configured token
 * - hub.challenge: numeric challenge string to be echoed back as text/plain
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = getVerifyToken();

  // Validate subscribe mode and exact verify token match
  const isTokenMatch =
    Boolean(expectedToken) && Boolean(token) && token === expectedToken;

  const isMockMatch =
    process.env.MOCK_WHATSAPP === "true" &&
    mode === "subscribe" &&
    token === "test_verify_token";

  if (mode === "subscribe" && (isTokenMatch || isMockMatch)) {
    // Return challenge as plain text with HTTP 200
    return new Response(challenge || "", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  // Return HTTP 403 for invalid verification
  return new Response("Forbidden: Invalid verification token.", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * Task 1.2: Meta Webhook Event Dispatcher (POST)
 * 
 * Receives:
 * - Message status updates (sent, delivered, read, failed)
 * - Incoming customer messages (text, media, interactive responses)
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const appSecret = getAppSecret();

    // 1. Verify incoming webhook signature using WHATSAPP_APP_SECRET
    if (appSecret && process.env.MOCK_WHATSAPP !== "true") {
      const signatureHeader = request.headers.get("x-hub-signature-256");

      if (!signatureHeader) {
        return NextResponse.json(
          { success: false, error: "Missing signature header (x-hub-signature-256)." },
          { status: 401 }
        );
      }

      const isValid = verifyMetaSignature(rawBody, signatureHeader, appSecret);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature." },
          { status: 401 }
        );
      }
    }

    // 2. Parse JSON payload safely
    let payload: any;
    try {
      payload = JSON.parse(rawBody || "{}");
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    if (!payload || !payload.entry || !Array.isArray(payload.entry)) {
      // Acknowledge receipt even for empty or non-entry ping events
      return NextResponse.json({ success: true, processed: 0 }, { status: 200 });
    }

    const adminClient = createAdminClient();
    let processedStatuses = 0;
    let processedMessages = 0;

    for (const entry of payload.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // ---------------------------------------------------------------------
        // Handle Message Status Event Payloads (sent, delivered, read, failed)
        // ---------------------------------------------------------------------
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const st of statuses) {
          const providerMessageId = st.id;
          const statusName = st.status; // "sent" | "delivered" | "read" | "failed"
          const timestamp = st.timestamp
            ? new Date(parseInt(st.timestamp, 10) * 1000).toISOString()
            : new Date().toISOString();

          if (!providerMessageId) continue;

          // Lookup matching log record in notification_logs
          const { data: existingLog } = await adminClient
            .from("notification_logs")
            .select("id, status, delivered_at, read_at")
            .eq("provider_message_id", providerMessageId)
            .maybeSingle();

          if (!existingLog) continue;

          const updates: Record<string, any> = {};

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
            const errorDetails =
              st.errors?.[0]?.title ||
              st.errors?.[0]?.message ||
              "Delivery failed by WhatsApp provider.";
            updates.error_message = errorDetails;
            if (st.errors?.[0]?.code) {
              updates.error_code = String(st.errors[0].code);
            }
          }

          if (Object.keys(updates).length > 0) {
            await adminClient
              .from("notification_logs")
              .update(updates)
              .eq("id", existingLog.id);
            processedStatuses++;
          }
        }

        // ---------------------------------------------------------------------
        // Handle Incoming Customer Messages Safely
        // ---------------------------------------------------------------------
        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const msg of messages) {
          const from = msg.from;
          const msgId = msg.id;
          const msgType = msg.type;
          const textBody = msg.text?.body;

          console.log(
            `[WhatsApp Webhook] Incoming message from ${from} (type: ${msgType}, id: ${msgId}):`,
            textBody || `[${msgType}]`
          );

          processedMessages++;
        }
      }
    }

    // Always return HTTP 200 for successfully received events to prevent Meta retries
    return NextResponse.json(
      {
        success: true,
        processedStatuses,
        processedMessages,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Uncaught processing error:", err);
    // Return HTTP 500 on unexpected errors
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to process WhatsApp webhook." },
      { status: 500 }
    );
  }
}

