"use client";

import React from "react";
import Image from "next/image";
import { GraduationCap, BookOpen, Users, Heart } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

const credentialBadges = [
  {
    icon: BookOpen,
    label: "15+ Years Experience",
    detail: "15+ years of teaching experience",
    boxImage: "/images/forBox/3f3cf5f03a81fdc837ba23ea44e7199e.jpg.jpeg",
  },
  {
    icon: Users,
    label: "5,000+ Students Taught",
    detail: "Across diverse age groups & skill levels",
    boxImage: "/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg",
  },
  {
    icon: GraduationCap,
    label: "Qualified Art Educator",
    detail: "Trained at top reputed art institutions",
    boxImage: "/images/forBox/052d678ca9d09b49c5a93e5d722998b7.jpg.jpeg",
  },
];

function formatBioParagraph(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|Meraki Institute of Fine Art)/gi);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#292923]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.toLowerCase() === "meraki institute of fine art") {
      return (
        <strong key={i} className="font-semibold text-[#292923]">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export const InstructorStory: React.FC = () => {
  const { instructorStory } = useLandingContent();

  return (
    <section id="about" className="relative overflow-hidden py-12 sm:py-16 lg:py-20 bg-[#F7F4EC]">
      {/* Unique Watercolor Background Artwork */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_09_39 PM.png"
          alt=""
          fill
          className="object-cover object-center opacity-20 mix-blend-multiply select-none"
          priority
        />
        {/* Soft Blending Masks */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F4EC] via-transparent to-[#F7F4EC]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4EC]/70 via-transparent to-[#F7F4EC]/70" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center justify-center gap-2">
          <span className="h-px w-6 bg-[#4A533D]/40" />
          <p className="text-[0.72rem] sm:text-[0.78rem] font-bold uppercase tracking-[0.26em] text-[#4A533D]">
            {instructorStory.overline || "ABOUT RENUKA"}
          </p>
          <span className="h-px w-6 bg-[#4A533D]/40" />
        </div>

        {/* Heading */}
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-medium tracking-tight text-[#1A1814] leading-tight">
          <span>{instructorStory.headline}</span>
          <span className="font-semibold text-[#1A1814]">{instructorStory.name}</span>
        </h2>

        {/* Role */}
        <p className="mt-2 text-xs sm:text-sm tracking-[0.2em] uppercase font-bold text-[#505942]">
          {instructorStory.subtitle}
        </p>

        {/* Decorative Divider */}
        <div className="mx-auto mt-4 mb-6 flex items-center justify-center gap-2">
          <div className="h-px w-10 sm:w-16 bg-[#4A533D]/30" />
          <span className="size-1.5 rounded-full bg-[#4A533D]/60" />
          <div className="h-px w-10 sm:w-16 bg-[#4A533D]/30" />
        </div>

        {/* Description Paragraphs */}
        <div className="mx-auto max-w-2xl sm:max-w-3xl space-y-4 text-center text-sm sm:text-base lg:text-[1.03rem] leading-relaxed text-[#2C2A24]">
          {instructorStory.paragraphs.map((p, idx) => (
            <p key={idx}>{formatBioParagraph(p)}</p>
          ))}
        </div>

        {/* Quote Block */}
        <blockquote className="group relative mx-auto mt-8 sm:mt-10 max-w-2xl sm:max-w-3xl overflow-hidden rounded-2xl border border-[#4A533D]/25 bg-[#FAF8F2]/95 p-5 sm:p-7 shadow-xs hover:border-[#4A533D]/45 transition-all duration-300">
          <div className="pointer-events-none absolute inset-0 z-0">
            <Image
              src="/images/forBox/fc390f6a7a95ef0822740a490dd4d369.jpg.jpeg"
              alt=""
              fill
              className="object-cover object-center opacity-25 mix-blend-multiply select-none"
            />
            <div className="absolute inset-1.5 rounded-xl border border-[#4A533D]/15 pointer-events-none" />
          </div>

          <div className="relative z-10 text-center">
            <p className="font-serif text-base sm:text-lg lg:text-[1.15rem] italic leading-relaxed text-[#1A1814]">
              &ldquo;{instructorStory.quote}&rdquo;
            </p>
            <footer className="mt-3 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#4A533D]">
              — {instructorStory.quoteAuthor?.toUpperCase()}
            </footer>
          </div>
        </blockquote>

        {/* Credentials Cards: 3 columns on desktop, 1 on mobile */}
        <div className="no-gsap mx-auto mt-8 sm:mt-10 max-w-3xl sm:max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5 text-left">
          {credentialBadges.map((badge, idx) => (
            <div
              key={idx}
              className="no-gsap group relative overflow-hidden rounded-2xl border border-[#4A533D]/25 bg-[#FAF8F2] p-4 sm:p-5 shadow-xs hover:border-[#4A533D]/50 hover:shadow-sm transition-all duration-300"
            >
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src={badge.boxImage}
                  alt=""
                  fill
                  className="object-cover object-center opacity-20 mix-blend-multiply group-hover:opacity-30 transition-opacity duration-300 select-none"
                />
                <div className="absolute inset-1 rounded-xl border border-[#4A533D]/15 pointer-events-none" />
              </div>

              <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="mb-2.5 flex size-9 items-center justify-center rounded-xl bg-[#EBE7DC] border border-[#4A533D]/20 text-[#3D4431]">
                  <badge.icon className="size-4.5 text-[#3D4431]" strokeWidth={1.75} />
                </div>
                <span className="text-sm sm:text-[0.92rem] font-bold text-[#1A1814] leading-snug">
                  {badge.label}
                </span>
                <span className="mt-1 text-xs sm:text-[0.78rem] font-medium text-[#423F36] leading-relaxed">
                  {badge.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
