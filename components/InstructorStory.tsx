"use client";

import React from "react";
import Image from "next/image";
import { GraduationCap, BookOpen, Users, Heart } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

const credentialBadges = [
  {
    icon: GraduationCap,
    label: "Fine Arts Graduate",
    boxImage: "/images/forBox/052d678ca9d09b49c5a93e5d722998b7.jpg.jpeg",
  },
  {
    icon: BookOpen,
    label: "15+ Years Experience",
    boxImage: "/images/forBox/3f3cf5f03a81fdc837ba23ea44e7199e.jpg.jpeg",
  },
  {
    icon: Users,
    label: "1,000+ Students",
    boxImage: "/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg",
  },
  {
    icon: Heart,
    label: "Art for Well-being",
    boxImage: "/images/forBox/8fc925150eae143e15c0f95c41c39cb4.jpg.jpeg",
  },
];

export const InstructorStory: React.FC = () => {
  const { instructorStory } = useLandingContent();

  return (
    <section id="about" className="relative overflow-hidden py-8 sm:py-12 bg-[#F7F4EC]">
      {/* Unique Watercolor Background Artwork */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_09_39 PM.png"
          alt=""
          fill
          className="object-cover object-center opacity-22 mix-blend-multiply select-none"
          priority
        />
        {/* Soft Blending Masks */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F4EC] via-transparent to-[#F7F4EC]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4EC]/60 via-transparent to-[#F7F4EC]/60" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[0.9fr_1.3fr] lg:items-center">
          {/* Left Column: Portrait Card with Double-Border Framing */}
          <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] lg:max-w-none">
            {/* Soft watercolor atmosphere glow */}
            <div
              aria-hidden="true"
              className="absolute -top-4 -left-4 size-40 rounded-full bg-[#C8D1C7]/35 blur-2xl pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-4 -right-4 size-40 rounded-full bg-[#D9BDB2]/25 blur-2xl pointer-events-none"
            />

            <div className="group relative overflow-hidden rounded-2xl border border-[#68705A]/30 bg-[#FAF8F2]/90 p-2.5 sm:p-3 shadow-md hover:border-[#68705A]/50 transition-all duration-300">
              {/* Card Texture from forBox */}
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src="/images/forBox/fcd4ca8ed064a6b93fcf45ff6860f24e.jpg.jpeg"
                  alt=""
                  fill
                  className="object-cover object-center opacity-20 mix-blend-multiply select-none"
                />
                <div className="absolute inset-1.5 rounded-xl border border-[#68705A]/15 pointer-events-none" />
              </div>

              {/* Portrait Image */}
              <div className="relative z-10 aspect-[3/3.6] w-full overflow-hidden rounded-xl border border-[#68705A]/20 shadow-2xs">
                <Image
                  src={instructorStory.image}
                  alt={`Renuka Aggarwal in her art studio`}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-103"
                  sizes="(max-width: 768px) 100vw, 420px"
                />
              </div>

              {/* Handwritten artistic overlay badge */}
              <div className="relative z-10 mt-2 px-2 py-1 text-center">
                <p className="font-script text-xl sm:text-2xl text-[#68705A] leading-snug">
                  &ldquo;Creativity is a kinder way to be in the world.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Bio, Quote & Credentials in 1 Scroll */}
          <div>
            <p className="text-[0.68rem] sm:text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
              {instructorStory.overline}
            </p>

            <h2 className="mt-1 font-serif text-2xl sm:text-3xl lg:text-[2.2rem] font-medium tracking-tight text-[#292923] leading-tight">
              <span>{instructorStory.headline}</span>
              <span className="font-semibold text-[#292923]">{instructorStory.name}</span>
            </h2>

            <p className="mt-0.5 text-[0.68rem] tracking-[0.18em] uppercase font-semibold text-[#6F6B61]">
              {instructorStory.subtitle}
            </p>

            <div className="mt-2.5 h-0.5 w-12 bg-[#68705A]/40" />

            {/* Paragraphs - Compact & Balanced */}
            <div className="mt-3.5 space-y-2 text-xs sm:text-[0.82rem] leading-relaxed text-[#6F6B61]">
              {instructorStory.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Editorial Quote Treatment with forBox Texture */}
            <blockquote className="group relative overflow-hidden mt-3.5 rounded-xl border border-[#68705A]/25 bg-[#FAF8F2]/90 p-3 sm:p-3.5 shadow-2xs hover:border-[#68705A]/45 transition-all duration-300">
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src="/images/forBox/fc390f6a7a95ef0822740a490dd4d369.jpg.jpeg"
                  alt=""
                  fill
                  className="object-cover object-center opacity-25 mix-blend-multiply select-none"
                />
                <div className="absolute inset-1 rounded-lg border border-[#68705A]/15 pointer-events-none" />
              </div>

              <div className="relative z-10">
                <p className="font-serif text-xs sm:text-[0.86rem] italic leading-relaxed text-[#292923]">
                  “{instructorStory.quote}”
                </p>
                <footer className="mt-1 text-[0.66rem] font-semibold uppercase tracking-wider text-[#68705A]">
                  — {instructorStory.quoteAuthor}
                </footer>
              </div>
            </blockquote>

            {/* 4-Item Credential Badges with Individual forBox Textures */}
            <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {credentialBadges.map((badge, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-xl border border-[#68705A]/25 bg-[#FAF8F2]/90 p-2 sm:p-2.5 shadow-2xs hover:border-[#68705A]/45 transition-all duration-300"
                >
                  <div className="pointer-events-none absolute inset-0 z-0">
                    <Image
                      src={badge.boxImage}
                      alt=""
                      fill
                      className="object-cover object-center opacity-20 mix-blend-multiply group-hover:opacity-30 transition-opacity duration-300 select-none"
                    />
                    <div className="absolute inset-1 rounded-lg border border-[#68705A]/15 pointer-events-none" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <badge.icon className="size-4 text-[#68705A] mb-1" strokeWidth={1.5} />
                    <span className="text-[0.68rem] sm:text-[0.72rem] font-medium text-[#292923] leading-snug">
                      {badge.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
