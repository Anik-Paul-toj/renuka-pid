"use client";

import React from "react";
import { Sun, Palette, Heart, Minus, ArrowRight } from "lucide-react";
import { masterclassData } from "@/data/content";

const iconMap: Record<string, React.ReactNode> = {
  Sun: <Sun className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Palette: <Palette className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Heart: <Heart className="size-5 text-[#68705A]" strokeWidth={1.5} />,
};

interface CoreConceptsProps {
  onOpenModal: () => void;
}

export const CoreConcepts: React.FC<CoreConceptsProps> = ({ onOpenModal }) => {
  const { coreSecrets } = masterclassData;

  return (
    <section className="py-16 sm:py-24 bg-[#F7F4EC] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            {coreSecrets.overline}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
            <span>{coreSecrets.headline}</span>
            <span className="italic">{coreSecrets.headlineHighlight}</span>
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-14 bg-[#68705A]/40" />
        </div>

        {/* 3 Secret Cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {coreSecrets.secrets.map((secret, idx) => (
            <div
              key={idx}
              className="paper-card p-6 sm:p-7 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#68705A]">
                    {secret.number}
                  </span>
                  <span className="grid size-9 place-items-center rounded-full bg-[#C8D1C7]/35">
                    {iconMap[secret.icon] || <Sun className="size-4.5 text-[#68705A]" strokeWidth={1.5} />}
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-2xl font-bold leading-snug text-[#292923]">
                  {secret.title}
                </h3>

                <p className="mt-1.5 text-xs sm:text-sm font-semibold text-[#68705A]">
                  {secret.subtitle}
                </p>

                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
                  {secret.description}
                </p>

                {/* Bullets */}
                <ul className="mt-5 space-y-2.5 border-t border-[#464137]/10 pt-4">
                  {secret.bullets.map((bullet, bIdx) => (
                    <li
                      key={bIdx}
                      className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed text-[#292923]"
                    >
                      <Minus className="mt-1 size-3.5 shrink-0 text-[#68705A]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Narrative & CTA */}
        <div className="mt-12 text-center">
          <p className="mx-auto max-w-3xl text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
            {coreSecrets.bottomNote}
          </p>

          <button
            onClick={onOpenModal}
            className="btn-studio mt-6 px-8 py-3.5"
          >
            <span>{coreSecrets.ctaText}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
