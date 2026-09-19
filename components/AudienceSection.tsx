"use client";

import React from "react";
import {
  Compass,
  Sparkles,
  Heart,
  Layers,
  GraduationCap,
  Flower2,
} from "lucide-react";
import { masterclassData } from "@/data/content";

const iconMap: Record<string, React.ReactNode> = {
  Compass: <Compass className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Sparkles: <Sparkles className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Heart: <Heart className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Layers: <Layers className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  GraduationCap: <GraduationCap className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Flower2: <Flower2 className="size-5 text-[#68705A]" strokeWidth={1.5} />,
};

export const AudienceSection: React.FC = () => {
  const { targetAudience } = masterclassData;

  return (
    <section className="py-16 sm:py-24 bg-[#F7F4EC] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            {targetAudience.overline}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
            <span>{targetAudience.headline}</span>
            <span className="italic">{targetAudience.headlineHighlight}</span>
          </h2>
          <div className="mt-4 h-0.5 w-14 bg-[#68705A]/40 mx-auto" />
        </div>

        {/* 6 Audience Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {targetAudience.cards.map((card) => (
            <div
              key={card.id}
              className="paper-card p-6 flex flex-col items-start"
            >
              <span className="grid size-11 place-items-center rounded-full bg-[#C8D1C7]/35 mb-4">
                {iconMap[card.icon] || <Sparkles className="size-5 text-[#68705A]" strokeWidth={1.5} />}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#292923]">
                {card.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* Editorial Handwritten Quote Accent */}
        <div className="mt-16 text-center">
          <p className="font-script text-3xl sm:text-4xl text-[#68705A]">
            "{targetAudience.footerQuote}"
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#6F6B61]">
            — Art & Soul Studio Philosophy
          </p>
        </div>
      </div>
    </section>
  );
};
