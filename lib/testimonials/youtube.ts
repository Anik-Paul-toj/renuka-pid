/**
 * YouTube URL Parsing, Validation, and Privacy-Enhanced Embed Utilities
 * Supports:
 * - Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
 * - Shortened URLs: https://youtu.be/VIDEO_ID
 * - YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
 * - Standard / No-cookie Embeds: https://www.youtube.com/embed/VIDEO_ID
 * - Raw 11-character video identifiers
 */

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extract and validate an 11-character YouTube video ID from various URL formats.
 * Returns null if the URL is invalid or from an unsupported provider.
 */
export function extractYouTubeVideoId(input: string | null | undefined): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Check if the input is already a direct 11-character video ID
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const urlString = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    // 2. youtu.be/<id>
    if (hostname === "youtu.be") {
      const pathname = parsed.pathname.replace(/^\/+/, "");
      const videoId = pathname.split("/")[0]?.split("?")[0]?.split("&")[0];
      if (videoId && YOUTUBE_ID_REGEX.test(videoId)) {
        return videoId;
      }
      return null;
    }

    // 3. youtube.com, m.youtube.com, youtube-nocookie.com
    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtube-nocookie.com"
    ) {
      // /watch?v=<id>
      if (parsed.pathname === "/watch" || parsed.pathname === "/watch_popup") {
        const videoId = parsed.searchParams.get("v");
        if (videoId && YOUTUBE_ID_REGEX.test(videoId)) {
          return videoId;
        }
        return null;
      }

      // /shorts/<id>
      if (parsed.pathname.startsWith("/shorts/")) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const videoId = segments[1];
        if (videoId && YOUTUBE_ID_REGEX.test(videoId)) {
          return videoId;
        }
        return null;
      }

      // /embed/<id>
      if (parsed.pathname.startsWith("/embed/")) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const videoId = segments[1];
        if (videoId && YOUTUBE_ID_REGEX.test(videoId)) {
          return videoId;
        }
        return null;
      }

      // /v/<id>
      if (parsed.pathname.startsWith("/v/")) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const videoId = segments[1];
        if (videoId && YOUTUBE_ID_REGEX.test(videoId)) {
          return videoId;
        }
        return null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns a privacy-enhanced YouTube embed URL (youtube-nocookie.com).
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options: { autoplay?: boolean; rel?: number } = {}
): string {
  const { autoplay = true, rel = 0 } = options;
  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  params.set("rel", String(rel));
  params.set("modestbranding", "1");
  params.set("playsinline", "1");

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Returns the standard YouTube video thumbnail image URL.
 * hqdefault (480x360) is guaranteed to exist for all valid YouTube videos.
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: "hq" | "mq" | "maxres" = "hq"
): string {
  const filename = quality === "maxres" ? "maxresdefault.jpg" : quality === "mq" ? "mqdefault.jpg" : "hqdefault.jpg";
  return `https://i.ytimg.com/vi/${videoId}/${filename}`;
}
