import "server-only";
import {
  WhatsAppTransport,
  WhatsAppConfigStatus,
  SendWhatsAppTextPayload,
  SendWhatsAppTemplatePayload,
  WhatsAppSendResult,
  MetaApprovedTemplate,
} from "./types";

/**
 * Normalizes a phone number for Meta WhatsApp Cloud API.
 * Meta expects digits only, including country code, without '+' or formatting.
 * Handles Indian 10-digit mobile numbers by prepending the 91 country code.
 * Example: "+91 95991-09200" -> "919599109200"
 * Example: "9599109200" -> "919599109200"
 */
export function normalizeWhatsAppNumber(rawPhone: string): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");

  // If 10 digits starting with 6, 7, 8, or 9: assume Indian mobile and prefix 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  // If 11 digits starting with 0 followed by 6-9: strip 0 and prefix 91
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }

  return digits;
}

/**
 * Validates whether a phone number meets international standards (E.164 format: 10-15 digits).
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizeWhatsAppNumber(phone);
  return normalized.length >= 10 && normalized.length <= 15;
}

/**
 * Meta WhatsApp Business Platform (Cloud API) Transport Adapter.
 * Direct REST implementation over Meta Graph API.
 */
export class MetaWhatsAppAdapter implements WhatsAppTransport {
  private apiVersion: string;
  private phoneNumberId?: string;
  private accessToken?: string;
  private businessAccountId?: string;
  private appId?: string;
  private appSecret?: string;

  constructor(overrides?: {
    apiVersion?: string;
    phoneNumberId?: string;
    accessToken?: string;
    businessAccountId?: string;
    appId?: string;
    appSecret?: string;
  }) {
    this.apiVersion = (
      overrides?.apiVersion ||
      process.env.WHATSAPP_API_VERSION ||
      "v21.0"
    ).trim();
    this.phoneNumberId = (
      overrides?.phoneNumberId ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      ""
    ).trim() || undefined;
    this.accessToken = (
      overrides?.accessToken ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_API_TOKEN ||
      ""
    ).trim() || undefined;
    this.businessAccountId = (
      overrides?.businessAccountId ||
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
      ""
    ).trim() || undefined;
    this.appId = (
      overrides?.appId ||
      process.env.WHATSAPP_APP_ID ||
      ""
    ).trim() || undefined;
    this.appSecret = (
      overrides?.appSecret ||
      process.env.WHATSAPP_APP_SECRET ||
      ""
    ).trim() || undefined;
  }

  public isConfigured(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken);
  }

  public getConfigStatus(): WhatsAppConfigStatus {
    const missing: string[] = [];
    if (!this.phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
    if (!this.accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");

    if (missing.length > 0) {
      return {
        isConfigured: false,
        message: "WhatsApp is not configured. Add the required server-side WhatsApp Business API configuration before sending.",
        missingVars: missing,
      };
    }

    return {
      isConfigured: true,
      message: "WhatsApp Business Cloud API is configured.",
      missingVars: [],
    };
  }

  public async sendTextMessage(payload: SendWhatsAppTextPayload): Promise<WhatsAppSendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "WhatsApp is not configured. Add the required server-side WhatsApp Business API configuration before sending.",
        errorCode: "WHATSAPP_NOT_CONFIGURED",
        isConfigured: false,
      };
    }

    if (!payload.to || !isValidWhatsAppNumber(payload.to)) {
      return {
        success: false,
        error: "Invalid recipient phone number format. Please provide a valid phone number with country code.",
        errorCode: "INVALID_PHONE_NUMBER",
      };
    }

    const recipientNumber = normalizeWhatsAppNumber(payload.to);
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const requestBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientNumber,
      type: "text",
      text: {
        preview_url: false,
        body: payload.body,
      },
    };

    return this.executePostRequest(url, requestBody);
  }

  public async sendTemplateMessage(payload: SendWhatsAppTemplatePayload): Promise<WhatsAppSendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "WhatsApp is not configured. Add the required server-side WhatsApp Business API configuration before sending.",
        errorCode: "WHATSAPP_NOT_CONFIGURED",
        isConfigured: false,
      };
    }

    if (!payload.to || !isValidWhatsAppNumber(payload.to)) {
      return {
        success: false,
        error: "Invalid recipient phone number format. Please provide a valid phone number with country code.",
        errorCode: "INVALID_PHONE_NUMBER",
      };
    }

    const recipientNumber = normalizeWhatsAppNumber(payload.to);
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const requestBody: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientNumber,
      type: "template",
      template: {
        name: payload.templateName,
        language: {
          code: payload.languageCode || "en",
        },
      },
    };

    if (payload.components && payload.components.length > 0) {
      requestBody.template.components = payload.components;
    }

    const primaryResult = await this.executePostRequest(url, requestBody);

    // If template failed due to language mismatch (e.g., requested "en" but template is "en_US"), retry with "en_US"
    if (
      !primaryResult.success &&
      primaryResult.errorCode === "100" &&
      (primaryResult.error?.includes("language") || primaryResult.error?.includes("template")) &&
      payload.languageCode !== "en_US"
    ) {
      const retryBody = {
        ...requestBody,
        template: {
          ...requestBody.template,
          language: { code: "en_US" },
        },
      };
      return this.executePostRequest(url, retryBody);
    }

    return primaryResult;
  }

  /**
   * Fetches approved templates from Meta Graph API for the configured WhatsApp Business Account.
   */
  public async getApprovedTemplates(): Promise<MetaApprovedTemplate[]> {
    if (!this.accessToken || !this.businessAccountId) {
      return [];
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.businessAccountId}/message_templates?status=APPROVED&limit=100`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return [];

      const data = await response.json().catch(() => null);
      if (!data || !Array.isArray(data.data)) return [];

      return data.data.map((t: any) => ({
        name: t.name,
        status: t.status,
        language: t.language,
        category: t.category,
        components: t.components,
      }));
    } catch (err) {
      console.error("[Meta WhatsApp] Failed to fetch approved templates:", err);
      return [];
    }
  }

  private async executePostRequest(url: string, body: any, attempt: number = 1): Promise<WhatsAppSendResult> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const metaError = responseData?.error;
        const errorMessage = metaError?.message || `Meta Cloud API responded with status ${response.status}`;
        const errorCode = metaError?.code ? String(metaError.code) : "PROVIDER_ERROR";

        // Handle rate limiting (code 80007 / 429) or transient 500 error: retry once
        if (
          attempt === 1 &&
          (response.status === 429 || metaError?.code === 80007 || response.status >= 500)
        ) {
          await new Promise((r) => setTimeout(r, 1200));
          return this.executePostRequest(url, body, attempt + 1);
        }

        return {
          success: false,
          error: errorMessage,
          errorCode,
        };
      }

      const messageId = responseData?.messages?.[0]?.id;
      return {
        success: true,
        providerMessageId: messageId || `meta_${Date.now()}`,
        status: "sent",
      };
    } catch (err: any) {
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        return {
          success: false,
          error: "WhatsApp provider request timed out. Please try again later.",
          errorCode: "PROVIDER_TIMEOUT",
        };
      }

      return {
        success: false,
        error: err.message || "Failed to communicate with WhatsApp Business API.",
        errorCode: "NETWORK_ERROR",
      };
    }
  }
}
