"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

export const FitCheck: React.FC = () => {
  const { fitCheck } = useLandingContent();

  return (
    <section className="py-16 sm:py-24 bg-[#F7F4EC] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            {fitCheck.overline}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
            {fitCheck.headline}
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-14 bg-[#68705A]/40" />
        </div>

        {/* 2-Column Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Fit Column */}
          <div className="paper-card p-6 sm:p-8 border-[#68705A]/25">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#68705A] pb-4 border-b border-[#464137]/10">
              {fitCheck.fitTitle}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {fitCheck.fitPoints.map((point, idx) => (
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

          {/* Unfit Column */}
          <div className="paper-card p-6 sm:p-8 bg-[#FAF8F2]/60">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#6F6B61] pb-4 border-b border-[#464137]/10">
              {fitCheck.unfitTitle}
            </h3>
            <ul className="mt-5 space-y-3.5">
              {fitCheck.unfitPoints.map((point, idx) => (
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
        </div>

        {/* Closing Note */}
        <p className="mx-auto mt-10 max-w-3xl text-center text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
          {fitCheck.closingNote}
        </p>
      </div>
    </section>
  );
};
