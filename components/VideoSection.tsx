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
    <section className="py-16 sm:py-24 border-t border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Column: Video Preview / Player */}
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-surface via-surface/60 to-surface/30 p-2 ring-1 ring-border/60 shadow-[0_24px_50px_-20px_rgba(40,32,26,0.25)]">
            <div className="relative aspect-video w-full overflow-hidden rounded-[1.6rem] bg-black">
              {!isPlaying ? (
                <div className="group relative h-full w-full cursor-pointer" onClick={() => setIsPlaying(true)}>
                  <Image
                    src={videoSection.videoThumbnail}
                    alt={videoSection.videoTitle}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                  <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <button
                      type="button"
                      aria-label="Play masterclass preview video"
                      className="grid size-16 sm:size-20 place-items-center rounded-full bg-cta text-cta-foreground shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_16px_36px_-8px_rgba(198,83,40,0.9)]"
                    >
                      <Play className="size-7 sm:size-8 fill-current ml-1" />
                    </button>
                    <span className="rounded-full bg-black/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                      Watch 3-Min Studio Preview
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
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
                {videoSection.overline}
              </p>
              <h2 className="mt-2.5 font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
                {videoSection.headline}
              </h2>
              <div className="mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 to-transparent" />
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {videoSection.description}
              </p>
            </div>

            {/* List of 8 Learning Outcomes */}
            <ul className="mt-6 space-y-2.5">
              {videoSection.learningPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl bg-surface/50 px-4 py-3 text-sm leading-relaxed text-foreground ring-1 ring-border/40 transition-colors hover:bg-surface/80"
                >
                  <Check className="mt-0.5 size-4.5 shrink-0 text-icon stroke-[2.5]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            {/* Secondary CTA */}
            <button
              onClick={onOpenModal}
              className="group mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-cta px-8 py-3.5 text-sm font-semibold text-cta-foreground shadow-sm transition-all hover:bg-cta/90 hover:shadow-[0_14px_30px_-14px_rgba(198,83,40,0.85)] cursor-pointer"
            >
              <span>{videoSection.ctaText}</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
