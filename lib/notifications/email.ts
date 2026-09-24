import "server-only";
import { Resend } from "resend";

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

/**
 * Returns a configured Resend client or null if not configured.
 * Never exposes credentials to client/browser.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_your_resend_api_key") {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Dispatches a transactional email via Resend with comprehensive error isolation.
 */
export async function sendTransactionalEmail(
  payload: SendEmailPayload
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  // Support automated testing environments without external network egress
  if (
    process.env.MOCK_RESEND === "true" ||
    (process.env.NODE_ENV === "test" && (!apiKey || apiKey === "re_your_resend_api_key"))
  ) {
    const mockId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      success: true,
      providerMessageId: mockId,
    };
  }

  if (!apiKey || apiKey === "re_your_resend_api_key") {
    return {
      success: false,
      error: "RESEND_API_KEY is not configured on the server.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const fromAddress =
      process.env.EMAIL_FROM || "Art & Soul Studio <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });

    if (error || !data?.id) {
      return {
        success: false,
        error: error?.message || "Failed to send email via Resend.",
      };
    }

    return {
      success: true,
      providerMessageId: data.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Unexpected network error during email dispatch.",
    };
  }
}
