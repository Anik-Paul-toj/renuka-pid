export interface WhatsAppConfig {
  apiVersion: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  webhookVerifyToken?: string;
  appSecret?: string;
}

export type WhatsAppDeliveryStatus = "sent" | "delivered" | "read" | "failed";

export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  status?: WhatsAppDeliveryStatus;
  error?: string;
  errorCode?: string;
  isConfigured?: boolean;
}

export interface SendWhatsAppTextPayload {
  to: string;
  body: string;
}

export interface WhatsAppTemplateParameter {
  type: "text" | "currency" | "date_time";
  text?: string;
  [key: string]: any;
}

export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "button";
  parameters: WhatsAppTemplateParameter[];
  sub_type?: string;
  index?: string;
}

export interface SendWhatsAppTemplatePayload {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppConfigStatus {
  isConfigured: boolean;
  message: string;
  missingVars: string[];
}

export interface WhatsAppTransport {
  isConfigured(): boolean;
  getConfigStatus(): WhatsAppConfigStatus;
  sendTextMessage(payload: SendWhatsAppTextPayload): Promise<WhatsAppSendResult>;
  sendTemplateMessage(payload: SendWhatsAppTemplatePayload): Promise<WhatsAppSendResult>;
}
