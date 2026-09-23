import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { PanelTop, Sparkles, Layers, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLandingPageCMS() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const sections = [
    "Navbar", "Hero", "Countdown", "Instructor Intro", "Audience", "Video",
    "Transformation", "Method", "Core Concepts", "Outcomes", "Instructor Story",
    "Bonuses", "Fit Check", "Included", "FAQ", "Final CTA", "Footer", "Sticky Bottom Bar"
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
            <PanelTop className="size-3" />
            <span>Phase 6 Module</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#292923]">Landing Page CMS</h1>
          <p className="text-xs text-[#6F6B61] mt-1">
            Section-by-section dynamic content management for the public workshop landing page.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#68705A]">
          <Layers className="size-4" />
          <span>18 Configurable Sections Preview</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {sections.map((sec, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 text-center"
            >
              <span className="block text-[0.65rem] font-mono text-[#6F6B61]">{`0${idx + 1}`.slice(-2)}</span>
              <span className="font-medium text-xs text-[#292923]">{sec}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          📌 <strong>Phase 5 Shell Active:</strong> Live content form editors, validation, draft/publish controls, and section toggles will be fully implemented in <strong>Phase 6</strong>.
        </div>
      </div>
    </div>
  );
}
