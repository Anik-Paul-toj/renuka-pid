import "server-only";
import { WhatsAppTransport } from "./types";
import { MetaWhatsAppAdapter } from "./meta-adapter";
import { MockWhatsAppTransport } from "./mock-adapter";

// Global mock singleton for unit testing across imports
let globalMockTransport: MockWhatsAppTransport | null = null;

export function getMockTransport(): MockWhatsAppTransport {
  if (!globalMockTransport) {
    globalMockTransport = new MockWhatsAppTransport();
  }
  return globalMockTransport;
}

export function resetMockTransport(): void {
  if (globalMockTransport) {
    globalMockTransport.reset();
  }
}

/**
 * Returns the configured WhatsApp transport adapter.
 * Uses MockWhatsAppTransport when MOCK_WHATSAPP is enabled (e.g., in test suites).
 */
export function getWhatsAppTransport(): WhatsAppTransport {
  if (process.env.MOCK_WHATSAPP === "true") {
    return getMockTransport();
  }
  return new MetaWhatsAppAdapter();
}
