"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { masterclassData } from "@/data/content";

interface StickyBottomBarProps {
  onOpenModal: () => void;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({ onOpenModal }) => {
  const { hero } = masterclassData;

  return (
    <aside
      aria-label="Floating registration bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md shadow-lg"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        {/* Date & Urgency info (desktop) */}
        <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
          <span className="size-2 rounded-full bg-cta animate-pulse" />
          <span className="text-cta font-semibold">Live Broadcast:</span>
          <span>{hero.date} • {hero.time}</span>
        </div>

        {/* Mobile Info */}
        <div className="flex sm:hidden flex-col">
          <span className="text-[0.7rem] font-bold text-cta">LIVE COMPLIMENTARY SESSION</span>
          <span className="text-[0.65rem] text-muted-foreground">{hero.date}</span>
        </div>

        {/* CTA Button */}
        <div className="flex items-center">
          {/* Desktop Button */}
          <button
            onClick={onOpenModal}
            className="group hidden sm:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-cta px-6 py-2.5 text-xs font-semibold text-cta-foreground shadow-sm transition-all hover:bg-cta/90 hover:shadow-[0_14px_30px_-14px_rgba(198,83,40,0.9)] cursor-pointer"
          >
            <span>{hero.ctaText}</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Mobile Button */}
          <button
            onClick={onOpenModal}
            className="inline-flex sm:hidden items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-cta px-4 py-2 text-xs font-semibold text-cta-foreground shadow-sm hover:bg-cta/90 cursor-pointer"
          >
            <span>Join Free</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
