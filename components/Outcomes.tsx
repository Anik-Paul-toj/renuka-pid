"use client";

import React from "react";
import { Check } from "lucide-react";
import { masterclassData } from "@/data/content";

export const Outcomes: React.FC = () => {
  const { outcomes } = masterclassData;

  return (
    <section className="py-16 sm:py-24 border-t border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            {outcomes.overline}
          </p>
          <h2 className="mt-2.5 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            <span>{outcomes.headline}</span>
            <span className="text-icon">{outcomes.headlineHighlight}</span>
          </h2>
          <div className="mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 to-transparent" />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {outcomes.description}
          </p>
        </div>

        {/* 10 Outcomes in 2-Column Grid */}
        <ul className="mt-10 grid gap-3.5 sm:grid-cols-2">
          {outcomes.items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 rounded-2xl bg-surface/60 p-4.5 text-sm leading-relaxed text-foreground ring-1 ring-border/40 transition-colors hover:bg-surface hover:ring-icon/30"
            >
              <Check className="mt-0.5 size-4.5 shrink-0 text-icon stroke-[2.5]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Disclaimer */}
        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          {outcomes.disclaimer}
        </p>
      </div>
    </section>
  );
};
