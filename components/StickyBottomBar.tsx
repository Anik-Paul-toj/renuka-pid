"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

interface StickyBottomBarProps {
  onOpenModal: () => void;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({ onOpenModal }) => {
  const { hero } = useLandingContent();

  return (
    <aside
      aria-label="Floating registration bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#464137]/15 bg-[#F7F4EC]/95 backdrop-blur-md shadow-sm"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        {/* Date & Urgency info (desktop) */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#292923]">
          <span className="size-2 rounded-full bg-[#68705A] animate-pulse" />
          <span className="text-[#68705A] font-semibold uppercase tracking-wider">Live Broadcast:</span>
          <span className="text-[#6F6B61]">{hero.date} • {hero.time}</span>
        </div>

        {/* Mobile Info */}
        <div className="flex sm:hidden flex-col">
          <span className="text-[0.7rem] font-bold text-[#68705A] uppercase tracking-wider">Art Studio</span>
          <span className="text-[0.65rem] text-[#6F6B61]">{hero.date}</span>
        </div>

        {/* CTA Button */}
        <div>
          <button
            onClick={onOpenModal}
            className="btn-studio px-5 py-2.5 text-xs shadow-none"
          >
            <span>Explore Courses</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
