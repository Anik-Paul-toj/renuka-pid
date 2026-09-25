"use client";

import React from "react";
import { X, Check } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

export const Transformation: React.FC = () => {
  const { transformation } = useLandingContent();

  return (
    <section className="py-16 sm:py-24 bg-[#F7F4EC] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            {transformation.overline}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
            <span>{transformation.headline}</span>
            <span className="italic">{transformation.headlineHighlight}</span>
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-14 bg-[#68705A]/40" />
        </div>

        {/* 2-Column Comparison Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* The Old Way Card */}
          <div className="paper-card p-6 sm:p-8 bg-[#FAF8F2]/60">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#6F6B61] pb-4 border-b border-[#464137]/10">
              {transformation.beforeTitle}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {transformation.beforePoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-xs sm:text-sm leading-relaxed text-[#6F6B61]"
                >
                  <X className="mt-0.5 size-4 shrink-0 text-[#A24B4B] stroke-[2.2]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* The Renuka Art Studio Way Card */}
          <div className="paper-card p-6 sm:p-8 bg-[#FAF8F2] relative overflow-hidden border-[#68705A]/25">
            <div className="absolute top-0 right-0 h-1 w-full bg-[#68705A]" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#68705A] pb-4 border-b border-[#464137]/10">
              {transformation.afterTitle}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {transformation.afterPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-xs sm:text-sm leading-relaxed text-[#292923] font-medium"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-[#68705A] stroke-[2.5]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Takeaway */}
        <p className="mx-auto mt-12 max-w-3xl text-center font-serif text-lg sm:text-xl italic leading-relaxed text-[#292923]">
          “{transformation.takeaway}”
        </p>
      </div>
    </section>
  );
};
