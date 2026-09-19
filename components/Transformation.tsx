"use client";

import React from "react";
import { X, Check } from "lucide-react";
import { masterclassData } from "@/data/content";

export const Transformation: React.FC = () => {
  const { transformation } = masterclassData;

  return (
    <section className="py-16 sm:py-24 bg-surface/30 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            {transformation.overline}
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            <span>{transformation.headline}</span>
            <span className="text-icon">{transformation.headlineHighlight}</span>
          </h2>
          <div className="mx-auto mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 via-icon/30 to-transparent" />
        </div>

        {/* 2-Column Comparison Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* The Old Way Card */}
          <div className="rounded-[1.75rem] bg-card/70 p-6 sm:p-8 shadow-[0_18px_50px_-28px_rgba(40,32,26,0.15)] ring-1 ring-border/60">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground pb-4 border-b border-border/40">
              {transformation.beforeTitle}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {transformation.beforePoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <X className="mt-0.5 size-4.5 shrink-0 text-destructive/80 stroke-[2.5]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* The Atelier Way Card */}
          <div className="rounded-[1.75rem] bg-card p-6 sm:p-8 shadow-[0_20px_50px_-24px_rgba(154,83,45,0.25)] ring-1 ring-icon/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-icon to-cta" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-subheading pb-4 border-b border-border/40">
              {transformation.afterTitle}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {transformation.afterPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-foreground font-medium">
                  <Check className="mt-0.5 size-4.5 shrink-0 text-icon stroke-[2.5]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Takeaway */}
        <p className="mx-auto mt-12 max-w-3xl text-center font-display text-lg sm:text-xl leading-relaxed text-primary">
          {transformation.takeaway}
        </p>
      </div>
    </section>
  );
};
