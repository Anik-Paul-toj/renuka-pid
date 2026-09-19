"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { masterclassData } from "@/data/content";

export const FitCheck: React.FC = () => {
  const { fitCheck } = masterclassData;

  return (
    <section className="py-16 sm:py-24 bg-surface/30 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            {fitCheck.overline}
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            {fitCheck.headline}
          </h2>
          <div className="mx-auto mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 via-icon/30 to-transparent" />
        </div>

        {/* 2-Column Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Fit Column */}
          <div className="rounded-[1.75rem] bg-surface/80 p-6 sm:p-8 ring-1 ring-icon/30 shadow-[0_18px_40px_-24px_rgba(40,32,26,0.15)]">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-icon pb-4 border-b border-border/40">
              {fitCheck.fitTitle}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {fitCheck.fitPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-foreground font-medium">
                  <Check className="mt-0.5 size-4.5 shrink-0 text-icon stroke-[2.5]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Unfit Column */}
          <div className="rounded-[1.75rem] bg-surface/60 p-6 sm:p-8 ring-1 ring-border/50">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground pb-4 border-b border-border/40">
              {fitCheck.unfitTitle}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {fitCheck.unfitPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <X className="mt-0.5 size-4.5 shrink-0 text-destructive/80 stroke-[2.5]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Reassuring Closing Statement */}
        <p className="mx-auto mt-10 max-w-3xl text-center text-xs sm:text-sm leading-relaxed text-muted-foreground">
          {fitCheck.closingNote}
        </p>
      </div>
    </section>
  );
};
