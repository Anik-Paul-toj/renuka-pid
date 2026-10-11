"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Play,
  X,
  Quote,
  GraduationCap,
  ArrowRight,
  Palette,
  ExternalLink,
} from "lucide-react";
import { VideoTestimonial } from "@/lib/testimonials/service";

interface TestimonialsSectionProps {
  initialTestimonials?: VideoTestimonial[];
}

export function TestimonialsSection({
  initialTestimonials = [],
}: TestimonialsSectionProps) {
  // Filter strictly to published testimonials only
  const testimonials = initialTestimonials.filter((t) => t.isPublished);

  // Track which video card is currently actively playing (lazy-loaded on click)
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden py-16 sm:py-24 bg-[#F7F4EC] border-t border-[#464137]/10"
    >
      {/* Subtle Watercolor Background Texture */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_10_43 PM.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-15 mix-blend-multiply select-none"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F4EC] via-transparent to-[#F7F4EC]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-[0.18em] uppercase text-[#68705A] bg-[#68705A]/10 border border-[#68705A]/20">
            <Sparkles className="size-3.5" />
            <span>Hear From Our Students</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#292923]">
            Student Stories &amp; Testimonials
          </h2>

          <p className="text-sm sm:text-base text-[#6F6B61] leading-relaxed">
            Real reflections, artistic breakthroughs, and joyful journeys shared by students who discovered their creative voice with Renuka Art Studio.
          </p>
        </div>

        {/* Testimonials Content */}
        {testimonials.length === 0 ? (
          /* Elegant Empty State (No published testimonials yet) */
          <div className="max-w-xl mx-auto p-8 sm:p-12 text-center rounded-3xl bg-[#FAF8F2]/90 border border-[#464137]/12 shadow-sm space-y-4 backdrop-blur-xs">
            <div className="size-14 rounded-full bg-[#68705A]/10 text-[#68705A] flex items-center justify-center mx-auto shadow-inner">
              <Palette className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-[#292923]">
                Student Stories Being Curated
              </h3>
              <p className="text-xs sm:text-sm text-[#6F6B61] leading-relaxed">
                Video reflections and heartfelt reviews from our current cohort are being edited and curated for this showcase. In the meantime, explore our student gallery to see what our learners have created.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="#gallery"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#68705A] hover:bg-[#525946] text-[#FAF8F2] text-xs font-bold shadow-sm transition-colors"
              >
                <span>View Students' Creation Gallery</span>
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
        ) : (
          /* Responsive Video Testimonials Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((item) => {
              const isPlaying = activePlayingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-[#FAF8F2] border border-[#464137]/12 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* 16:9 Aspect Ratio Video Player Card */}
                  <div className="relative aspect-video w-full bg-[#1A1A18] overflow-hidden select-none">
                    {isPlaying ? (
                      /* Mounted Privacy-Enhanced YouTube Iframe with autoplay */
                      <div className="relative w-full h-full">
                        <iframe
                          src={item.embedUrl}
                          title={`${item.studentName} Video Story`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                        {/* Collapse / Close Video Player Button */}
                        <button
                          onClick={() => setActivePlayingId(null)}
                          className="absolute top-2 right-2 z-20 size-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Close Video"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      /* Lazy-Loaded Thumbnail Preview with Play Overlay */
                      <div
                        onClick={() => setActivePlayingId(item.id)}
                        className="relative w-full h-full cursor-pointer group/thumb"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={`${item.studentName} Testimonial Video Thumbnail`}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500 ease-out"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#292923] text-white/50 text-xs">
                            Watch Video Story
                          </div>
                        )}

                        {/* Subtle Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Privacy-Enhanced Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-[0.62rem] font-bold uppercase tracking-wider bg-black/60 text-white/90 border border-white/20 backdrop-blur-xs">
                            YouTube Story
                          </span>
                        </div>

                        {/* Center Watercolor Styled Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="size-14 sm:size-16 rounded-full bg-[#68705A]/90 group-hover/thumb:bg-[#68705A] text-[#FAF8F2] flex items-center justify-center shadow-xl transform group-hover/thumb:scale-110 transition-all duration-300 backdrop-blur-xs">
                            <Play className="size-6 sm:size-7 fill-[#FAF8F2] translate-x-0.5" />
                          </div>
                        </div>

                        {/* Watch Hint on Hover */}
                        <div className="absolute bottom-3 right-3 opacity-90 group-hover/thumb:opacity-100 transition-opacity">
                          <span className="text-[0.68rem] text-white/90 font-medium tracking-wide">
                            Click to play • 16:9
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Testimonial Quote & Student Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Quote Icon & Narrative */}
                      <div className="flex items-start gap-2.5">
                        <Quote className="size-5 text-[#68705A]/40 shrink-0 mt-0.5" />
                        <p className="font-serif text-sm sm:text-base text-[#292923] italic leading-relaxed">
                          &ldquo;{item.description}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Student Attribution Footer */}
                    <div className="pt-4 border-t border-[#464137]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="block font-serif text-sm sm:text-base font-bold text-[#292923]">
                          {item.studentName}
                        </span>
                        <span className="block text-[0.68rem] text-[#6F6B61] tracking-wide">
                          Verified Workshop Student
                        </span>
                      </div>

                      {item.courseName && (
                        <div className="self-start sm:self-auto">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.68rem] font-semibold bg-[#68705A]/10 text-[#68705A] border border-[#68705A]/20">
                            <GraduationCap className="size-3 shrink-0" />
                            <span className="max-w-[150px] truncate">{item.courseName}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
