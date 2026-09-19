"use client";

import React from "react";
import {
  Compass,
  Sparkles,
  Layers,
  GraduationCap,
  Briefcase,
  Palette,
  Users,
} from "lucide-react";
import { masterclassData } from "@/data/content";

const iconMap: Record<string, React.ReactNode> = {
  Compass: <Compass className="size-5 text-icon" />,
  Sparkles: <Sparkles className="size-5 text-icon" />,
  Layers: <Layers className="size-5 text-icon" />,
  GraduationCap: <GraduationCap className="size-5 text-icon" />,
  Briefcase: <Briefcase className="size-5 text-icon" />,
  Palette: <Palette className="size-5 text-icon" />,
};

export const AudienceSection: React.FC = () => {
  const { targetAudience } = masterclassData;

  return (
    <section className="py-16 sm:py-24 bg-surface/30 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            {targetAudience.overline}
          </p>
          <h2 className="mt-2.5 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            <span>{targetAudience.headline}</span>
            <span className="text-icon">{targetAudience.headlineHighlight}</span>
          </h2>
          <div className="mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 to-transparent" />
        </div>

        {/* 6 Audience Cards */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {targetAudience.cards.map((card) => (
            <div
              key={card.id}
              className="flex gap-4 rounded-2xl bg-surface/70 p-6 ring-1 ring-border/50 transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:ring-icon/40 hover:shadow-[0_18px_40px_-24px_rgba(40,32,26,0.2)]"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-[42%_58%_46%_54%/54%_44%_56%_46%] bg-icon/12">
                {iconMap[card.icon] || <Users className="size-5 text-icon" />}
              </span>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-icon">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Closing Highlight Quote */}
        <p className="mx-auto mt-12 max-w-3xl text-center font-display text-lg sm:text-xl font-medium leading-relaxed text-subheading">
          “{targetAudience.footerQuote}”
        </p>
      </div>
    </section>
  );
};
