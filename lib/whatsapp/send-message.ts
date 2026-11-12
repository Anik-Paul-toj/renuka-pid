import "server-only";
import { getWhatsAppTransport } from "./client";
import {
  WhatsAppTransport,
  WhatsAppSendResult,
  SendWhatsAppTemplatePayload,
  SendWhatsAppTextPayload,
} from "./types";
import { buildMetaTemplateComponents } from "./templates";

export interface SendTemplateOptions {
  to: string;
  templateName: string;
  languageCode?: string;
  parameters?: string[];
  transport?: WhatsAppTransport;
}

export interface SendTextOptions {
  to: string;
  body: string;
  transport?: WhatsAppTransport;
}

/**
 * Sends a WhatsApp template message using the configured WhatsApp transport.
 * Automatically wraps string parameters into Meta's body component format.
 */
export async function sendWhatsAppTemplate(
  options: SendTemplateOptions
): Promise<WhatsAppSendResult> {
  const transport = options.transport || getWhatsAppTransport();

  const payload: SendWhatsAppTemplatePayload = {
    to: options.to,
    templateName: options.templateName,
    languageCode: options.languageCode || "en",
    components: options.parameters ? buildMetaTemplateComponents(options.parameters) : undefined,
  };

  return transport.sendTemplateMessage(payload);
}

/**
 * Sends a freeform text WhatsApp message (only valid within 24h customer service window).
 */
export async function sendWhatsAppText(
  options: SendTextOptions
): Promise<WhatsAppSendResult> {
  const transport = options.transport || getWhatsAppTransport();

  const payload: SendWhatsAppTextPayload = {
    to: options.to,
    body: options.body,
  };

  return transport.sendTextMessage(payload);
}

