"use client";

import { useEffect, useState } from "react";

/**
 * InstallPrompt — an unobtrusive "Install App" banner.
 *
 * Behaviour:
 * - Hidden when the app is already running in standalone mode (already installed).
 * - On Chromium browsers: captures beforeinstallprompt, shows a banner with
 *   a one-click "Install" button.
 * - On iOS Safari: shows instructions for "Add to Home Screen" (Safari does not
 *   support the beforeinstallprompt API).
 * - Dismissed state is persisted in sessionStorage so the banner doesn't
 *   reappear within the same session, and in localStorage to prevent showing
 *   it again for 30 days after a dismiss.
 * - Entirely removed from DOM when not relevant (no SSR output → no hydration risk).
 */

type Platform = "chromium" | "ios" | null;

const DISMISSED_KEY = "ras-pwa-install-dismissed";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw) as { ts: number };
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({ ts: Date.now() }));
  } catch {
    // ignore storage errors
  }
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect standalone mode — app is already installed
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(standalone);

    if (standalone) return; // already installed — do nothing
    if (isDismissed()) return; // user dismissed recently

    // Detect iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;

    if (isIOS) {
      // Show iOS instructions after a brief delay
      const t = setTimeout(() => {
        setPlatform("ios");
        setVisible(true);
      }, 3000);
      return () => clearTimeout(t);
    }

    // Chromium: capture beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("chromium");
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for successful install
    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // Show native browser install prompt
    (deferredPrompt as BeforeInstallPromptEvent).prompt?.();
    const { outcome } = await (deferredPrompt as BeforeInstallPromptEvent).userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (outcome === "accepted") {
      markDismissed(); // hide for a while even if accepted
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    markDismissed();
  };

  // Not mounted, already installed, or no relevant platform — render nothing
  if (isStandalone || !visible || !platform) return null;

  return (
    <div
      role="complementary"
      aria-label="Install Renuka Art Studio app"
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
        zIndex: 9990,
        maxWidth: "min(360px, calc(100vw - 2.5rem))",
        background: "#FAF8F2",
        border: "1.5px solid rgba(70,65,55,0.16)",
        borderRadius: "12px",
        padding: "1.125rem 1.25rem",
        boxShadow:
          "0 12px 40px rgba(50,45,35,0.14), 0 2px 8px rgba(50,45,35,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-72x72.png"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          style={{ borderRadius: "8px", flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#14120E",
              lineHeight: 1.3,
            }}
          >
            Renuka Art Studio
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "#6F6B61",
              lineHeight: 1.4,
              marginTop: "0.1rem",
            }}
          >
            Install app for a better experience
          </div>
        </div>
        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Dismiss install prompt"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#9C9890",
            padding: "0.25rem",
            fontSize: "1rem",
            lineHeight: 1,
            flexShrink: 0,
            alignSelf: "flex-start",
          }}
        >
          ✕
        </button>
      </div>

      {/* Platform-specific content */}
      {platform === "chromium" && (
        <button
          onClick={handleInstall}
          type="button"
          style={{
            background: "#444C38",
            color: "#fff",
            border: "1.5px solid #2B3122",
            borderRadius: "8px",
            padding: "0.6875rem 1.25rem",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "3px 3px 0 #24291D, 4px 5px 12px rgba(36,41,29,0.28)",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <span>⬇</span> Install App
        </button>
      )}

      {platform === "ios" && (
        <p
          style={{
            fontSize: "0.8rem",
            color: "#38352E",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          To install: tap the{" "}
          <strong
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2em",
            }}
          >
            Share{" "}
            <span role="img" aria-label="share">
              ⎋
            </span>
          </strong>{" "}
          button in Safari, then choose{" "}
          <strong>
            &ldquo;Add to Home Screen&rdquo;{" "}
            <span role="img" aria-label="plus">
              ➕
            </span>
          </strong>
          .
        </p>
      )}
    </div>
  );
}

// Augment the Window interface locally for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt?: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
