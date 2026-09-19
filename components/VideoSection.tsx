"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, Check, ArrowRight } from "lucide-react";
import { masterclassData } from "@/data/content";

interface VideoSectionProps {
  onOpenModal: () => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ onOpenModal }) => {
  const { videoSection } = masterclassData;
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-16 sm:py-24 bg-[#EEE9DE] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Column: Video Preview / Player */}
          <div className="overflow-hidden rounded-xl bg-[#FAF8F2] p-3 shadow-[0_12px_36px_rgba(50,45,35,0.06)] border border-[#464137]/10">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <button
                      type="button"
                      aria-label="Play masterclass preview video"
                      className="grid size-16 sm:size-18 place-items-center rounded-full bg-[#68705A] text-[#F7F4EC] shadow-xl transition-transform duration-300 group-hover:scale-110"
                    >
                      <Play className="size-6 sm:size-7 fill-current ml-1" />
                    </button>
                    <span className="rounded-md bg-[#292923]/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#F7F4EC] backdrop-blur-sm">
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
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
                {videoSection.overline}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl">
                {videoSection.headline}
              </h2>
              <div className="mt-4 h-0.5 w-14 bg-[#68705A]/40" />
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
                {videoSection.description}
              </p>
            </div>

            {/* List of 8 Learning Outcomes */}
            <ul className="mt-6 space-y-2.5">
              {videoSection.learningPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-lg bg-[#FAF8F2] px-4 py-3 text-xs sm:text-sm leading-relaxed text-[#292923] border border-[#464137]/10"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-[#68705A] stroke-[2.2]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            {/* CTA + Handwritten Note */}
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <button
                onClick={onOpenModal}
                className="btn-studio px-8 py-3.5"
              >
                <span>{videoSection.ctaText}</span>
                <ArrowRight className="size-4" />
              </button>

              <span className="font-script text-2xl text-[#68705A] select-none">
                {videoSection.handwrittenNote}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
