"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { masterclassData } from "@/data/content";

interface FinalCTAProps {
  onOpenModal: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenModal }) => {
  const { finalCta } = masterclassData;

  return (
    <section className="py-16 sm:py-24 bg-[#EEE9DE] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="paper-card relative overflow-hidden rounded-xl bg-[#FAF8F2] px-6 py-14 sm:py-20 text-center border border-[#464137]/10 shadow-[0_12px_40px_rgba(50,45,35,0.06)]">
          {/* Delicate watercolor washes */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-[#C8D1C7]/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -bottom-16 size-72 rounded-full bg-[#D9BDB2]/25 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl">
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
              {finalCta.overline}
            </span>

            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight text-[#292923] sm:text-4xl lg:text-[2.8rem]">
              {finalCta.headline}
            </h2>

            <p className="mt-4 text-xs sm:text-base leading-relaxed text-[#6F6B61] max-w-2xl mx-auto">
              {finalCta.description}
            </p>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={onOpenModal}
                className="btn-studio px-10 py-4 text-xs sm:text-sm tracking-widest"
              >
                <span>{finalCta.ctaText}</span>
                <ArrowRight className="size-4" />
              </button>

              {/* Handwritten artistic annotation */}
              <p className="font-script text-3xl text-[#68705A] mt-2 select-none">
                {finalCta.handwrittenPhrase}
              </p>

              <p className="text-xs font-semibold text-[#68705A] tracking-wider uppercase">
                {finalCta.dateInfo}
              </p>

              <p className="text-xs text-[#6F6B61]">
                {finalCta.subNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
