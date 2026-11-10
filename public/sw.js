/**
 * Renuka Art Studio — Service Worker
 *
 * Caching strategy summary:
 *
 *  - App shell (HTML pages, JS, CSS):  Network-first with cache fallback
 *  - Static assets (icons, images):    Cache-first with network fallback
 *  - Google Fonts:                     Cache-first (long-lived)
 *  - Next.js static (_next/static):    Cache-first (content-hashed, safe forever)
 *  - Supabase / API routes:            Network-only (NEVER cached)
 *  - Razorpay / payment endpoints:     Network-only (NEVER cached)
 *  - Admin routes:                     Network-only (NEVER cached)
 *  - Booking API / payment API:        Network-only (NEVER cached)
 *
 * Offline fallback: /offline shown when a navigation fails with no cache hit.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `ras-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ras-runtime-${CACHE_VERSION}`;
const FONT_CACHE = `ras-fonts-${CACHE_VERSION}`;

/** Assets to pre-cache on install (app shell) */
const APP_SHELL = [
  "/",
  "/offline",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/images/renuka-art-studio-logo-black.png",
];

// ─── Patterns that must NEVER be cached ──────────────────────────────────────

/** Returns true if the request must always go to the network, no cache. */
function isNeverCache(url) {
  const { hostname, pathname } = url;

  // Supabase backend
  if (hostname.includes("supabase.co")) return true;
  if (hostname.includes("supabase.io")) return true;

  // Razorpay checkout / payment API
  if (hostname.includes("razorpay.com")) return true;
  if (hostname.includes("api.razorpay.com")) return true;

  // WhatsApp API
  if (hostname.includes("api.whatsapp.com")) return true;
  if (hostname.includes("wa.me")) return true;

  // Resend (email API)
  if (hostname.includes("resend.com")) return true;

  // Cloudinary image delivery — allow caching (read-only assets)
  // but never cache upload/admin endpoints
  if (hostname.includes("cloudinary.com") && pathname.includes("/upload/")) {
    return false; // allow cache-first for delivered images
  }
  if (hostname.includes("cloudinary.com") && pathname.includes("/admin/")) {
    return true;
  }

  // All /api/* routes — never cache (server-authoritative data)
  if (pathname.startsWith("/api/")) return true;

  // Admin UI routes — never cache
  if (pathname.startsWith("/admin")) return true;

  // Booking pages — never cache (must always be fresh)
  if (pathname.startsWith("/booking")) return true;

  return false;
}

/** Returns true for Next.js static assets that are safe to cache forever. */
function isNextStatic(url) {
  return url.pathname.startsWith("/_next/static/");
}

/** Returns true for image/font/static assets suitable for cache-first. */
function isCacheFirstAsset(url) {
  const { pathname, hostname } = url;

  if (isNextStatic(url)) return true;

  // Public icons and images
  if (pathname.startsWith("/icons/")) return true;
  if (pathname.startsWith("/images/")) return true;

  // Google Fonts stylesheet + font files
  if (hostname === "fonts.googleapis.com") return true;
  if (hostname === "fonts.gstatic.com") return true;

  // Cloudinary image CDN (non-admin)
  if (hostname.includes("res.cloudinary.com")) return true;

  // Static file extensions
  const ext = pathname.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg", "ico", "woff", "woff2", "ttf", "otf"].includes(ext ?? "")) {
    return true;
  }

  return false;
}

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  const keepCaches = new Set([STATIC_CACHE, RUNTIME_CACHE, FONT_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !keepCaches.has(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return; // ignore malformed URLs
  }

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith("http")) return;

  // ── Never cache: network-only ──────────────────────────────────────────────
  if (isNeverCache(url)) {
    // Fetch directly; do not intercept with any cache logic
    return;
  }

  // ── Cache-first: static assets ────────────────────────────────────────────
  if (isCacheFirstAsset(url)) {
    event.respondWith(cacheFirst(request, url));
    return;
  }

  // ── Network-first: HTML navigation + everything else ──────────────────────
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  // ── Network-first: other same-origin requests ─────────────────────────────
  event.respondWith(networkFirst(request));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/**
 * Cache-first: serve from cache, fall back to network, then populate cache.
 * Never returns a stale entry for versioned assets because the filename
 * contains a content hash (_next/static/**).
 */
async function cacheFirst(request, url) {
  const cacheName = url.hostname !== self.location.hostname
    ? FONT_CACHE
    : RUNTIME_CACHE;

  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.status === 200) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network-first for navigations: try network, fall back to cached version,
 * and finally serve the offline page.
 */
async function networkFirstNavigate(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try the cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fall back to the offline page
    const offline = await caches.match("/offline");
    if (offline) return offline;

    // Last resort — a minimal inline response
    return new Response(
      "<html><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>",
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

/**
 * Network-first for non-navigation requests: try network, fall back to cache.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("Network request failed and no cache available");
  }
}

// ─── Message channel (update notifications) ───────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
