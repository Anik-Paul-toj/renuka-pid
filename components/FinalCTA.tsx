"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { masterclassData } from "@/data/content";

interface FinalCTAProps {
  onOpenModal: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenModal }) => {
  const { finalCta } = masterclassData;

  return (
    <section className="py-16 sm:py-24 border-t border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-surface via-surface/60 to-background px-6 py-14 sm:py-20 ring-1 ring-border/60 shadow-[0_24px_60px_-20px_rgba(40,32,26,0.25)] sm:px-12 text-center">
          {/* Ambient Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-icon/12 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full bg-cta/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-icon/10 px-4 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-subheading ring-1 ring-icon/20">
              <Sparkles className="size-3.5 text-icon animate-pulse" />
              FINAL ENROLLMENT CALL
            </span>

            <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl lg:text-[2.8rem]">
              {finalCta.headline}
            </h2>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              {finalCta.description}
            </p>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={onOpenModal}
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-cta px-10 py-4.5 text-base font-semibold text-cta-foreground shadow-sm transition-all hover:bg-cta/90 hover:shadow-[0_16px_36px_-12px_rgba(198,83,40,0.85)] cursor-pointer"
              >
                <span>{finalCta.ctaText}</span>
                <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="text-sm font-bold text-cta tracking-wide">
                {finalCta.dateInfo}
              </p>

              <p className="text-xs text-muted-foreground">
                {finalCta.subNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
