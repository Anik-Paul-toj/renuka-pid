"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Save,
  Send,
  RotateCcw,
  Code,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { CMSSectionKey } from "@/lib/types/cms";
import { AdminProfile } from "@/lib/auth/admin";
import { DynamicSectionForm } from "./SectionForms";

export interface SectionMeta {
  section_key: CMSSectionKey;
  published: any | null;
  draft: any | null;
  published_version: number | null;
  draft_version: number | null;
  last_published_at: string | null;
  has_draft: boolean;
}

const SECTION_METADATA: Array<{ key: CMSSectionKey; label: string; number: string; category: string }> = [
  { key: "brand", label: "Brand Identity", number: "01", category: "Core Brand" },
  { key: "hero", label: "Hero Banner", number: "02", category: "Core Brand" },
  { key: "stats", label: "Studio Statistics", number: "03", category: "Social Proof" },
  { key: "trustSection", label: "Trust & Philosophy", number: "04", category: "Social Proof" },
  { key: "aboutArtist", label: "About Instructor", number: "05", category: "Instructor" },
  { key: "targetAudience", label: "Target Audience", number: "06", category: "Curriculum" },
  { key: "videoSection", label: "Preview Video", number: "07", category: "Curriculum" },
  { key: "transformation", label: "Before vs After", number: "08", category: "Curriculum" },
  { key: "methodFramework", label: "4-Step Method", number: "09", category: "Curriculum" },
  { key: "coreSecrets", label: "Core Techniques", number: "10", category: "Curriculum" },
  { key: "outcomes", label: "Skill Outcomes", number: "11", category: "Curriculum" },
  { key: "instructorStory", label: "Artist Journey", number: "12", category: "Instructor" },
  { key: "bonuses", label: "Exclusive Bonuses", number: "13", category: "Offer" },
  { key: "fitCheck", label: "Is This For You?", number: "14", category: "Offer" },
  { key: "included", label: "Everything Included", number: "15", category: "Offer" },
  { key: "faqs", label: "FAQs Accordion", number: "16", category: "Closing" },
  { key: "finalCta", label: "Final Enrollment CTA", number: "17", category: "Closing" },
  { key: "footer", label: "Studio Footer", number: "18", category: "Closing" },
];

