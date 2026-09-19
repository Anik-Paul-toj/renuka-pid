"use client";

import React from "react";
import { masterclassData } from "@/data/content";

export const InstructorIntro: React.FC = () => {
  const { trustSection, stats } = masterclassData;

  return (
    <section className="py-16 sm:py-24 border-t border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            {trustSection.overline}
          </p>
          <h2 className="mt-2.5 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            <span>{trustSection.headline}</span>
            <span className="text-icon">{trustSection.headlineHighlight}</span>
          </h2>
          <div className="mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 to-transparent" />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {trustSection.description}
          </p>
        </div>

        {/* 4 Stats Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group rounded-2xl bg-surface/60 p-6 ring-1 ring-border/50 transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:ring-icon/30 hover:shadow-[0_18px_40px_-24px_rgba(40,32,26,0.2)]"
            >
              <p className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-icon group-hover:text-cta transition-colors">
                {stat.number}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
