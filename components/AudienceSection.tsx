"use client";

import React, { useEffect, useRef } from "react";
import {
  User,
  Droplets,
  Palette,
  Brush,
  BookOpen,
  GraduationCap,
  Heart,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLandingContent } from "@/components/LandingContentProvider";

const iconMap: Record<string, React.ReactNode> = {
  User: <User className="size-5 text-[#24425F]" strokeWidth={1.5} />,
  Droplets: <Droplets className="size-5 text-[#24425F]" strokeWidth={1.5} />,
  Palette: <Palette className="size-5 text-[#24425F]" strokeWidth={1.5} />,
  Brush: <Brush className="size-5 text-[#24425F]" strokeWidth={1.5} />,
  BookOpen: <BookOpen className="size-5 text-[#24425F]" strokeWidth={1.5} />,
  GraduationCap: <GraduationCap className="size-5 text-[#24425F]" strokeWidth={1.5} />,
  Heart: <Heart className="size-5 text-[#24425F]" strokeWidth={1.5} />,
};

export const AudienceSection: React.FC = () => {
  const { targetAudience } = useLandingContent();

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Heading softly fades and slides upward
      gsap.from(headingRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        y: 20,
        duration: 0.85,
        ease: "power2.out",
      });

      // 2. Content blocks reveal sequentially as they enter the viewport
      const cards = gridRef.current ? Array.from(gridRef.current.children) : [];
      if (cards.length > 0) {
        gsap.from(cards, {
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 82%",
            toggleActions: "play none none none",
          },
          opacity: 0,
          y: 22,
          duration: 0.8,
          stagger: 0.09,
          ease: "power2.out",
        });

        // 3. Icons softly fade and scale in
        const icons = sectionRef.current?.querySelectorAll(".audience-icon-badge");
        if (icons && icons.length > 0) {
          gsap.from(icons, {
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 82%",
              toggleActions: "play none none none",
            },
            opacity: 0,
            scale: 0.82,
            duration: 0.75,
            stagger: 0.09,
            ease: "power2.out",
          });
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="who-this-is-for"
      className="relative py-20 sm:py-28 lg:py-32 bg-[#F7F4EC] border-b border-[#464137]/10 overflow-hidden"
    >
      <div className="relative mx-auto max-w-5xl xl:max-w-6xl px-6 sm:px-8">
        {/* Section Heading with generous whitespace */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20">
          <h2
            ref={headingRef}
            className="no-gsap font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-medium tracking-tight text-[#292923] leading-[1.18]"
          >
            {targetAudience.heading}
          </h2>
          <div className="mt-4 h-0.5 w-16 bg-[#68705A]/40 mx-auto" />
        </div>

        {/* Content Blocks: 2-Column Grid on Desktop, Stacked on Mobile */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-7 no-gsap"
        >
          {targetAudience.items.map((item) => {
            const isConcluding = item.isConclusion;

            return (
              <div
                key={item.id}
                className={`group rounded-2xl border transition-colors duration-300 ${
                  isConcluding
                    ? "md:col-span-2 border-[#24425F]/20 bg-[#FDFCF9] p-7 sm:p-8 lg:p-9 hover:border-[#24425F]/40"
                    : "border-[#464137]/10 bg-[#FDFCF9] p-6 sm:p-7 lg:p-8 hover:border-[#24425F]/30"
                }`}
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Minimal Line Icon on Left */}
                  <div
                    className={`audience-icon-badge flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                      isConcluding
                        ? "bg-[#24425F]/10 border border-[#24425F]/20 text-[#24425F]"
                        : "bg-[#24425F]/06 border border-[#24425F]/10 text-[#24425F]"
                    }`}
                  >
                    {iconMap[item.icon] || <Palette className="size-5 text-[#24425F]" strokeWidth={1.5} />}
                  </div>

                  {/* Text on Right */}
                  <div className="flex-1 min-w-0">
                    {/* Uppercase Category Heading in Accent Blue/Indigo */}
                    <h3 className="text-xs sm:text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[#24425F] leading-snug">
                      {item.title}
                    </h3>

                    {/* Supporting Description */}
                    <p
                      className={`mt-2 leading-relaxed text-[#5A564D] ${
                        isConcluding
                          ? "text-base sm:text-lg text-[#292923] font-normal"
                          : "text-sm sm:text-[0.95rem]"
                      }`}
                    >
                      {item.description}
                    </p>

                    {/* Styled Quote for YouTube item if present */}
                    {item.quote && (
                      <p className="mt-2 text-sm sm:text-base font-serif italic text-[#292923]">
                        {item.quote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
