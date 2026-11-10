/**
 * Branded offline fallback page.
 * Served by the service worker when a navigation request fails offline.
 * This is a static Server Component — no onClick here; the retry button
 * uses a separate Client Component to avoid event-handler issues.
 */
import { OfflineRetryButton } from "./OfflineRetryButton";

export const metadata = {
  title: "You're offline — Renuka Art Studio",
};

export default function OfflinePage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              min-height: 100%;
              background-color: #F7F4EC;
              color: #14120E;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            .page {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 2rem;
              text-align: center;
              gap: 1.5rem;
            }
            .logo {
              width: min(180px, 50vw);
              aspect-ratio: 1/1;
              object-fit: contain;
            }
            .icon-wrap {
              width: 72px; height: 72px;
              border-radius: 50%;
              background: #E8DED0;
              border: 1.5px solid rgba(70,65,55,0.15);
              display: flex; align-items: center; justify-content: center;
              font-size: 2rem;
            }
            h1 {
              font-size: clamp(1.4rem, 4vw, 2rem);
              font-weight: 700;
              letter-spacing: -0.01em;
              color: #14120E;
            }
            .body-text {
              font-size: clamp(0.9rem, 2.5vw, 1rem);
              color: #38352E;
              max-width: 400px;
              line-height: 1.65;
            }
            .divider {
              width: 48px; height: 1px;
              background: #C8D1C7;
            }
            .hint {
              font-size: 0.8rem;
              color: #6F6B61;
              max-width: 340px;
              line-height: 1.6;
            }
          `,
        }}
      />
      <div className="page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/renuka-art-studio-logo-black.png"
          alt="Renuka Art Studio"
          className="logo"
          width={512}
          height={512}
        />

        <div className="icon-wrap" role="img" aria-label="No connection">
          📡
        </div>

        <h1>You&rsquo;re offline</h1>

        <p className="body-text">
          It looks like you&rsquo;ve lost your internet connection. Please check
          your network and try again.
        </p>

        <div className="divider" />

        <OfflineRetryButton />

        <p className="hint">
          Once you&rsquo;re back online, the page will load normally.
        </p>
      </div>
    </>
  );
}
