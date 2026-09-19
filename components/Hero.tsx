"use client";

import React from "react";
import Image from "next/image";
import {
  CalendarDays,
  Clock,
  MessageCircle,
  Hourglass,
  ArrowRight,
} from "lucide-react";
import { masterclassData } from "@/data/content";

interface HeroProps {
  onOpenModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenModal }) => {
  const { hero } = masterclassData;

  return (
    <section className="relative overflow-hidden bg-[#F7F4EC] pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-8 border-b border-[#464137]/10">
      {/* Delicate watercolor washes in the background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-5%] size-[34rem] rounded-full bg-[#C8D1C7]/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-[-10%] size-[28rem] rounded-full bg-[#D9BDB2]/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          {/* Left Column: Content */}
          <div className="flex flex-col items-start">
            {/* Eyebrow Category Label */}
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
              {hero.pillLabel}
            </span>

            {/* Editorial Serif Headline */}
            <h1 className="mt-2.5 font-serif text-[2.35rem] sm:text-4xl lg:text-[3.25rem] font-medium leading-[1.08] tracking-tight text-[#292923]">
              <span>Learn Art.</span>
              <br />
              <span className="italic font-normal">Rediscover Yourself.</span>
              <br />
              <span>Create a Kinder You.</span>
            </h1>

            {/* Subheading */}
            <p className="mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-[#6F6B61]">
              {hero.subheadline}
            </p>

            {/* Primary Button & Handwritten Quote */}
            <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={onOpenModal}
                className="btn-studio px-7 py-3 text-xs sm:text-sm"
              >
                <span>{hero.ctaText}</span>
                <ArrowRight className="size-4" />
              </button>

              {/* Handwritten artistic quote */}
              <span className="font-script text-2xl text-[#68705A] select-none">
                {hero.handwrittenPhrase}
              </span>
            </div>

            {/* Masterclass Schedule & Details */}
            <div className="mt-6 w-full border-t border-[#464137]/10 pt-4">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-[#6F6B61]">
                <li className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-[#68705A] shrink-0" />
                  <span>{hero.date}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-[#68705A] shrink-0" />
                  <span>{hero.time}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Hourglass className="size-3.5 text-[#68705A] shrink-0" />
                  <span>{hero.duration}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <MessageCircle className="size-3.5 text-[#68705A] shrink-0" />
                  <span>{hero.language}</span>
                </li>
              </ul>

              <p className="mt-2 text-xs text-[#68705A] font-medium">
                {hero.guaranteeText}
              </p>
            </div>
          </div>

          {/* Right Column: Warm Artist Studio Photograph */}
          <div className="relative mx-auto w-full max-w-[310px] sm:max-w-[340px] lg:max-w-[365px]">
            {/* Subtle organic watercolor wash backdrop */}
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-[14px] bg-gradient-to-tr from-[#D9BDB2]/35 via-[#C8D1C7]/40 to-transparent blur-md"
            />

            <div className="paper-card relative overflow-hidden p-2 shadow-[0_10px_28px_rgba(50,45,35,0.06)]">
              <div className="relative aspect-[4/4.85] w-full overflow-hidden rounded-md">
                <Image
                  src={hero.instructorImage}
                  alt={`${hero.instructorName} in her sunny art studio`}
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 365px"
                />
              </div>

              {/* Studio Descriptor Tag */}
              <div className="mt-1.5 px-2 py-1 text-center">
                <p className="font-serif text-sm font-semibold text-[#292923]">
                  {hero.instructorName}
                </p>
                <p className="text-[0.66rem] tracking-wider uppercase text-[#6F6B61]">
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
