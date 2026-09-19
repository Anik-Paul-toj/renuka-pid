"use client";

import React from "react";
import Image from "next/image";
import {
  Sparkles,
  CalendarDays,
  Clock,
  MessageCircle,
  Hourglass,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { masterclassData } from "@/data/content";

interface HeroProps {
  onOpenModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenModal }) => {
  const { hero } = masterclassData;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface/70 via-background to-background pt-4 pb-14 sm:py-16 lg:py-20">
      {/* Decorative ambient glowing backdrops */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-12%] size-[36rem] rounded-full bg-icon/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 left-[-14%] size-[30rem] rounded-full bg-cta/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left Column: Content */}
          <div className="flex flex-col items-start">
            {/* Pill Label */}
            <span className="inline-flex items-center gap-2 rounded-full bg-icon/10 px-4 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-subheading ring-1 ring-icon/20">
              <Sparkles className="size-3.5 text-icon animate-pulse" />
              {hero.pillLabel}
            </span>

            {/* Main Headline */}
            <h1 className="mt-4 font-hero text-[2.35rem] font-bold leading-[1.08] tracking-tight text-primary sm:text-5xl lg:text-[3.6rem]">
              <span>{hero.headlineStart}</span>
              <span className="text-icon">{hero.headlineHighlight}</span>
            </h1>

            {/* Subheading */}
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {hero.subheadline}
            </p>

            {/* Metadata Pills List */}
            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm font-medium text-foreground">
              <li className="flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0 text-icon" />
                <span>{hero.date}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-icon" />
                <span>{hero.time}</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="size-4 shrink-0 text-icon" />
                <span>{hero.language}</span>
              </li>
              <li className="flex items-center gap-2">
                <Hourglass className="size-4 shrink-0 text-icon" />
                <span>{hero.duration}</span>
              </li>
            </ul>

            {/* CTA Group */}
            <div className="mt-8 flex w-full flex-col items-start gap-3 sm:w-auto">
              <button
                onClick={onOpenModal}
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-cta px-9 py-4 text-base font-semibold text-cta-foreground shadow-sm transition-all hover:bg-cta/90 hover:shadow-[0_16px_36px_-12px_rgba(198,83,40,0.85)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/50"
              >
                <span>{hero.ctaText}</span>
                <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="text-xs font-semibold tracking-wide text-icon sm:text-sm">
                {hero.urgencyText}
              </p>
            </div>

            {/* Urgency and Qualification micro-copy */}
            <div className="mt-6 space-y-1.5 border-t border-border/40 pt-4 text-xs sm:text-sm">
              <p className="font-medium text-cta flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-cta animate-ping inline-block" />
                {hero.guaranteeText}
              </p>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-icon shrink-0" />
                {hero.targetAudienceNote}
              </p>
            </div>
          </div>

          {/* Right Column: Hero Visual */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:pl-6">
            <div className="relative mx-auto overflow-hidden rounded-[2.25rem] bg-card p-2 shadow-[0_24px_60px_-20px_rgba(40,32,26,0.3)] ring-1 ring-border/60">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.75rem]">
                <Image
                  src={hero.instructorImage}
                  alt={`${hero.instructorName} in her art studio`}
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 450px"
                />
              </div>

              {/* Floating Instructor Badge */}
              <div className="relative mx-auto -mt-6 mb-2 w-fit max-w-xs rounded-2xl bg-card/95 px-5 py-3 text-center shadow-[0_16px_32px_-12px_rgba(40,32,26,0.25)] ring-1 ring-border/60 backdrop-blur">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  {hero.instructorName}
                </p>
                <p className="text-[0.72rem] text-muted-foreground">
                  {hero.instructorTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
