"use client";

import React from "react";
import { Sparkles, Users, GraduationCap, Heart, Flower2, Palette } from "lucide-react";
import { masterclassData } from "@/data/content";

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Users: <Users className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  GraduationCap: <GraduationCap className="size-5 text-[#68705A]" strokeWidth={1.5} />,
  Heart: <Heart className="size-5 text-[#68705A]" strokeWidth={1.5} />,
};

export const InstructorIntro: React.FC = () => {
  const { trustSection, stats } = masterclassData;

  return (
    <section className="py-16 sm:py-20 bg-[#FAF8F2] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center sm:text-left">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            {trustSection.overline}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.5rem] max-w-3xl">
            <span>{trustSection.headline}</span>
            <span className="italic">{trustSection.headlineHighlight}</span>
          </h2>
          <div className="mt-4 h-0.5 w-14 bg-[#68705A]/40 mx-auto sm:mx-0" />
          <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#6F6B61]">
            {trustSection.description}
          </p>
        </div>

        {/* 4 Stats Cards — Editorial Information Strip */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="paper-card p-6 flex flex-col justify-between"
            >
              <div className="size-10 rounded-full bg-[#C8D1C7]/30 flex items-center justify-center mb-4">
                {iconMap[stat.icon] || <Sparkles className="size-5 text-[#68705A]" strokeWidth={1.5} />}
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-[#292923]">
                  {stat.number}
                </p>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
