"use client";

import React from "react";
import { Check, ArrowRight } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

interface IncludedSectionProps {
  onOpenModal: () => void;
}

export const IncludedSection: React.FC<IncludedSectionProps> = ({ onOpenModal }) => {
  const { included } = useLandingContent();

  return (
    <section className="py-16 sm:py-24 bg-[#EEE9DE] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            {included.overline}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
            {included.headline}
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-14 bg-[#68705A]/40" />
        </div>

        {/* Value Box Container */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          {/* Left Inclusions List */}
          <div className="paper-card overflow-hidden divide-y divide-[#464137]/10 bg-[#FAF8F2]">
            {included.items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5 sm:py-4 transition-colors hover:bg-[#F7F4EC]"
              >
                <span className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-[#292923] font-medium">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#68705A] stroke-[2.2]" />
                  <span>{item.title}</span>
                </span>
                <span className="text-[0.7rem] font-semibold tracking-wider uppercase text-[#68705A] bg-[#C8D1C7]/30 px-2.5 py-0.5 rounded-md">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {/* Right Free Registration Fee Card */}
          <div className="paper-card p-6 sm:p-8 text-center bg-[#FAF8F2] border-[#68705A]/25 flex flex-col justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#6F6B61]">
                {included.feeLabel}
              </p>
              <p className="mt-2 font-serif text-5xl font-bold tracking-tight text-[#292923]">
                {included.feeValue}
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={onOpenModal}
                className="btn-studio w-full py-4 text-xs tracking-wider"
              >
                <span>{included.ctaText}</span>
                <ArrowRight className="size-4" />
              </button>

              <p className="mt-4 text-xs leading-relaxed text-[#6F6B61]">
                {included.guaranteeNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
