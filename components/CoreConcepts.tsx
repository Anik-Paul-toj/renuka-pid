"use client";

import React from "react";
import { Sun, Palette, Compass, Minus, ArrowRight } from "lucide-react";
import { masterclassData } from "@/data/content";

const iconMap: Record<string, React.ReactNode> = {
  Sun: <Sun className="size-5 text-icon" />,
  Palette: <Palette className="size-5 text-icon" />,
  Compass: <Compass className="size-5 text-icon" />,
};

interface CoreConceptsProps {
  onOpenModal: () => void;
}

export const CoreConcepts: React.FC<CoreConceptsProps> = ({ onOpenModal }) => {
  const { coreSecrets } = masterclassData;

  return (
    <section className="py-16 sm:py-24 bg-surface/30 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            {coreSecrets.overline}
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            <span>{coreSecrets.headline}</span>
            <span className="text-icon">{coreSecrets.headlineHighlight}</span>
          </h2>
          <div className="mx-auto mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 via-icon/30 to-transparent" />
        </div>

        {/* 3 Secret Cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {coreSecrets.secrets.map((secret, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-[1.75rem] bg-card/85 p-6 sm:p-7 ring-1 ring-border/50 shadow-[0_18px_40px_-24px_rgba(40,32,26,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:ring-icon/40"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-subheading">
                    {secret.number}
                  </span>
                  <span className="grid size-10 place-items-center rounded-[42%_58%_46%_54%/54%_44%_56%_46%] bg-icon/12">
                    {iconMap[secret.icon] || <Sun className="size-5 text-icon" />}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-2xl font-bold leading-snug text-primary">
                  {secret.title}
                </h3>

                <p className="mt-1.5 text-sm font-semibold text-icon">
                  {secret.subtitle}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {secret.description}
                </p>

                {/* Bullets */}
                <ul className="mt-5 space-y-2.5 border-t border-border/40 pt-4">
                  {secret.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                      <Minus className="mt-1 size-3.5 shrink-0 text-icon" />
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
          <p className="mx-auto max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            {coreSecrets.bottomNote}
          </p>

          <button
            onClick={onOpenModal}
            className="group mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-cta px-8 py-3.5 text-sm font-semibold text-cta-foreground shadow-sm transition-all hover:bg-cta/90 hover:shadow-[0_14px_30px_-14px_rgba(198,83,40,0.85)] cursor-pointer"
          >
            <span>{coreSecrets.ctaText}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
};
