"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, Check, ArrowRight } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

interface VideoSectionProps {
  onOpenModal: () => void;
}

const videoBoxImages: string[] = [
  "/images/forBox/49a18e49a484c5138a3faf7db0388c60.jpg.jpeg",
  "/images/forBox/4fedb8a8c5e7b12b013d7ebda7f5ad23.jpg.jpeg",
  "/images/forBox/8fc925150eae143e15c0f95c41c39cb4.jpg.jpeg",
  "/images/forBox/fc390f6a7a95ef0822740a490dd4d369.jpg.jpeg",
  "/images/forBox/a17d991fa73a904f38f6fe7dd2c8da24.jpg.jpeg",
  "/images/forBox/aba3a3b6536ec35ee7bf460df3f8593c.jpg.jpeg",
];

const takeawayBoxImage = "/images/forBox/3f3cf5f03a81fdc837ba23ea44e7199e.jpg.jpeg";

export const VideoSection: React.FC<VideoSectionProps> = ({ onOpenModal }) => {
  const { videoSection } = useLandingContent();
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#F7F4EC] py-8 sm:py-10 lg:py-12">
      {/* Botanical Arch Watercolor Background Art */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_08_15 PM.png"
          alt=""
          fill
          className="object-cover object-top opacity-30 mix-blend-multiply select-none"
        />
        {/* Seamless blend from audience section above */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#F7F4EC] via-[#F7F4EC]/50 to-transparent" />
        {/* Seamless blend into the section below */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#F7F4EC] via-[#F7F4EC]/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl xl:max-w-7xl px-6 sm:px-8">
        <div className="grid gap-6 lg:gap-8 xl:gap-10 lg:grid-cols-2 lg:items-center">
          {/* Left Column: Video Preview / Player */}
          <div className="overflow-hidden rounded-xl bg-[#FAF8F2]/90 p-2.5 sm:p-3 shadow-md border border-[#464137]/15">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#292923]">
              {!isPlaying ? (
                <div
                  className="group relative h-full w-full cursor-pointer"
                  onClick={() => setIsPlaying(true)}
                >
                  <Image
                    src={videoSection.videoThumbnail}
                    alt={videoSection.videoTitle}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-95"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                  <div className="absolute inset-0 bg-[#292923]/25 transition-colors group-hover:bg-[#292923]/15" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                    <button
                      type="button"
                      aria-label="Play masterclass preview video"
                      className="grid size-14 sm:size-16 place-items-center rounded-full bg-[#68705A] text-[#F7F4EC] shadow-xl transition-transform duration-300 group-hover:scale-110"
                    >
                      <Play className="size-5 sm:size-6 fill-current ml-1" />
                    </button>
                    <span className="rounded-md bg-[#292923]/80 px-3.5 py-1 text-[0.68rem] sm:text-xs font-semibold uppercase tracking-wider text-[#F7F4EC] backdrop-blur-sm">
                      Watch Studio Preview
                    </span>
                  </div>
                </div>
              ) : (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${videoSection.youtubeId || "I0q9IDdAFCs"}?autoplay=1&rel=0`}
                  title={videoSection.videoTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>
          </div>

          {/* Right Column: Learning Outcomes */}
          <div>
            <div>
              <p className="text-[0.68rem] sm:text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#68705A]">
                {videoSection.overline}
              </p>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#292923]">
                {videoSection.headline}
              </h2>
              <div className="mt-2 h-0.5 w-12 bg-[#68705A]/40" />
              {videoSection.description && (
                <p className="mt-2 text-xs text-[#6F6B61] leading-relaxed">
                  {videoSection.description}
                </p>
              )}
            </div>

            {/* List of Learning Outcomes in 2-Column Mini Grid */}
            <ul className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {videoSection.learningPoints.map((point, idx) => {
                const boxImg = videoBoxImages[idx % videoBoxImages.length];

                return (
                  <li
                    key={idx}
                    className="group relative overflow-hidden flex items-start gap-2.5 rounded-lg bg-[#FAF8F2]/90 px-3 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-[0.78rem] leading-relaxed text-[#292923] border border-[#464137]/15 shadow-2xs hover:border-[#68705A]/40 transition-all duration-300"
                  >
                    {/* Box Watercolor Background */}
                    {boxImg && (
                      <div className="pointer-events-none absolute inset-0 z-0">
                        <Image
                          src={boxImg}
                          alt=""
                          fill
                          className="object-cover object-center opacity-20 mix-blend-multiply group-hover:opacity-30 transition-opacity duration-300 select-none"
                        />
                        {/* Artful Inner Border Frame */}
                        <div className="absolute inset-0.5 rounded-[6px] border border-[#464137]/10 group-hover:border-[#68705A]/25 pointer-events-none transition-colors duration-300" />
                      </div>
                    )}

                    <div className="relative z-10 flex items-start gap-2">
                      <div className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#68705A]/15 text-[#68705A]">
                        <Check className="size-3 stroke-[2.4]" />
                      </div>
                      <span className="font-medium text-[#292923]">{point}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Biggest Takeaway Callout */}
            {videoSection.takeawayText && (
              <div className="group relative overflow-hidden mt-3 rounded-xl border border-[#68705A]/25 bg-[#FAF8F2]/90 p-3 sm:p-3.5 shadow-2xs hover:border-[#68705A]/45 transition-all duration-300">
                {/* Takeaway Box Background */}
                <div className="pointer-events-none absolute inset-0 z-0">
                  <Image
                    src={takeawayBoxImage}
                    alt=""
                    fill
                    className="object-cover object-center opacity-25 mix-blend-multiply group-hover:opacity-35 transition-opacity duration-300 select-none"
                  />
                  <div className="absolute inset-1 rounded-lg border border-[#68705A]/15 pointer-events-none" />
                </div>

                <div className="relative z-10">
                  <p className="text-[0.66rem] sm:text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#68705A]">
                    {videoSection.takeawayHeading || "And the biggest takeaway:"}
                  </p>
                  <p className="mt-0.5 font-serif italic text-xs sm:text-[0.85rem] leading-relaxed text-[#292923]">
                    {videoSection.takeawayText}
                  </p>
                </div>
              </div>
            )}

            {/* CTA + Handwritten Note */}
            <div className="mt-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
              <button
                onClick={onOpenModal}
                className="btn-studio px-6 py-2.5 text-xs sm:text-sm tracking-wider"
              >
                <span>{videoSection.ctaText}</span>
                <ArrowRight className="size-3.5" />
              </button>

              <span className="font-script text-xl sm:text-2xl text-[#68705A] select-none">
                {videoSection.handwrittenNote}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
