"use client";

import { useEffect, useState } from "react";

/**
 * PWAProvider — mounts once in the root layout.
 *
 * Responsibilities:
 * 1. Register /sw.js when the browser supports service workers.
 * 2. Detect when a new service worker version is waiting and notify the user.
 * 3. Render an unobtrusive "Update available" banner that lets the user refresh.
 *
 * This component is intentionally invisible on first render (SSR returns null),
 * so it cannot cause hydration mismatches.
 */
export function PWAProvider() {
  const [updateReady, setUpdateReady] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Service workers require HTTPS. In Next.js dev mode the SW script
    // is served through the HMR pipeline and will fail to register —
    // this is expected. Skip registration entirely in development.
    if (process.env.NODE_ENV === "development") return;

    // Defer registration until after the page has loaded to avoid
    // competing with critical resources.
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // always fetch sw.js from network
        });

        setRegistration(reg);

        // If a new SW is already waiting (e.g. user kept tab open), show banner.
        if (reg.waiting) {
          setUpdateReady(true);
        }

        // Listen for a new SW that installs while the page is open.
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version installed and an older version is controlling the page.
              setUpdateReady(true);
            }
          });
        });
      } catch (err) {
        // Service worker registration failure is non-fatal — the site works
        // normally without it; just suppress the error in production.
        if (process.env.NODE_ENV === "development") {
          console.warn("[PWA] Service worker registration failed:", err);
        }
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
    }

    // Detect controller change (another tab may have already activated the new SW)
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  const handleUpdate = () => {
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    setUpdateReady(false);
  };

  const handleDismiss = () => setUpdateReady(false);

  if (!updateReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1.25rem",
        borderRadius: "10px",
        background: "#F7F4EC",
        border: "1.5px solid rgba(70,65,55,0.18)",
        boxShadow: "0 8px 32px rgba(50,45,35,0.14), 0 2px 8px rgba(50,45,35,0.08)",
        fontSize: "0.85rem",
        color: "#14120E",
        whiteSpace: "nowrap",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <span style={{ fontWeight: 500 }}>A new version is available</span>
      <button
        onClick={handleUpdate}
        type="button"
        style={{
          background: "#444C38",
          color: "#fff",
          border: "1.5px solid #2B3122",
          borderRadius: "6px",
          padding: "0.375rem 0.875rem",
          fontSize: "0.78rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "2px 2px 0 #24291D",
          flexShrink: 0,
        }}
      >
        Refresh
      </button>
      <button
        onClick={handleDismiss}
        type="button"
        aria-label="Dismiss update notification"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#6F6B61",
          padding: "0.25rem",
          fontSize: "1rem",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
