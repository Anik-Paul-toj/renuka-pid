import "server-only";
import {
  WhatsAppTransport,
  WhatsAppConfigStatus,
  SendWhatsAppTextPayload,
  SendWhatsAppTemplatePayload,
  WhatsAppSendResult,
} from "./types";

/**
 * Normalizes a phone number for Meta WhatsApp Cloud API.
 * Meta expects digits only, including country code, without '+' or formatting.
 * Example: "+91 98765-43210" -> "919876543210"
 */
export function normalizeWhatsAppNumber(rawPhone: string): string {
  return rawPhone.replace(/\D/g, "");
}

/**
 * Validates whether a phone number meets international standards (E.164 format: 10-15 digits).
 */
export function isValidWhatsAppNumber(phone: string): boolean {
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

  constructor(overrides?: {
    apiVersion?: string;
    phoneNumberId?: string;
    accessToken?: string;
    businessAccountId?: string;
  }) {
    this.apiVersion = overrides?.apiVersion || process.env.WHATSAPP_API_VERSION || "v21.0";
    this.phoneNumberId = overrides?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken =
      overrides?.accessToken ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_API_TOKEN;
    this.businessAccountId = overrides?.businessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  }

  public isConfigured(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken);
  }

  public getConfigStatus(): WhatsAppConfigStatus {
    const missing: string[] = [];
    if (!this.phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
    if (!this.accessToken) missing.push("WHATSAPP_API_TOKEN");

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

    return this.executePostRequest(url, requestBody);
  }

  private async executePostRequest(url: string, body: any): Promise<WhatsAppSendResult> {
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
