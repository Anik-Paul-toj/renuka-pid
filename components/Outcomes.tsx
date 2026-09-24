"use client";

import React from "react";
import { Check } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

export const Outcomes: React.FC = () => {
  const { outcomes } = useLandingContent();

  return (
    <section className="py-16 sm:py-24 bg-[#EEE9DE] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            {outcomes.overline}
          </p>
          <h2 className="mt-3 max-w-4xl font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
            <span>{outcomes.headline}</span>
            <span className="italic">{outcomes.headlineHighlight}</span>
          </h2>
          <div className="mt-4 h-0.5 w-14 bg-[#68705A]/40" />
          <p className="mt-4 max-w-2xl text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
            {outcomes.description}
          </p>
        </div>

        {/* 10 Outcomes in 2-Column Grid */}
        <ul className="mt-10 grid gap-3.5 sm:grid-cols-2">
          {outcomes.items.map((item, idx) => (
            <li
              key={idx}
              className="paper-card flex items-start gap-3 p-4 text-xs sm:text-sm leading-relaxed text-[#292923]"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-[#68705A] stroke-[2.2]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Disclaimer */}
        <p className="mt-8 text-xs leading-relaxed text-[#6F6B61]">
          {outcomes.disclaimer}
        </p>
      </div>
    </section>
  );
};
