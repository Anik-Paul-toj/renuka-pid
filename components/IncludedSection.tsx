"use client";

import React from "react";
import { Check, ArrowRight, Shield } from "lucide-react";
import { masterclassData } from "@/data/content";

interface IncludedSectionProps {
  onOpenModal: () => void;
}

export const IncludedSection: React.FC<IncludedSectionProps> = ({ onOpenModal }) => {
  const { included } = masterclassData;

  return (
    <section className="py-16 sm:py-24 border-t border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            {included.overline}
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            {included.headline}
          </h2>
          <div className="mx-auto mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 via-icon/30 to-transparent" />
        </div>

        {/* Value Box Container */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          {/* Left Inclusions List */}
          <div className="overflow-hidden rounded-2xl ring-1 ring-border/60 bg-card/60 divide-y divide-border/50">
            {included.items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5 sm:py-4 transition-colors hover:bg-surface/50"
              >
                <span className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-foreground font-medium">
                  <Check className="mt-0.5 size-4 shrink-0 text-icon stroke-[2.5]" />
                  <span>{item.title}</span>
                </span>
                <span className="text-xs font-bold text-icon whitespace-nowrap bg-icon/10 px-2.5 py-0.5 rounded-full">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {/* Right Free Registration Fee Card */}
          <div className="rounded-[1.75rem] bg-surface/80 p-6 sm:p-8 text-center ring-1 ring-icon/30 shadow-[0_20px_48px_-20px_rgba(40,32,26,0.25)] flex flex-col justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                {included.feeLabel}
              </p>
              <p className="mt-3 font-display text-5xl font-bold tracking-tight text-primary">
                {included.feeValue}
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={onOpenModal}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-cta px-6 py-4 text-sm font-semibold text-cta-foreground shadow-sm transition-all hover:bg-cta/90 hover:shadow-[0_14px_30px_-14px_rgba(198,83,40,0.9)] cursor-pointer"
              >
                <span>{included.ctaText}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {included.guaranteeNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
