"use client";

import React, { useEffect, useState } from "react";
import { masterclassData } from "@/data/content";
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from "@/lib/testimonials/youtube";

const SECTION_URL = "/api/admin/landing-content/videoSection";

export function YouTubeVideoManager({ canPublish }: { canPublish: boolean }) {
  const [section, setSection] = useState<any>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(SECTION_URL, { cache: "no-store" });
        const json = await res.json();
        // Base on the live (published) content so unrelated drafts never go live.
        const base = json?.data?.published ?? masterclassData.videoSection;
        setSection(base);
        setInput(base.youtubeId ?? "");
      } catch {
        setSection(masterclassData.videoSection);
        setInput(masterclassData.videoSection.youtubeId ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const videoId = extractYouTubeVideoId(input);

  async function save() {
    if (!videoId || !section) return;
    setSaving(true);
    setMessage(null);
    // Keep a custom thumbnail, but refresh it when it is a YouTube-generated one.
    const thumb: string = section.videoThumbnail || "";
    const content = {
      ...section,
      youtubeId: videoId,
      videoThumbnail:
        !thumb || thumb.includes("ytimg.com") || thumb.includes("img.youtube.com")
          ? getYouTubeThumbnailUrl(videoId, "maxres")
          : thumb,
    };
    try {
      const res = await fetch(SECTION_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", content }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error?.message || "Save failed");
      setSection(content);
      setInput(videoId);
      setMessage({ ok: true, text: "Saved. The landing page video is updated." });
    } catch (e: any) {
      setMessage({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">YT Video</h1>
        <p className="text-sm text-gray-500">
          The YouTube video shown in the video section of the landing page.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="yt-link" className="text-sm font-medium">
          YouTube link or video ID
        </label>
        <input
          id="yt-link"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        {input && !videoId && (
          <p className="text-sm text-red-600">That doesn&apos;t look like a valid YouTube link.</p>
        )}
      </div>

      {videoId && (
        <div className="aspect-video overflow-hidden rounded-lg border">
          <iframe
            src={getYouTubeEmbedUrl(videoId)}
            title="Video preview"
            className="h-full w-full"
            allowFullScreen
          />
        </div>
      )}

      <button
        onClick={save}
        disabled={!videoId || saving || !canPublish}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save & publish"}
      </button>
      {!canPublish && (
        <p className="text-sm text-gray-500">Only administrators can publish changes.</p>
      )}
      {message && (
        <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
      )}
    </div>
  );
}
