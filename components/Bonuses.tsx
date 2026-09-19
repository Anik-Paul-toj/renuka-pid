"use client";

import React from "react";
import { BookOpen, Sliders, Video, Gift } from "lucide-react";
import { masterclassData } from "@/data/content";

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Sliders: <Sliders className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Video: <Video className="size-5 text-[#68705A]" strokeWidth={1.5} />,
};

export const Bonuses: React.FC = () => {
  const { bonuses } = masterclassData;

  return (
    <section className="py-16 sm:py-24 bg-[#EEE9DE] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            {bonuses.overline}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
            <span>{bonuses.headline}</span>
            <span className="italic">{bonuses.headlineHighlight}</span>
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-14 bg-[#68705A]/40" />
        </div>

        {/* 3 Bonus Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {bonuses.items.map((bonus) => (
            <div
              key={bonus.id}
              className="paper-card p-6 sm:p-7 flex flex-col justify-between bg-[#FAF8F2]"
            >
              <div>
                <span className="grid size-11 place-items-center rounded-full bg-[#C8D1C7]/35 mb-4">
                  {iconMap[bonus.icon] || <Gift className="size-5 text-[#68705A]" strokeWidth={1.5} />}
                </span>

                <h3 className="font-serif text-xl font-bold leading-snug text-[#292923]">
                  {bonus.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
                  {bonus.description}
                </p>
              </div>

              <p className="mt-5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#68705A] border-t border-[#464137]/10 pt-3">
                {bonus.type}
              </p>
            </div>
          ))}
        </div>

        {/* Delivery Note */}
        <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-[#6F6B61]">
          {bonuses.deliveryNote}
        </p>
      </div>
    </section>
  );
};
