import "server-only";
import fs from "fs/promises";
import path from "path";
import { SettingsInput, settingsSchema } from "@/lib/validations/settings";

export interface SettingsData extends SettingsInput {
  updatedAt: string;
  updatedBy: string;
}

export interface SystemStatusData {
  paymentGateway: {
    provider: string;
    isConfigured: boolean;
    mode: "test" | "live" | "not_configured";
  };
  emailService: {
    provider: string;
    isConfigured: boolean;
    isMock: boolean;
  };
  authService: {
    provider: string;
    isConfigured: boolean;
  };
}

export const DEFAULT_SETTINGS: SettingsData = {
  studioName: "Renuka Art Studio",
  instructorName: "Renuka Aggarwal",
  websiteUrl: "https://renukaartstudio.com",
  contactEmail: "contact@renukaartstudio.com",
  contactPhone: "+91 98765 43210",
  supportWhatsapp: "+91 98765 43210",
  defaultSenderName: "Renuka Art Studio",
  replyToEmail: "contact@renukaartstudio.com",
  updatedAt: "2026-09-25T12:00:00.000Z",
  updatedBy: "system",
};

const SETTINGS_FILE_PATH = path.join(process.cwd(), "data", "settings.json");

/**
 * Retrieves the persisted application settings.
 * Merges with default values to guarantee all fields are present.
 */
export async function getSettings(): Promise<SettingsData> {
  try {
    const rawData = await fs.readFile(SETTINGS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(rawData);
    
    // Safely validate parsed data against schema with defaults fallback
    const validated = settingsSchema.safeParse(parsed);
    if (validated.success) {
      return {
        ...DEFAULT_SETTINGS,
        ...validated.data,
        updatedAt: parsed.updatedAt || DEFAULT_SETTINGS.updatedAt,
        updatedBy: parsed.updatedBy || DEFAULT_SETTINGS.updatedBy,
      };
    }
    return DEFAULT_SETTINGS;
  } catch (error: any) {
    // If file does not exist yet (ENOENT), return defaults
    if (error.code === "ENOENT") {
      return DEFAULT_SETTINGS;
    }
    console.error("Error reading settings file:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Updates application settings.
 * Atomically writes to data/settings.json.
 */
export async function updateSettings(
  input: SettingsInput,
  updatedByEmail: string
): Promise<SettingsData> {
  const validated = settingsSchema.parse(input);

  const updatedRecord: SettingsData = {
    ...validated,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedByEmail,
  };

  const dirPath = path.dirname(SETTINGS_FILE_PATH);
  await fs.mkdir(dirPath, { recursive: true });

  // Atomic write via temp file then rename
  const tempPath = `${SETTINGS_FILE_PATH}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(updatedRecord, null, 2), "utf-8");
  await fs.rename(tempPath, SETTINGS_FILE_PATH);

  return updatedRecord;
}

/**
 * Returns read-only operational health and configuration state.
 * CRITICAL GUARANTEE: Never exposes API keys, secrets, or sensitive tokens.
 */
export function getSystemStatus(): SystemStatusData {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const hasRazorpay = !!(razorpayKeyId && razorpayKeySecret);

  let razorpayMode: "test" | "live" | "not_configured" = "not_configured";
  if (hasRazorpay) {
    razorpayMode = razorpayKeyId.startsWith("rzp_test") ? "test" : "live";
  }

  const resendApiKey = process.env.RESEND_API_KEY || "";
  const isMockResend =
    process.env.MOCK_RESEND === "true" ||
    process.env.NODE_ENV === "test" ||
    !resendApiKey ||
    resendApiKey === "re_your_resend_api_key";

  const isResendConfigured = !!resendApiKey && resendApiKey !== "re_your_resend_api_key";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

  return {
    paymentGateway: {
      provider: "Razorpay",
      isConfigured: hasRazorpay,
      mode: razorpayMode,
    },
    emailService: {
      provider: "Resend",
      isConfigured: isResendConfigured,
      isMock: isMockResend,
    },
    authService: {
      provider: "Supabase Auth & Database",
      isConfigured: isSupabaseConfigured,
    },
  };
}
