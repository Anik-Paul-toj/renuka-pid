import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Read tokens from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let verifyToken = "";
let appSecret = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("WHATSAPP_VERIFY_TOKEN=")) {
      verifyToken = trimmed.replace("WHATSAPP_VERIFY_TOKEN=", "").trim();
    }
    if (trimmed.startsWith("WHATSAPP_APP_SECRET=")) {
      appSecret = trimmed.replace("WHATSAPP_APP_SECRET=", "").trim();
    }
  }
}

console.log("------------------------------------------------------------");
console.log("WhatsApp Webhook Live HTTP Testing");
console.log(`Verify token configured: ${verifyToken ? "YES (" + verifyToken.substring(0, 8) + "...)" : "NO"}`);
console.log(`App Secret configured:   ${appSecret ? "YES (" + appSecret.substring(0, 4) + "...)" : "NO"}`);
console.log("------------------------------------------------------------");

const PORT = 3088;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function run() {
  // Test 1: GET with matching verify_token and hub.mode=subscribe
  {
    const challenge = "765432198";
    const testUrl = `${BASE_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=${challenge}&hub.verify_token=${verifyToken}`;
    const res = await fetch(testUrl, { method: "GET" });
    const text = await res.text();

    console.log(`Test 1 [GET with matching token] -> HTTP ${res.status}, body: "${text}"`);
    assert.equal(res.status, 200, "Matching token must return HTTP 200");
    assert.equal(text, challenge, "Challenge must match exactly");
    console.log("✅ Test 1 PASSED: Successful Meta GET handshake");
  }

  // Test 2: GET with incorrect token
  {
    const challenge = "765432198";
    const testUrl = `${BASE_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=${challenge}&hub.verify_token=wrong_token_here`;
    const res = await fetch(testUrl, { method: "GET" });

    console.log(`Test 2 [GET with wrong token] -> HTTP ${res.status}`);
    assert.equal(res.status, 403, "Incorrect token must return HTTP 403");
    console.log("✅ Test 2 PASSED: Invalid token returns HTTP 403 Forbidden");
  }

  // Test 3: GET with wrong mode
  {
    const challenge = "765432198";
    const testUrl = `${BASE_URL}/api/whatsapp/webhook?hub.mode=unknown&hub.challenge=${challenge}&hub.verify_token=${verifyToken}`;
    const res = await fetch(testUrl, { method: "GET" });

    console.log(`Test 3 [GET with wrong mode] -> HTTP ${res.status}`);
    assert.equal(res.status, 403, "Wrong mode must return HTTP 403");
    console.log("✅ Test 3 PASSED: Non-subscribe mode returns HTTP 403 Forbidden");
  }

  // Test 4: POST without signature header (when secret configured)
  {
    const body = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const res = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    console.log(`Test 4 [POST missing signature] -> HTTP ${res.status}`);
    assert.equal(res.status, 401, "Missing signature must return HTTP 401");
    console.log("✅ Test 4 PASSED: Missing signature returns HTTP 401 Unauthorized");
  }

  // Test 5: POST with invalid signature
  {
    const body = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const res = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": "sha256=0000000000000000000000000000000000000000000000000000000000000000",
      },
      body,
    });
    console.log(`Test 5 [POST invalid signature] -> HTTP ${res.status}`);
    assert.equal(res.status, 401, "Invalid signature must return HTTP 401");
    console.log("✅ Test 5 PASSED: Tampered signature returns HTTP 401 Unauthorized");
  }

  // Test 6: POST with valid signature & status payload
  {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "1112385481536600",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "919999999999",
                  phone_number_id: "1433786996481260",
                },
                statuses: [
                  {
                    id: "wamid.test_status_message_001",
                    status: "delivered",
                    timestamp: "1710000000",
                    recipient_id: "919876543210",
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    };
    const rawBody = JSON.stringify(payload);
    const validSignature = `sha256=${crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex")}`;

    const res = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": validSignature,
      },
      body: rawBody,
    });
    const data = await res.json();
    console.log(`Test 6 [POST valid signature status update] -> HTTP ${res.status}`, data);
    assert.equal(res.status, 200, "Valid webhook status event must return HTTP 200");
    assert.equal(data.success, true);
    console.log("✅ Test 6 PASSED: Status update event processed with HTTP 200");
  }

  // Test 7: POST with valid signature & incoming message payload
  {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "1112385481536600",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "919999999999",
                  phone_number_id: "1433786996481260",
                },
                contacts: [{ profile: { name: "Anik" }, wa_id: "919876543210" }],
                messages: [
                  {
                    from: "919876543210",
                    id: "wamid.test_incoming_msg_001",
                    timestamp: "1710000005",
                    text: { body: "Hello Renuka Art Studio! I loved the workshop." },
                    type: "text",
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    };
    const rawBody = JSON.stringify(payload);
    const validSignature = `sha256=${crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex")}`;

    const res = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": validSignature,
      },
      body: rawBody,
    });
    const data = await res.json();
    console.log(`Test 7 [POST valid signature incoming message] -> HTTP ${res.status}`, data);
    assert.equal(res.status, 200, "Valid incoming message event must return HTTP 200");
    assert.equal(data.success, true);
    assert.equal(data.processedMessages, 1);
    console.log("✅ Test 7 PASSED: Incoming customer message processed with HTTP 200");
  }

  // Test 8: Ensure endpoint does not return 404
  {
    const res = await fetch(`${BASE_URL}/api/whatsapp/webhook`, { method: "OPTIONS" });
    console.log(`Test 8 [Endpoint exists check] -> HTTP ${res.status}`);
    assert.notEqual(res.status, 404, "Endpoint must exist and never return 404");
    console.log("✅ Test 8 PASSED: Endpoint is active, mounted and accessible");
  }

  console.log("------------------------------------------------------------");
  console.log("ALL REAL HTTP WEBHOOK INTEGRATION TESTS PASSED! 🎉");
  console.log("------------------------------------------------------------");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

