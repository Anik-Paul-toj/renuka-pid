"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { masterclassData } from "@/data/content";

interface NavbarProps {
  onOpenModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenModal }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-5">
        {/* Logo / Brandmark */}
        <a href="#" className="flex items-center gap-2.5 group">
          <span className="grid size-9 place-items-center rounded-xl bg-icon/10 text-icon font-display font-bold text-lg transition-transform group-hover:scale-105">
            R
          </span>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-wider text-primary">
              {masterclassData.brand.name}
            </span>
            <span className="text-[0.65rem] tracking-widest text-subheading uppercase font-medium">
              Live Masterclass
            </span>
          </div>
        </a>

        {/* Date / Live Tag (visible on medium+ screens) */}
        <div className="hidden md:flex items-center gap-2 rounded-full bg-surface px-3.5 py-1 text-xs text-muted-foreground ring-1 ring-border/50">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Broadcast • Saturday, 28 Oct</span>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {/* Desktop CTA */}
          <button
            onClick={onOpenModal}
            className="group hidden sm:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-cta px-5 py-2 text-xs font-semibold text-cta-foreground shadow-sm transition-all hover:bg-cta/90 hover:shadow-[0_14px_30px_-14px_rgba(198,83,40,0.85)] cursor-pointer"
          >
            <span>{masterclassData.hero.ctaText}</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Mobile CTA */}
          <button
            onClick={onOpenModal}
            className="inline-flex sm:hidden items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-cta px-3.5 py-2 text-xs font-semibold text-cta-foreground shadow-sm transition-all hover:bg-cta/90 cursor-pointer"
          >
            <span>Join Free</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
