"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
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
  User: <User className="size-4.5 text-[#24425F]" strokeWidth={1.6} />,
  Droplets: <Droplets className="size-4.5 text-[#24425F]" strokeWidth={1.6} />,
  Palette: <Palette className="size-4.5 text-[#24425F]" strokeWidth={1.6} />,
  Brush: <Brush className="size-4.5 text-[#24425F]" strokeWidth={1.6} />,
  BookOpen: <BookOpen className="size-4.5 text-[#24425F]" strokeWidth={1.6} />,
  GraduationCap: <GraduationCap className="size-4.5 text-[#24425F]" strokeWidth={1.6} />,
  Heart: <Heart className="size-4.5 text-[#24425F]" strokeWidth={1.6} />,
};

const boxImageMap: Record<string, string> = {
  beginners: "/images/forBox/e9bd27865085ef28358146d25a76b74d.jpg.jpeg",
  "water-control": "/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg",
  "flat-paintings": "/images/forBox/da347cc2855190acf6ba136578c7e31e.jpg.jpeg",
  "hobby-artists": "/images/forBox/e19752bad2007ef6f8a72ec074cbafec.jpg.jpeg",
  "youtube-tutorials": "/images/forBox/b765741cbefcab043925bc35973f3c45.jpg.jpeg",
  "learn-professionally": "/images/forBox/052d678ca9d09b49c5a93e5d722998b7.jpg.jpeg",
  conclusion: "/images/forBox/fcd4ca8ed064a6b93fcf45ff6860f24e.jpg.jpeg",
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
      className="relative py-8 sm:py-10 lg:py-12 bg-[#F7F4EC] border-b border-[#464137]/10 overflow-hidden"
    >
      {/* Botanical Wildflower Watercolor Background Art */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_07_15 PM.png"
          alt=""
          fill
          className="object-cover object-center opacity-30 mix-blend-multiply select-none"
        />
        {/* Soft blend at top from hero section */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#F7F4EC] via-[#F7F4EC]/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl xl:max-w-7xl px-6 sm:px-8">
        {/* Section Heading with compact whitespace */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
          <h2
            ref={headingRef}
            className="no-gsap font-serif text-2xl sm:text-3xl lg:text-[2.2rem] font-medium tracking-tight text-[#292923] leading-tight"
          >
            {targetAudience.heading}
          </h2>
          <div className="mt-2 h-0.5 w-12 bg-[#68705A]/40 mx-auto" />
        </div>

        {/* Content Blocks: 3-Column Grid on Desktop, 2 on Tablet, 1 on Mobile */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 lg:gap-4 no-gsap"
        >
          {targetAudience.items.map((item) => {
            const isConcluding = item.isConclusion;
            const bgImage = boxImageMap[item.id];

            if (isConcluding) {
              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden sm:col-span-2 lg:col-span-3 rounded-xl border border-[#24425F]/25 bg-[#FAF8F2]/90 px-5 py-3 sm:px-6 sm:py-3.5 shadow-xs hover:border-[#24425F]/45 transition-all duration-300"
                >
                  {/* Subtle Box Watercolor Background */}
                  {bgImage && (
                    <div className="pointer-events-none absolute inset-0 z-0">
                      <Image
                        src={bgImage}
                        alt=""
                        fill
                        className="object-cover object-center opacity-25 mix-blend-multiply group-hover:opacity-35 transition-opacity duration-300 select-none"
                      />
                      {/* Artful Inner Border */}
                      <div className="absolute inset-1 rounded-lg border border-[#24425F]/15 pointer-events-none" />
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="audience-icon-badge flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg bg-[#24425F]/10 border border-[#24425F]/20 text-[#24425F]">
                        {iconMap[item.icon] || <Heart className="size-4 text-[#24425F]" strokeWidth={1.6} />}
                      </div>
                      <h3 className="text-xs sm:text-[0.8rem] font-bold uppercase tracking-[0.14em] text-[#24425F]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[#292923] font-medium sm:text-right">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border border-[#464137]/15 bg-[#FAF8F2]/85 p-3.5 sm:p-4 hover:border-[#24425F]/40 hover:shadow-xs transition-all duration-300 flex flex-col justify-between"
              >
                {/* Subtle Box Watercolor Background */}
                {bgImage && (
                  <div className="pointer-events-none absolute inset-0 z-0">
                    <Image
                      src={bgImage}
                      alt=""
                      fill
                      className="object-cover object-center opacity-20 mix-blend-multiply group-hover:opacity-30 transition-opacity duration-300 select-none"
                    />
                    {/* Artful Inner Border Frame */}
                    <div className="absolute inset-1 rounded-lg border border-[#464137]/10 group-hover:border-[#24425F]/25 transition-colors duration-300 pointer-events-none" />
                  </div>
                )}

                <div className="relative z-10 flex items-start gap-3">
                  <div className="audience-icon-badge flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg bg-[#24425F]/08 border border-[#24425F]/15 text-[#24425F] transition-colors duration-300">
                    {iconMap[item.icon] || <Palette className="size-4 text-[#24425F]" strokeWidth={1.6} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[0.72rem] sm:text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[#24425F] leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1 leading-relaxed text-[#5A564D] text-xs">
                      {item.description}
                    </p>
                    {item.quote && (
                      <p className="mt-1 text-xs font-serif italic text-[#292923]">
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
