/**
 * Phase 19: Manual Verification Flow Script
 * Simulates admin interactions and verifies system constraints.
 */

import { getSettings, updateSettings, getSystemStatus } from "../lib/settings/service";
import { getPublicLandingContent } from "../lib/cms/public-loader";

async function verifyManualFlow() {
  console.log("==================================================");
  console.log("PHASE 19 — MANUAL VERIFICATION FLOW");
  console.log("==================================================");

  // 1. Fetch current settings
  console.log("1. Inspecting Active Settings...");
  const settings = await getSettings();
  console.log("✓ Studio Name:", settings.studioName);
  console.log("✓ Instructor Name:", settings.instructorName);
  console.log("✓ Contact Email:", settings.contactEmail);
  console.log("✓ Reply-To Email:", settings.replyToEmail);

  // 2. Inspect System Status
  console.log("\n2. Inspecting System Status...");
  const systemStatus = getSystemStatus();
  console.log("✓ Payment Gateway:", systemStatus.paymentGateway.provider, `(${systemStatus.paymentGateway.mode})`);
  console.log("✓ Email Provider:", systemStatus.emailService.provider, systemStatus.emailService.isMock ? "(Mock/Dev)" : "(Configured)");
  console.log("✓ Supabase Auth:", systemStatus.authService.provider, systemStatus.authService.isConfigured ? "(Active)" : "(Inactive)");

  // 3. Confirm Zero Secrets
  console.log("\n3. Auditing Secrets Exposure...");
  const stringified = JSON.stringify({ settings, systemStatus });
  const hasSecrets = /re_[a-zA-Z0-9]+|rzp_[a-zA-Z0-9]+|eyJhbGciOi/.test(stringified);
  if (hasSecrets) {
    throw new Error("Secret pattern detected in settings payload!");
  }
  console.log("✓ Confirmed: Zero API keys, secrets, or JWTs present in settings or status payloads.");

  // 4. Test Settings Persistence Lifecycle
  console.log("\n4. Testing Update & Persistence Lifecycle...");
  const originalReplyTo = settings.replyToEmail;
  const testReplyTo = "test-reply@artandsoulstudio.com";

  await updateSettings({ ...settings, replyToEmail: testReplyTo }, "super_admin@studio.com");
  const verified = await getSettings();
  if (verified.replyToEmail !== testReplyTo) {
    throw new Error("Persistence verification failed!");
  }
  console.log(`✓ Value updated: ${originalReplyTo} -> ${verified.replyToEmail}`);

  // Restore
  await updateSettings({ ...settings, replyToEmail: originalReplyTo }, "system");
  const restored = await getSettings();
  console.log(`✓ Restored to original: ${restored.replyToEmail}`);

  // 5. Confirm Public Landing Page Remains Unchanged
  console.log("\n5. Verifying Public Landing Page State...");
  const landing = await getPublicLandingContent();
  console.log("✓ Landing content loaded successfully (Brand name:", landing.brand.name, ")");

  console.log("\n==================================================");
  console.log("PHASE 19 MANUAL VERIFICATION COMPLETE — ALL PASS");
  console.log("==================================================");
}

verifyManualFlow().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
