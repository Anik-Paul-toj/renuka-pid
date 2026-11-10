"use client";

import React from "react";
import { useLandingContent } from "@/components/LandingContentProvider";
import { StudioLogo } from "@/components/ui/StudioLogo";

interface StickyBottomBarProps {
  onOpenModal?: () => void;
  activeBatch?: any | null;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({ activeBatch }) => {
  const { hero } = useLandingContent();

  const displayDate = activeBatch?.formattedStartDate || (activeBatch?.startDate ? activeBatch.startDate : hero.date);
  const displayTime = activeBatch?.formattedTiming || (activeBatch?.startTime ? `${activeBatch.startTime} IST` : hero.time);

  return (
    <aside
      aria-label="Floating registration bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#464137]/15 bg-[#F7F4EC]/95 backdrop-blur-md shadow-sm"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-6 py-3">
        {/* Date & Urgency info (desktop) */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#14120E]">
          <span className="size-2 rounded-full bg-[#444C38] animate-pulse" />
          <span className="text-[#444C38] font-bold uppercase tracking-wider">Live Broadcast:</span>
          <span className="text-[#14120E] font-semibold">{displayDate} • {displayTime}</span>
        </div>

        {/* Mobile Info */}
        <div className="flex sm:hidden flex-col justify-center">
          <StudioLogo variant="black" height={28} />
          <span className="text-[0.68rem] text-[#14120E] font-semibold">{displayDate}</span>
        </div>
      </div>
    </aside>
  );
};
