"use client";

import React from "react";
import { Eye, Layers, Brush } from "lucide-react";
import { masterclassData } from "@/data/content";

const iconMap: Record<string, React.ReactNode> = {
  Eye: <Eye className="size-5 text-icon" />,
  Layers: <Layers className="size-5 text-icon" />,
  Brush: <Brush className="size-5 text-icon" />,
};

export const MethodSection: React.FC = () => {
  const { methodFramework } = masterclassData;

  return (
    <section className="py-16 sm:py-24 border-t border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            {methodFramework.overline}
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            <span>{methodFramework.headline}</span>
            <span className="text-icon">{methodFramework.headlineHighlight}</span>
          </h2>
          <div className="mx-auto mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 via-icon/30 to-transparent" />
        </div>

        {/* 3 Step Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {methodFramework.steps.map((step, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-[1.75rem] bg-surface/60 p-7 ring-1 ring-border/50 transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:ring-icon/40 hover:shadow-[0_20px_40px_-24px_rgba(40,32,26,0.25)]"
            >
              {/* Oversized background watermark number */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-4 font-display text-8xl font-bold text-icon/10 select-none"
              >
                {step.number.replace(/^0/, "")}
              </span>

              {/* Icon badge */}
              <span className="grid size-12 shrink-0 place-items-center rounded-[42%_58%_46%_54%/54%_44%_56%_46%] bg-icon/12">
                {iconMap[step.icon] || <Eye className="size-5 text-icon" />}
              </span>

              <span className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-subheading">
                Step {step.number}
              </span>

              <h3 className="mt-1.5 font-display text-2xl font-bold text-primary">
                {step.title}
              </h3>

              <p className="mt-2 text-sm font-semibold text-icon">
                {step.subtitle}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connected Summary Pill */}
        <div className="mt-12 flex justify-center">
          <p className="rounded-full bg-surface/80 px-6 py-3.5 text-center font-display text-sm sm:text-base font-medium ring-1 ring-border/60 shadow-sm text-primary">
            {methodFramework.pillSummary}
          </p>
        </div>
      </div>
    </section>
  );
};
