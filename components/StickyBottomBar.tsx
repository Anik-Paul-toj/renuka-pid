"use client";

import React from "react";
import Link from "next/link";
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
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#14120E]">
          <span className="size-2 rounded-full bg-[#444C38] animate-pulse" />
          <span className="text-[#444C38] font-bold uppercase tracking-wider">Live Broadcast:</span>
          <span className="text-[#14120E] font-semibold">{hero.date} • {hero.time}</span>
        </div>

        {/* Mobile Info */}
        <div className="flex sm:hidden flex-col">
          <span className="text-[0.7rem] font-bold text-[#444C38] uppercase tracking-wider">Renuka Art Studio</span>
          <span className="text-[0.68rem] text-[#14120E] font-semibold">{hero.date}</span>
        </div>

        {/* CTA Button */}
        <div>
          <Link
            href="/course"
            className="btn-studio px-5 py-2.5 text-xs shadow-none inline-flex items-center gap-1.5"
          >
            <span>Explore Courses</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
