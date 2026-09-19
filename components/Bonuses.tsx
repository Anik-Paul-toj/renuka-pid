"use client";

import React from "react";
import { BookOpen, Sliders, Video, Gift } from "lucide-react";
import { masterclassData } from "@/data/content";

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="size-6 text-icon" />,
  Sliders: <Sliders className="size-6 text-icon" />,
  Video: <Video className="size-6 text-icon" />,
};

export const Bonuses: React.FC = () => {
  const { bonuses } = masterclassData;

  return (
    <section className="py-16 sm:py-24 border-t border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            {bonuses.overline}
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            <span>{bonuses.headline}</span>
            <span className="text-icon">{bonuses.headlineHighlight}</span>
          </h2>
          <div className="mx-auto mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 via-icon/30 to-transparent" />
        </div>

        {/* 3 Bonus Cards */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {bonuses.items.map((bonus) => (
            <div
              key={bonus.id}
              className="flex items-start justify-between gap-4 rounded-[1.75rem] bg-surface/60 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:ring-1 hover:ring-icon/40 hover:shadow-[0_18px_40px_-24px_rgba(40,32,26,0.2)] ring-1 ring-border/50"
            >
              <div className="min-w-0 flex flex-col">
                <h3 className="font-display text-xl font-bold leading-snug text-primary">
                  {bonus.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {bonus.description}
                </p>
                <p className="mt-4 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-subheading">
                  {bonus.type}
                </p>
              </div>

              <span className="grid size-14 shrink-0 place-items-center rounded-[42%_58%_46%_54%/54%_44%_56%_46%] bg-icon/12">
                {iconMap[bonus.icon] || <Gift className="size-6 text-icon" />}
              </span>
            </div>
          ))}
        </div>

        {/* Delivery Note */}
        <p className="mx-auto mt-10 max-w-3xl text-center text-xs sm:text-sm text-muted-foreground">
          {bonuses.deliveryNote}
        </p>
      </div>
    </section>
  );
};
