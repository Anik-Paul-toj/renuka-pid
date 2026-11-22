"use client";

import React, { useEffect, useState } from "react";
import { ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { masterclassData } from "@/data/content";

const SECTION_URL = "/api/admin/landing-content/hero";

export function HeroImageCard({ canPublish }: { canPublish: boolean }) {
  const [section, setSection] = useState<any>(null);
  const [image, setImage] = useState("");
  const [savedImage, setSavedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      let base: any = masterclassData.hero;
      try {
        const res = await fetch(SECTION_URL, { cache: "no-store" });
        const json = await res.json();
        // Base on live (published) content so unrelated drafts never go live.
        base = json?.data?.published ?? base;
      } catch {
        /* fall back to static defaults */
      }
      setSection(base);
      setImage(base.instructorImage ?? "");
      setSavedImage(base.instructorImage ?? "");
      setLoading(false);
    })();
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/cms/image", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Upload failed.");
      setImage(json.url);
    } catch (err: any) {
      setMessage({ ok: false, text: err.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!image.trim() || !section) return;
    setSaving(true);
    setMessage(null);
    const content = { ...section, instructorImage: image.trim() };
    try {
      const res = await fetch(SECTION_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", content }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error?.message || "Save failed");
      setSection(content);
      setSavedImage(content.instructorImage);
      setMessage({ ok: true, text: "Saved. The hero image is updated on the landing page." });
    } catch (err: any) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-[#464137]/10">
        <ImageIcon className="size-4 text-[#68705A]" />
        <h2 className="font-serif text-base font-bold text-[#292923]">Hero Profile Image</h2>
      </div>
      <p className="text-xs text-[#6F6B61]">
        The photo of the instructor shown in the hero section of the landing page.
      </p>

      {loading ? (
        <p className="text-xs text-[#6F6B61]">Loading…</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Hero profile preview"
                className="h-40 w-32 shrink-0 rounded-lg border border-[#464137]/20 object-cover"
              />
            )}
            <div className="flex-1 w-full space-y-3">
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                disabled={!canPublish}
                placeholder="Image URL or /images/... path"
                className="w-full rounded-md border border-[#464137]/20 bg-[#FAF8F2] px-3.5 py-2 text-xs text-[#292923] outline-none focus:border-[#68705A] focus:ring-1 focus:ring-[#68705A] disabled:opacity-60"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`inline-flex items-center rounded-md border border-[#68705A] px-3 py-1.5 text-xs font-semibold text-[#68705A] ${
                    canPublish && !uploading ? "cursor-pointer hover:bg-[#68705A]/10" : "opacity-50"
                  }`}
                >
                  {uploading ? "Uploading…" : "Upload new image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    disabled={!canPublish || uploading}
                    onChange={handleFile}
                  />
                </label>
                <button
                  type="button"
                  onClick={save}
                  disabled={!canPublish || saving || uploading || !image.trim() || image.trim() === savedImage}
                  className="rounded-md bg-[#68705A] px-3.5 py-1.5 text-xs font-semibold text-[#FAF8F2] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save & publish"}
                </button>
              </div>
              {!canPublish && (
                <p className="text-[0.7rem] text-[#6F6B61]">Only administrators can change this.</p>
              )}
            </div>
          </div>
          {message && (
            <div
              className={`flex items-center gap-2 text-xs font-semibold ${
                message.ok ? "text-[#3D442F]" : "text-[#8C2C1D]"
              }`}
            >
              {message.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
              <span>{message.text}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
