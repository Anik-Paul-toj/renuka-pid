import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Normalizes phone numbers to standard digit strings for reliable comparison.
 * Handles Indian country codes (+91, 91), leading zeros, and formatting characters.
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  // Extract all digit characters
  const digits = phone.replace(/\D/g, "");

  // If 12 digits starting with Indian country code 91, extract national 10 digits
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.substring(2);
  }

  // If 11 digits starting with 0, extract national 10 digits
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.substring(1);
  }

  return digits;
}

/**
 * Compares two phone numbers securely, matching on normalized national number
 * or last 10 significant digits.
 *
 * NOTE ON GUEST IDENTITY VERIFICATION:
 * Phone-number equality verifies possession of matching profile attributes on file,
 * but does NOT constitute an active possession challenge (such as SMS OTP).
 * Where higher assurance is required without an external SMS provider, the system
 * also supports matching the private Foundation booking confirmation receipt reference.
 */
export function comparePhoneNumbers(
  phoneA: string | null | undefined,
  phoneB: string | null | undefined
): boolean {
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // If numbers have international prefixes with different lengths, compare last 10 digits
  if (normA.length >= 10 && normB.length >= 10) {
    return normA.slice(-10) === normB.slice(-10);
  }

  return false;
}

export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

export interface CreditTokenPayload {
  email: string;
  phone: string;
  targetCourseId: string;
  sourceBookingId: string;
  ruleId: string;
  discountAmountPaise: number;
  exp: number; // Unix timestamp ms
  nonce: string; // Unique UUID
}

export interface VerifyTokenResult {
  valid: boolean;
  error?: string;
  payload?: CreditTokenPayload;
}

function getSecretKey(): string {
  return (
    process.env.CREDIT_VERIFICATION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "renuka-art-studio-foundation-credit-secret-2026"
  );
}

/**
 * Generates a signed, tamper-proof Identity Verification Token.
 * Binds eligibility strictly to the customer's phone, email, and target course.
 */
export function createCreditVerificationToken(params: {
  email: string;
  phone: string;
  targetCourseId: string;
  sourceBookingId: string;
  ruleId: string;
  discountAmountPaise: number;
  ttlMs?: number;
}): string {
  const ttl = params.ttlMs ?? 15 * 60 * 1000; // 15-minute validity window
  const payload: CreditTokenPayload = {
    email: normalizeEmail(params.email),
    phone: normalizePhoneNumber(params.phone),
    targetCourseId: params.targetCourseId,
    sourceBookingId: params.sourceBookingId,
    ruleId: params.ruleId,
    discountAmountPaise: params.discountAmountPaise,
    exp: Date.now() + ttl,
    nonce: crypto.randomUUID(),
  };

  const secret = getSecretKey();
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies the cryptographic integrity, expiration, and identity binding of a credit verification token.
 * Single-use redemption is persistently enforced via PostgreSQL (credit_token_redemptions table)
 * and the atomic reserve_seat_atomic RPC, ensuring safe multi-instance Vercel execution without in-memory state.
 */
export async function verifyCreditVerificationToken(
  token: string,
  expected: {
    email: string;
    phone?: string | null;
    targetCourseId: string;
  }
): Promise<VerifyTokenResult> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing or invalid token format." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Malformed verification token." };
  }

  const [encodedPayload, providedSignature] = parts;
  const secret = getSecretKey();

  // 1. Verify HMAC Signature using timing-safe comparison
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  const providedSigBuf = Buffer.from(providedSignature);
  const expectedSigBuf = Buffer.from(expectedSignature);

  if (
    providedSigBuf.length !== expectedSigBuf.length ||
    !crypto.timingSafeEqual(providedSigBuf, expectedSigBuf)
  ) {
    return { valid: false, error: "Cryptographic signature verification failed (tampered token)." };
  }

  // 2. Decode and validate JSON payload
  let payload: CreditTokenPayload;
  try {
    const jsonStr = Buffer.from(encodedPayload, "base64url").toString("utf8");
    payload = JSON.parse(jsonStr);
  } catch {
    return { valid: false, error: "Failed to parse token payload." };
  }

  // 3. Expiration Check
  const now = Date.now();
  if (payload.exp <= now) {
    return { valid: false, error: "Identity verification token has expired." };
  }

  // 4. Identity & Scope Matching
  if (normalizeEmail(payload.email) !== normalizeEmail(expected.email)) {
    return { valid: false, error: "Token email does not match customer booking email." };
  }

  if (expected.phone) {
    if (!comparePhoneNumbers(payload.phone, expected.phone)) {
      return { valid: false, error: "Token phone does not match customer booking phone." };
    }
  }

  if (payload.targetCourseId !== expected.targetCourseId) {
    return { valid: false, error: "Token course does not match target booking course." };
  }

  // 5. Persistent Pre-Flight Replay Check in PostgreSQL
  // Checks credit_token_redemptions table so all Vercel instances share authoritative state
  try {
    const adminClient = createAdminClient();
    const { data: existingRedemption, error: dbErr } = await adminClient
      .from("credit_token_redemptions")
      .select("token_nonce")
      .eq("token_nonce", payload.nonce)
      .maybeSingle();

    if (!dbErr && existingRedemption) {
      return {
        valid: false,
        error: "Verification token has already been redeemed (replay detected).",
      };
    }
  } catch {
    // If table not yet migrated, authoritative check is deferred to reserve_seat_atomic
  }

  return { valid: true, payload };
}
