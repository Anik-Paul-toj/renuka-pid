import {
  WhatsAppTransport,
  WhatsAppConfigStatus,
  SendWhatsAppTextPayload,
  SendWhatsAppTemplatePayload,
  WhatsAppSendResult,
} from "./types";
import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "./meta-adapter";

export interface MockDispatchedMessage {
  type: "text" | "template";
  to: string;
  normalizedTo: string;
  body?: string;
  templateName?: string;
  languageCode?: string;
  components?: any[];
  timestamp: string;
}

export class MockWhatsAppTransport implements WhatsAppTransport {
  public dispatched: MockDispatchedMessage[] = [];
  public forceConfigured: boolean = true;
  public simulateFailure: boolean = false;
  public failureMessage: string = "Simulated WhatsApp provider failure.";
  public failureCode: string = "SIMULATED_FAILURE";
  public simulateTimeout: boolean = false;

  public reset(): void {
    this.dispatched = [];
    this.forceConfigured = true;
    this.simulateFailure = false;
    this.simulateTimeout = false;
  }

  public isConfigured(): boolean {
    return this.forceConfigured;
  }

  public getConfigStatus(): WhatsAppConfigStatus {
    if (!this.forceConfigured) {
      return {
        isConfigured: false,
        message: "WhatsApp is not configured. Add the required server-side WhatsApp Business API configuration before sending.",
        missingVars: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"],
      };
    }

    return {
      isConfigured: true,
      message: "Mock WhatsApp Business API is active (Testing Mode).",
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

    if (this.simulateTimeout) {
      return {
        success: false,
        error: "WhatsApp provider request timed out. Please try again later.",
        errorCode: "PROVIDER_TIMEOUT",
      };
    }

    if (this.simulateFailure) {
      return {
        success: false,
        error: this.failureMessage,
        errorCode: this.failureCode,
      };
    }

    const providerMessageId = `mock_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.dispatched.push({
      type: "text",
      to: payload.to,
      normalizedTo: normalizeWhatsAppNumber(payload.to),
      body: payload.body,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      providerMessageId,
      status: "sent",
    };
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

    if (this.simulateTimeout) {
      return {
        success: false,
        error: "WhatsApp provider request timed out. Please try again later.",
        errorCode: "PROVIDER_TIMEOUT",
      };
    }

    if (this.simulateFailure) {
      return {
        success: false,
        error: this.failureMessage,
        errorCode: this.failureCode,
      };
    }

    const providerMessageId = `mock_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.dispatched.push({
      type: "template",
      to: payload.to,
      normalizedTo: normalizeWhatsAppNumber(payload.to),
      templateName: payload.templateName,
      languageCode: payload.languageCode || "en",
      components: payload.components,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      providerMessageId,
      status: "sent",
    };
  }
}
