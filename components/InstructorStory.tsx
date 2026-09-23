"use client";

import React from "react";
import Image from "next/image";
import { GraduationCap, BookOpen, Users, Heart } from "lucide-react";
import { masterclassData } from "@/data/content";

export const InstructorStory: React.FC = () => {
  const { instructorStory } = masterclassData;

  return (
    <section id="about" className="py-16 sm:py-24 bg-[#F7F4EC] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          {/* Left Column: Portrait & Watercolor Wash Composition */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Soft pale sage & blush watercolor glow behind image */}
            <div
              aria-hidden="true"
              className="absolute -top-6 -left-6 size-48 rounded-full bg-[#C8D1C7]/40 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-6 -right-6 size-48 rounded-full bg-[#D9BDB2]/30 blur-2xl"
            />

            <div className="paper-card relative overflow-hidden p-2.5 shadow-[0_16px_40px_rgba(50,45,35,0.06)]">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
                <Image
                  src={instructorStory.image}
                  alt={`Renuka Aggarwal in her art studio`}
                  fill
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 480px"
                />
              </div>

              {/* Handwritten artistic overlay badge */}
              <div className="mt-3 px-3 py-2 text-center">
                <p className="font-script text-2xl sm:text-3xl text-[#68705A]">
                  &ldquo;Creativity is a kinder way to be in the world.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Bio & Credentials */}
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
              {instructorStory.overline}
            </p>

            <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
              <span>{instructorStory.headline}</span>
              <span className="font-semibold">{instructorStory.name}</span>
            </h2>

            <p className="mt-1 text-[0.72rem] tracking-[0.2em] uppercase font-semibold text-[#6F6B61]">
              {instructorStory.subtitle}
            </p>

            <div className="mt-4 h-0.5 w-14 bg-[#68705A]/40" />

            {/* Paragraphs */}
            <div className="mt-6 space-y-4 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
              {instructorStory.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Editorial Quote Treatment */}
            <blockquote className="mt-6 rounded-lg bg-[#FAF8F2] p-5 border border-[#464137]/10">
              <p className="font-serif text-base sm:text-lg italic leading-relaxed text-[#292923]">
                “{instructorStory.quote}”
              </p>
              <footer className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#68705A]">
                — {instructorStory.quoteAuthor}
              </footer>
            </blockquote>

            {/* Editorial 4-Item Minimal Badge Strip */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#464137]/10 pt-6">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <GraduationCap className="size-5 text-[#68705A] mb-1.5" strokeWidth={1.5} />
                <span className="text-[0.72rem] font-medium text-[#292923]">Fine Arts Graduate</span>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <BookOpen className="size-5 text-[#68705A] mb-1.5" strokeWidth={1.5} />
                <span className="text-[0.72rem] font-medium text-[#292923]">15+ Years Experience</span>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <Users className="size-5 text-[#68705A] mb-1.5" strokeWidth={1.5} />
                <span className="text-[0.72rem] font-medium text-[#292923]">1,000+ Students</span>
              </div>
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <Heart className="size-5 text-[#68705A] mb-1.5" strokeWidth={1.5} />
                <span className="text-[0.72rem] font-medium text-[#292923]">Art for Well-being</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
