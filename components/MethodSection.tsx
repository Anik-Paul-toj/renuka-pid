"use client";

import React from "react";
import { Eye, Layers, Brush } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

const iconMap: Record<string, React.ReactNode> = {
  Eye: <Eye className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Layers: <Layers className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Brush: <Brush className="size-5 text-[#68705A]" strokeWidth={1.5} />,
};

export const MethodSection: React.FC = () => {
  const { methodFramework } = useLandingContent();

  return (
    <section className="py-16 sm:py-24 bg-[#EEE9DE] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            {methodFramework.overline}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
            <span>{methodFramework.headline}</span>
            <span className="italic">{methodFramework.headlineHighlight}</span>
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-14 bg-[#68705A]/40" />
        </div>

        {/* 3 Step Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {methodFramework.steps.map((step, idx) => (
            <div
              key={idx}
              className="paper-card relative overflow-hidden p-7 bg-[#FAF8F2]"
            >
              {/* Subtle serif watermark number */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-2 font-serif text-7xl font-light text-[#68705A]/12 select-none"
              >
                {step.number}
              </span>

              {/* Icon badge */}
              <span className="grid size-11 place-items-center rounded-full bg-[#C8D1C7]/35 mb-5">
                {iconMap[step.icon] || <Eye className="size-5 text-[#68705A]" strokeWidth={1.5} />}
              </span>

              <span className="block text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#68705A]">
                Step {step.number}
              </span>

              <h3 className="mt-1 font-serif text-2xl font-bold text-[#292923]">
                {step.title}
              </h3>

              <p className="mt-2 text-xs sm:text-sm font-semibold text-[#68705A]">
                {step.subtitle}
              </p>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connected Summary Pill */}
        <div className="mt-12 flex justify-center">
          <p className="rounded-md bg-[#FAF8F2] px-6 py-3 text-center font-serif text-sm sm:text-base font-medium text-[#292923] border border-[#464137]/10 shadow-[0_4px_16px_rgba(50,45,35,0.04)]">
            {methodFramework.pillSummary}
          </p>
        </div>
      </div>
    </section>
  );
};
