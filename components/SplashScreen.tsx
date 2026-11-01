"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Branded full-screen loading overlay.
 *
 * Behaviour:
 * - Shown immediately on full page load / browser refresh.
 * - Fades out once window.load fires (all resources ready), with a 4 s hard cap.
 * - Completely removed from the DOM after the fade so it never blocks interaction.
 * - Respects prefers-reduced-motion (instant hide instead of animated fade).
 * - Skipped entirely on /admin/** routes.
 * - Uses a plain <img> tag (not Next.js Image) to avoid hydration issues on
 *   the very first render before the React tree is fully hydrated.
 */
export function SplashScreen() {
  const pathname = usePathname();

  // Never show on admin routes — keep admin UX unaffected
  const isAdmin = pathname?.startsWith("/admin");

  // visible   : overlay is fully opaque and blocking interaction
  // fading    : opacity transition playing, pointer-events already disabled
  // gone      : removed from DOM entirely
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">(
    isAdmin ? "gone" : "visible"
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isAdmin) return;

    // Respect prefers-reduced-motion — hide immediately without animation
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dismiss = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (reducedMotion) {
        setPhase("gone");
        return;
      }
      setPhase("fading");
      // Remove from DOM after the CSS transition completes (700 ms)
      fadeTimerRef.current = setTimeout(() => setPhase("gone"), 750);
    };

    // Primary trigger: window has fully loaded (all resources)
    if (document.readyState === "complete") {
      // Already loaded (e.g. fast cache hit) — dismiss after a brief moment
      // so the logo is still visible for at least 400 ms
      timerRef.current = setTimeout(dismiss, 400);
    } else {
      window.addEventListener("load", dismiss, { once: true });
    }

    // Hard cap: 4 seconds regardless of resource state
    const hardCap = setTimeout(dismiss, 4000);

    return () => {
      window.removeEventListener("load", dismiss);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      clearTimeout(hardCap);
    };
  }, [isAdmin]);

  if (phase === "gone") return null;

  return (
    <>
      {/* Inject the keyframe animation via a style tag — avoids needing globals.css changes */}
      <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes splashBarGrow {
          from { width: 0%; }
          to   { width: 72%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .splash-logo-animate { animation: none !important; opacity: 1 !important; }
          .splash-bar-animate  { animation: none !important; width: 72% !important; }
        }
      `}</style>

      <div
        role="status"
        aria-label="Loading Renuka Art Studio"
        aria-live="polite"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F4EC",     // warm cream — matches site background
          // Fade-out transition when phase === "fading"
          opacity: phase === "fading" ? 0 : 1,
          transition: phase === "fading" ? "opacity 700ms ease-in-out" : "none",
          // Disable interaction as soon as fade begins
          pointerEvents: phase === "fading" ? "none" : "auto",
          // Prevent any layout overflow
          overflow: "hidden",
        }}
      >
        {/* Subtle botanical watercolour ambient wash — matches hero aesthetic */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(200,209,199,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Logo — centred, large, width-constrained for all breakpoints */}
        {/* 
          The PNG canvas is 1:1 square. At max-width 260px on desktop the
          visible mark (text + red accent) renders at ~208px — clearly legible.
          On mobile at max-width 180px the mark is ~144px — still prominent.
        */}
        <div
          className="splash-logo-animate"
          style={{
            animation: "splashLogoIn 600ms cubic-bezier(0.22,1,0.36,1) both",
            animationDelay: "80ms",
            width: "min(260px, 55vw)",
            aspectRatio: "1 / 1",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Plain <img> avoids Next.js Image hydration timing issues on splash */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/renuka-art-studio-logo-black.png"
            alt="Renuka Art Studio logo"
            width={1080}
            height={1080}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              userSelect: "none",
            }}
            draggable={false}
          />
        </div>

        {/* Thin refined loading bar — sits below the logo */}
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: "2rem",
            width: "min(240px, 50vw)",
            height: "2px",
            borderRadius: "9999px",
            backgroundColor: "rgba(68,76,56,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            className="splash-bar-animate"
            style={{
              height: "100%",
              borderRadius: "9999px",
              background: "linear-gradient(90deg, #444C38 0%, #B93821 100%)",
              animation: "splashBarGrow 3200ms cubic-bezier(0.4,0,0.2,1) both",
              animationDelay: "200ms",
            }}
          />
        </div>
      </div>
    </>
  );
}
