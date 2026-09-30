"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Calendar, Clock, Globe, Hourglass, Video } from "lucide-react";
import { workshopData, MasterclassData } from "@/data/content";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useLandingContent } from "@/components/LandingContentProvider";

interface HeroProps {
  onOpenModal: () => void;
  content?: MasterclassData["hero"];
}

export const Hero: React.FC<HeroProps> = ({ onOpenModal, content }) => {
  const [isExpired, setIsExpired] = useState(false);
  const [coursePricing, setCoursePricing] = useState<{
    originalPrice: number;
    offerPrice: number;
    duration?: string;
  } | null>(null);

  const { hero: contextHero } = useLandingContent();
  const heroContent = content || contextHero;

  useEffect(() => {
    fetch("/api/cohort-batches/active")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.batch?.course) {
          const c = data.batch.course;
          setCoursePricing({
            originalPrice: c.originalPrice,
            offerPrice: c.offerPrice,
            duration: c.durationMinutes ? `${c.durationMinutes} mins` : undefined,
          });
        }
      })
      .catch(() => {});
  }, []);

  const displayOriginalPrice = coursePricing?.originalPrice ?? workshopData.originalPrice;
  const displayOfferPrice = coursePricing?.offerPrice ?? workshopData.offerPrice;
  const displayDuration = coursePricing?.duration ?? workshopData.duration;

  return (
    <section className="relative overflow-hidden bg-[#F7F4EC] -mt-14 sm:-mt-16 pt-[4.5rem] sm:pt-[5.5rem] lg:pt-[5.75rem] pb-8 sm:pb-10 lg:pb-12">
      {/* Botanical Watercolor Background Art */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_06_12 PM.png"
          alt=""
          fill
          priority
          className="object-cover object-top opacity-35 mix-blend-multiply select-none"
        />
        {/* Seamless blend into the next section */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F7F4EC] via-[#F7F4EC]/50 to-transparent" />
      </div>

      {/* Delicate watercolor washes in the background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-5%] size-[38rem] rounded-full bg-[#C8D1C7]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-[-10%] size-[32rem] rounded-full bg-[#D9BDB2]/15 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl xl:max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:gap-14 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
          {/* Left Column: Workshop Poster Content */}
          <div className="flex flex-col items-start w-full">
            {/* 1. Eyebrow */}
            <span className="text-[0.7rem] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#444C38]">
              {workshopData.type}
            </span>

            {/* 2. Main Hero Heading */}
            <h1 className="mt-1 font-serif text-[2.35rem] sm:text-4xl lg:text-[2.85rem] xl:text-[3.15rem] font-medium leading-[1.06] tracking-tight text-[#14120E]">
              <span>The </span>
              <span className="font-bold tracking-tight uppercase">WATERCOLOUR</span>
              <br />
              <span className="italic font-normal">Roadmap:</span>
            </h1>

            {/* 3. Transformation Tagline — One Single Line with Both Highlighted */}
            <p className="mt-2 sm:mt-2.5 font-serif text-[1.05rem] sm:text-[1.28rem] lg:text-[1.5rem] font-bold text-[#14120E] tracking-tight leading-snug">
              <span>{workshopData.transformationBefore}</span>
              <span className="font-semibold italic text-[#444C38] text-[0.88em] mx-1.5 sm:mx-2">to</span>
              <span>{workshopData.transformationAfter}</span>
            </p>

            {/* 4. Masterclass Description */}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[0.68rem] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#444C38]">
                {workshopData.format}
              </span>
              <span className="text-[#444C38]/60">·</span>
              <span className="text-[0.68rem] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#38352E]">
                {workshopData.focus}
              </span>
            </div>

            {/* 5. Workshop Details Block — Custom Botanical Watercolor Texture Container */}
            <div className="group relative overflow-hidden mt-3.5 w-full max-w-2xl rounded-xl bg-[#FAF8F2]/92 backdrop-blur-md p-4 sm:p-5 border border-[#444C38]/40 shadow-md shadow-[#14120E]/08 transition-all duration-300 hover:border-[#444C38]/55">
              {/* Custom Botanical Watercolor Texture Overlay */}
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                  alt=""
                  fill
                  className="object-cover object-center opacity-30 mix-blend-multiply group-hover:opacity-38 transition-opacity duration-300 select-none"
                />
                {/* Refined Inner Hairline Border Framing */}
                <div className="absolute inset-1 rounded-lg border border-[#444C38]/20 pointer-events-none" />
              </div>

              <div className="relative z-10">
                {/* 5 Core Details Grid: Date, Time, Platform, Duration, Language */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-4 sm:gap-x-6 text-xs sm:text-sm">
                  {/* Date */}
                  <div className="flex items-start gap-2.5 col-span-2 sm:col-span-1">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#444C38]/15 border border-[#444C38]/25 text-[#444C38] mt-0.5">
                      <Calendar className="size-3.5" strokeWidth={2} />
                    </div>
                    <div>
                      <span className="text-[0.64rem] sm:text-[0.68rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                        Date
                      </span>
                      <span className="font-bold text-xs sm:text-[0.84rem] text-[#14120E] leading-tight block">
                        {workshopData.date}
                      </span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-2.5 col-span-1">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#444C38]/15 border border-[#444C38]/25 text-[#444C38] mt-0.5">
                      <Clock className="size-3.5" strokeWidth={2} />
                    </div>
                    <div>
                      <span className="text-[0.64rem] sm:text-[0.68rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                        Time
                      </span>
                      <span className="font-bold text-xs sm:text-[0.84rem] text-[#14120E] leading-tight block">
                        {workshopData.time}
                      </span>
                    </div>
                  </div>

                  {/* Platform: Zoom */}
                  <div className="flex items-start gap-2.5 col-span-1">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#1E3A5F]/15 border border-[#1E3A5F]/25 text-[#132A45] mt-0.5">
                      <Video className="size-3.5" strokeWidth={2} />
                    </div>
                    <div>
                      <span className="text-[0.64rem] sm:text-[0.68rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                        Platform
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#132A45] bg-[#1E3A5F]/15 border border-[#1E3A5F]/30 px-2 py-0.5 rounded text-[0.78rem] sm:text-[0.82rem] leading-none">
                        {workshopData.platform || "Zoom"}
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-start gap-2.5 col-span-1">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#444C38]/15 border border-[#444C38]/25 text-[#444C38] mt-0.5">
                      <Hourglass className="size-3.5" strokeWidth={2} />
                    </div>
                    <div>
                      <span className="text-[0.64rem] sm:text-[0.68rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                        Duration
                      </span>
                      <span className="font-bold text-xs sm:text-[0.84rem] text-[#14120E] leading-tight block">
                        {displayDuration}
                      </span>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="flex items-start gap-2.5 col-span-1">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#444C38]/15 border border-[#444C38]/25 text-[#444C38] mt-0.5">
                      <Globe className="size-3.5" strokeWidth={2} />
                    </div>
                    <div>
                      <span className="text-[0.64rem] sm:text-[0.68rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                        Language
                      </span>
                      <span className="font-bold text-[#353D2A] tracking-wider text-xs sm:text-[0.84rem] leading-tight block">
                        {workshopData.language}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workshop Fee Row */}
                <div className="mt-3.5 pt-3 border-t border-[#464137]/15 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[0.66rem] sm:text-[0.7rem] uppercase tracking-[0.16em] font-bold text-[#3E3A32] block leading-none">
                      Workshop Fee:
                    </span>
                    <span className="text-[0.64rem] font-semibold text-[#38352E] mt-0.5 block">
                      Complete Live Atelier Access
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="line-through text-[#6F6B61] text-xs sm:text-sm font-semibold">
                      ₹{displayOriginalPrice}
                    </span>
                    <span className="font-serif text-2xl sm:text-[2rem] font-extrabold text-[#B93821] tracking-tight drop-shadow-2xs">
                      ₹{displayOfferPrice}
                    </span>
                    <span className="text-[0.64rem] uppercase tracking-wider font-bold text-[#8E2515] bg-[#B93821]/12 border border-[#B93821]/30 px-2.5 py-0.5 rounded-sm">
                      Special Offer
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Primary Register CTA + Handwritten Note */}
            <div className="mt-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 w-full sm:w-auto">
              <button
                onClick={onOpenModal}
                disabled={isExpired}
                className="btn-studio w-full sm:w-auto px-7 py-3 text-xs sm:text-sm tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isExpired ? "REGISTRATION CLOSED" : `${workshopData.cta} →`}</span>
              </button>

              {/* Handwritten artistic annotation */}
              <span className="font-script text-xl sm:text-2xl text-[#444C38] select-none font-bold">
                {workshopData.handwrittenPhrase}
              </span>
            </div>

            {/* 7. Live Registration Countdown */}
            <div className="mt-3 w-full pt-2.5 border-t border-[#464137]/15">
              <CountdownTimer
                deadline={workshopData.registrationDeadline}
                onExpireChange={setIsExpired}
              />
            </div>
          </div>

          {/* Instructor Portrait: Naturally emerging from watercolor artwork without hard edges */}
          <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[430px] xl:max-w-[460px] mt-6 lg:mt-0 flex flex-col items-center">
            {/* Soft atmospheric watercolor backlight glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 sm:-inset-6 rounded-full bg-gradient-to-tr from-[#D9BDB2]/25 via-[#C8D1C7]/30 to-[#F7F4EC]/10 blur-2xl select-none"
            />

            {/* Seamless Feathered Portrait */}
            <div className="relative w-full aspect-[4/4.6] overflow-visible">
              <div
                className="relative size-full"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(ellipse 78% 76% at 50% 46%, black 42%, rgba(0,0,0,0.85) 62%, rgba(0,0,0,0.35) 82%, transparent 100%)",
                  maskImage:
                    "radial-gradient(ellipse 78% 76% at 50% 46%, black 42%, rgba(0,0,0,0.85) 62%, rgba(0,0,0,0.35) 82%, transparent 100%)",
                }}
              >
                <Image
                  src={heroContent.instructorImage}
                  alt={`${heroContent.instructorName} in her sunny art studio`}
                  fill
                  priority
                  className="object-cover object-center select-none"
                  sizes="(max-width: 1024px) 380px, 460px"
                />

                {/* Soft watercolor peripheral edge-dissolve overlays matching #F7F4EC */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#F7F4EC]/85 via-[#F7F4EC]/30 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#F7F4EC] via-[#F7F4EC]/40 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#F7F4EC]/85 via-[#F7F4EC]/30 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#F7F4EC]/85 via-[#F7F4EC]/30 to-transparent" />
              </div>
            </div>

            {/* Studio Descriptor Tag: Naturally flowing below the portrait */}
            <div className="relative z-10 -mt-2 text-center max-w-[360px] sm:max-w-[440px] mx-auto px-2">
              <p className="font-serif text-base sm:text-lg font-bold text-[#14120E] tracking-tight">
                {heroContent.instructorName}
              </p>
              <p className="mt-0.5 text-[0.66rem] sm:text-[0.72rem] tracking-[0.14em] uppercase font-bold text-[#444C38] leading-snug">
                Art Educator | Founder, Renuka Art Studio
              </p>
              <p className="mt-0.5 text-[0.63rem] sm:text-[0.68rem] tracking-[0.12em] uppercase font-bold text-[#444C38] leading-snug">
                Director and Co-Owner of Meraki Institute of Fine Art
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