export function CMSManager({
  initialSections,
  adminProfile,
}: {
  initialSections: SectionMeta[];
  adminProfile: AdminProfile;
}) {
  const [sections, setSections] = useState<SectionMeta[]>(initialSections);
  const [activeKey, setActiveKey] = useState<CMSSectionKey>("hero");
  const [formData, setFormData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  const activeSection = sections.find((s) => s.section_key === activeKey);

  // Initialize form data when activeKey changes or sections load
  useEffect(() => {
    if (activeSection) {
      // Prioritize draft content if present; fallback to published content
      const baseContent = activeSection.draft ?? activeSection.published ?? {};
      setFormData(JSON.parse(JSON.stringify(baseContent)));
      setIsDirty(false);
    }
  }, [activeKey, sections]);

  const handleFormChange = (updated: any) => {
    setFormData(updated);
    setIsDirty(true);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/landing-content/${activeKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_draft",
          content: formData,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusMessage({
          type: "error",
          text: data.error?.message || "Failed to save draft.",
        });
        setIsSaving(false);
        return;
      }

      // Update local state
      setSections((prev) =>
        prev.map((s) =>
          s.section_key === activeKey
            ? {
                ...s,
                draft: formData,
                draft_version: data.data.version,
                has_draft: true,
              }
            : s
        )
      );

      setIsDirty(false);
      setStatusMessage({
        type: "success",
        text: `Draft (v${data.data.version}) saved successfully. Live site remains unchanged.`,
      });
    } catch (err) {
      console.error("Save draft error:", err);
      setStatusMessage({
        type: "error",
        text: "Network error occurred while saving draft.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (adminProfile.role === "editor") {
      setStatusMessage({
        type: "error",
        text: "Publishing requires administrator permissions.",
      });
      return;
    }

    setIsPublishing(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/landing-content/${activeKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          content: formData,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusMessage({
          type: "error",
          text: data.error?.message || "Failed to publish content.",
        });
        setIsPublishing(false);
        return;
      }

      // Update local state: new published content, clear draft
      setSections((prev) =>
        prev.map((s) =>
          s.section_key === activeKey
            ? {
                ...s,
                published: formData,
                published_version: data.data.version,
                last_published_at: data.data.published_at,
                draft: null,
                draft_version: null,
                has_draft: false,
              }
            : s
        )
      );

      setIsDirty(false);
      setStatusMessage({
        type: "success",
        text: `Section published live (v${data.data.version})! Changes are atomically recorded.`,
      });
    } catch (err) {
      console.error("Publish error:", err);
      setStatusMessage({
        type: "error",
        text: "Network error occurred while publishing.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!activeSection?.has_draft) return;

    if (!confirm("Are you sure you want to discard this draft? Unsaved changes will be lost and content will revert to the live published version.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/landing-content/${activeKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard_draft" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusMessage({
          type: "error",
          text: data.error?.message || "Failed to discard draft.",
        });
        return;
      }

      // Revert to published content
      const revertedContent = activeSection.published ?? {};
      setFormData(JSON.parse(JSON.stringify(revertedContent)));
      setIsDirty(false);

      setSections((prev) =>
        prev.map((s) =>
          s.section_key === activeKey
            ? { ...s, draft: null, draft_version: null, has_draft: false }
            : s
        )
      );

      setStatusMessage({
        type: "success",
        text: "Draft discarded. Reverted to active published version.",
      });
    } catch (err) {
      console.error("Discard draft error:", err);
      setStatusMessage({
        type: "error",
        text: "Error occurred while discarding draft.",
      });
    }
  };

  const activeMeta = SECTION_METADATA.find((m) => m.key === activeKey);

  return (
    <div className="space-y-6">
      {/* Top Banner & CMS Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A]">
            <Sparkles className="size-3" />
            <span>Content Management System</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#292923]">
            Landing Page CMS
          </h1>
          <p className="text-xs text-[#6F6B61]">
            Manage, draft, validate, and publish all 18 sections of the masterclass landing page without code edits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowJsonInspector(!showJsonInspector)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#464137]/15 bg-[#F7F4EC] text-xs font-semibold text-[#464137] hover:border-[#68705A] transition-all"
          >
            <Code className="size-3.5 text-[#68705A]" />
            <span>{showJsonInspector ? "Hide JSON" : "Inspect JSON"}</span>
          </button>
        </div>
      </div>

      {/* Main CMS Layout (Section Selector + Form Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 18 Sections List */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2">
          <div className="p-3 bg-[#FAF8F2] border border-[#464137]/15 rounded-xl shadow-xs space-y-1">
            <div className="px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#6F6B61] flex items-center justify-between">
              <span>All 18 Sections</span>
              <span className="font-mono text-[0.6rem] text-[#68705A]">Active Sections</span>
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {SECTION_METADATA.map((meta) => {
                const sec = sections.find((s) => s.section_key === meta.key);
                const isSelected = meta.key === activeKey;

                return (
                  <button
                    key={meta.key}
                    type="button"
                    onClick={() => {
                      if (isDirty) {
                        if (!confirm("You have unsaved changes in this section. Switch section anyway?")) {
                          return;
                        }
                      }
                      setActiveKey(meta.key);
                      setStatusMessage(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-all ${
                      isSelected
                        ? "bg-[#68705A] text-[#FAF8F2] font-semibold shadow-xs"
                        : "text-[#464137] hover:bg-[#F7F4EC] hover:text-[#292923]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[0.65rem] font-mono ${isSelected ? "text-[#FAF8F2]/70" : "text-[#6F6B61]"}`}>
                        {meta.number}
                      </span>
                      <span className="truncate">{meta.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {sec?.has_draft ? (
                        <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-[#D4A373]/30 text-[#8C5E2D]">
                          Draft
                        </span>
                      ) : sec?.published ? (
                        <span className={`text-[0.6rem] ${isSelected ? "text-[#FAF8F2]/80" : "text-[#68705A]"}`}>
                          v{sec.published_version || 1}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Section Editor Card */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-6">
            {/* Editor Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#464137]/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#68705A]">
                    {activeMeta?.number} • {activeKey}
                  </span>
                  {activeSection?.has_draft ? (
                    <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-[#D4A373]/20 text-[#8C5E2D] border border-[#D4A373]/40">
                      Draft Active (v{activeSection.draft_version})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-[#C8D1C7]/40 text-[#68705A] border border-[#68705A]/20">
                      Published (v{activeSection?.published_version || 1})
                    </span>
                  )}
                  {isDirty && (
                    <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-[#A24B4B]/10 text-[#A24B4B] animate-pulse">
                      ● Unsaved Edits
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#292923]">
                  {activeMeta?.label}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {activeSection?.has_draft && (
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#A24B4B]/30 text-xs font-semibold text-[#A24B4B] hover:bg-[#A24B4B]/10 transition-all"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Discard Draft</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving || isPublishing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#68705A] bg-[#F7F4EC] text-xs font-bold text-[#68705A] hover:bg-[#68705A] hover:text-[#FAF8F2] transition-all shadow-xs disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Draft"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSaving || isPublishing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#68705A] text-xs font-bold text-[#FAF8F2] hover:bg-[#58604C] transition-all shadow-sm disabled:opacity-50"
                >
                  <Send className="size-3.5" />
                  <span>{isPublishing ? "Publishing..." : "Publish to Live"}</span>
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 border ${
                  statusMessage.type === "success"
                    ? "bg-[#C8D1C7]/25 border-[#68705A]/30 text-[#68705A]"
                    : "bg-[#A24B4B]/10 border-[#A24B4B]/30 text-[#A24B4B]"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 font-medium">{statusMessage.text}</div>
              </div>
            )}

            {/* Form Fields Component */}
            {formData ? (
              <div className="pt-2">
                <DynamicSectionForm
                  sectionKey={activeKey}
                  value={formData}
                  onChange={handleFormChange}
                />
              </div>
            ) : (
              <div className="text-xs text-[#6F6B61] py-8 text-center">
                Loading section content...
              </div>
            )}
          </div>

          {/* Developer JSON Inspector Modal / Accordion */}
          {showJsonInspector && formData && (
            <div className="p-5 rounded-xl bg-[#292923] text-[#FAF8F2] font-mono text-xs shadow-lg space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[0.7rem] text-[#C8D1C7]">
                <span>Raw Database JSON Snapshot ({activeKey})</span>
                <span className="text-[0.65rem] uppercase">JSON Inspection Mode</span>
              </div>
              <pre className="max-h-72 overflow-y-auto p-2 bg-black/30 rounded text-[0.7rem] leading-relaxed text-[#EEE9DE]">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
