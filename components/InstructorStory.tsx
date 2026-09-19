"use client";

import React from "react";
import Image from "next/image";
import { masterclassData } from "@/data/content";

export const InstructorStory: React.FC = () => {
  const { instructorStory } = masterclassData;

  return (
    <section className="py-16 sm:py-24 bg-surface/30 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          {/* Left Column: Image with organic glow */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -left-6 -top-6 size-44 rounded-full bg-icon/10 blur-2xl"
            />
            <div className="relative overflow-hidden rounded-[2.25rem] bg-card p-2 shadow-[0_30px_60px_-36px_rgba(40,32,26,0.35)] ring-1 ring-border/60">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem]">
                <Image
                  src={instructorStory.image}
                  alt={`Master artist ${instructorStory.name} in atelier`}
                  fill
                  className="object-cover object-top transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Story & Philosophy */}
          <div>
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
                {instructorStory.overline}
              </p>
              <h2 className="mt-2.5 font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
                <span>{instructorStory.headline}</span>
                <span className="text-icon">{instructorStory.name}</span>
              </h2>
              <div className="mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 to-transparent" />
            </div>

            {/* Paragraphs */}
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
              {instructorStory.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Oversized Quote */}
            <blockquote className="mt-8 rounded-2xl bg-surface/70 p-6 font-display text-lg sm:text-xl italic leading-relaxed text-icon ring-1 ring-border/50">
              “{instructorStory.quote}”
              <footer className="mt-3 text-sm not-italic font-sans font-semibold text-subheading">
                — {instructorStory.quoteAuthor}
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};
