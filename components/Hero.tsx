"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, Calendar, Clock, Globe, Hourglass } from "lucide-react";
import { workshopData, masterclassData } from "@/data/content";
import { CountdownTimer } from "@/components/CountdownTimer";

interface HeroProps {
  onOpenModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenModal }) => {
  const [isExpired, setIsExpired] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#F7F4EC] pt-4 pb-7 sm:pt-6 sm:pb-9 lg:pt-7 lg:pb-10 border-b border-[#464137]/10">
      {/* Delicate watercolor washes in the background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-5%] size-[38rem] rounded-full bg-[#C8D1C7]/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-[-10%] size-[32rem] rounded-full bg-[#D9BDB2]/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl xl:max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:gap-14 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
          {/* Left Column: Workshop Poster Content */}
          <div className="flex flex-col items-start w-full">
            {/* 1. Eyebrow */}
            <span className="text-[0.7rem] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#68705A]">
              {workshopData.type}
            </span>

            {/* 2. Main Hero Heading */}
            <h1 className="mt-1 font-serif text-[2.35rem] sm:text-4xl lg:text-[2.85rem] xl:text-[3.15rem] font-medium leading-[1.06] tracking-tight text-[#292923]">
              <span>The </span>
              <span className="font-bold tracking-tight uppercase">WATERCOLOUR</span>
              <br />
              <span className="italic font-normal">Roadmap:</span>
            </h1>

            {/* 3. Transformation Statement */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm lg:text-base">
              <span className="font-serif italic text-[#6F6B61]">
                {workshopData.transformationBefore}
              </span>
              <span className="text-[#68705A] font-sans font-medium px-1 text-xs sm:text-sm">
                →
              </span>
              <span className="font-serif font-bold text-[#292923]">
                {workshopData.transformationAfter}
              </span>
            </div>

            {/* 4. Masterclass Description */}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[0.68rem] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#68705A]">
                {workshopData.format}
              </span>
              <span className="text-[#6F6B61]/60">·</span>
              <span className="text-[0.68rem] sm:text-xs font-medium uppercase tracking-[0.16em] text-[#6F6B61]">
                {workshopData.focus}
              </span>
            </div>

            {/* 5. Workshop Details Block */}
            <div className="mt-3.5 w-full max-w-2xl rounded-lg bg-[#FAF8F2] p-3.5 sm:p-4 border border-[#464137]/15 shadow-sm">
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 text-xs sm:text-sm text-[#292923]">
                {/* Date */}
                <div className="flex items-start gap-2">
                  <Calendar className="size-3.5 text-[#68705A] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-wider text-[#6F6B61] block leading-none mb-0.5">
                      Date
                    </span>
                    <span className="font-medium text-xs sm:text-sm text-[#292923]">{workshopData.date}</span>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-2">
                  <Clock className="size-3.5 text-[#68705A] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-wider text-[#6F6B61] block leading-none mb-0.5">
                      Time
                    </span>
                    <span className="font-medium text-xs sm:text-sm text-[#292923]">{workshopData.time}</span>
                  </div>
                </div>

                {/* Language */}
                <div className="flex items-start gap-2">
                  <Globe className="size-3.5 text-[#68705A] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-wider text-[#6F6B61] block leading-none mb-0.5">
                      Language
                    </span>
                    <span className="font-semibold text-[#68705A] tracking-wider text-xs sm:text-sm">
                      {workshopData.language}
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-start gap-2">
                  <Hourglass className="size-3.5 text-[#68705A] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-wider text-[#6F6B61] block leading-none mb-0.5">
                      Duration
                    </span>
                    <span className="font-medium text-xs sm:text-sm text-[#292923]">{workshopData.duration}</span>
                  </div>
                </div>
              </div>

              {/* Fee Row */}
              <div className="mt-2.5 pt-2 border-t border-[#464137]/10 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#6F6B61]">
                  Workshop Fee:
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="line-through text-[#6F6B61]/70 text-xs sm:text-sm">
                    ₹{workshopData.originalPrice}
                  </span>
                  <span className="font-serif text-lg sm:text-2xl font-bold text-[#292923]">
                    ₹{workshopData.offerPrice}
                  </span>
                  <span className="text-[0.62rem] uppercase tracking-wider font-semibold text-[#68705A] bg-[#C8D1C7]/30 px-2 py-0.5 rounded-sm">
                    Special Offer
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Primary Register CTA + Handwritten Note */}
            <div className="mt-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 w-full sm:w-auto">
              <button
                onClick={onOpenModal}
                disabled={isExpired}
                className="btn-studio w-full sm:w-auto px-7 py-3 text-xs sm:text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isExpired ? "REGISTRATION CLOSED" : `${workshopData.cta} →`}</span>
              </button>

              {/* Handwritten artistic annotation */}
              <span className="font-script text-xl sm:text-2xl text-[#68705A] select-none">
                {workshopData.handwrittenPhrase}
              </span>
            </div>

            {/* 7. Live Registration Countdown */}
            <div className="mt-3 w-full pt-2.5 border-t border-[#464137]/10">
              <CountdownTimer
                deadline={workshopData.registrationDeadline}
                onExpireChange={setIsExpired}
              />
            </div>
          </div>

          {/* Artist Studio Artwork & Photograph Container: Appears on right on desktop, below content on mobile */}
          <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[430px] xl:max-w-[460px] mt-6 lg:mt-0">
            {/* Subtle organic watercolor wash backdrop */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-[16px] bg-gradient-to-tr from-[#D9BDB2]/35 via-[#C8D1C7]/40 to-transparent blur-md"
            />

            <div className="paper-card relative overflow-hidden p-2 shadow-[0_12px_32px_rgba(50,45,35,0.07)]">
              <div className="relative aspect-[4/4.5] w-full overflow-hidden rounded-md">
                <Image
                  src={masterclassData.hero.instructorImage}
                  alt={`${masterclassData.hero.instructorName} in her sunny art studio`}
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 380px, 460px"
                />
              </div>

              {/* Studio Descriptor Tag */}
              <div className="mt-1.5 px-2 py-0.5 text-center">
                <p className="font-serif text-sm font-semibold text-[#292923]">
                  {masterclassData.hero.instructorName}
                </p>
                <p className="text-[0.64rem] tracking-wider uppercase text-[#6F6B61]">
                  {masterclassData.hero.instructorTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
