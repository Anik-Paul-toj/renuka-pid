"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { masterclassData } from "@/data/content";

export const InstructorIntro: React.FC = () => {
  const { aboutArtist } = masterclassData;

  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const roleRef = useRef<HTMLParagraphElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);
  const credentialsRef = useRef<HTMLDivElement>(null);
  const eduBlocksRef = useRef<HTMLDivElement>(null);
  const expertiseBlocksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
          toggleActions: "play none none none",
        },
      });

      tl.from(eyebrowRef.current, {
        opacity: 0,
        y: 12,
        duration: 0.8,
        ease: "power2.out",
      })
        .from(
          headingRef.current,
          {
            opacity: 0,
            y: 16,
            duration: 0.85,
            ease: "power2.out",
          },
          "-=0.6"
        )
        .from(
          roleRef.current,
          {
            opacity: 0,
            y: 10,
            duration: 0.75,
            ease: "power2.out",
          },
          "-=0.6"
        )
        .from(
          dividerRef.current,
          {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.7,
            ease: "power2.out",
          },
          "-=0.5"
        )
        .from(
          introRef.current,
          {
            opacity: 0,
            y: 14,
            duration: 0.85,
            ease: "power2.out",
          },
          "-=0.4"
        )
        .from(
          bioRef.current ? Array.from(bioRef.current.children) : [],
          {
            opacity: 0,
            y: 14,
            duration: 0.85,
            stagger: 0.15,
            ease: "power2.out",
          },
          "-=0.5"
        )
        .from(
          credentialsRef.current,
          {
            opacity: 0,
            y: 16,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.4"
        )
        .from(
          eduBlocksRef.current ? Array.from(eduBlocksRef.current.children) : [],
          {
            opacity: 0,
            y: 12,
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
          },
          "-=0.5"
        )
        .from(
          expertiseBlocksRef.current ? Array.from(expertiseBlocksRef.current.children) : [],
          {
            opacity: 0,
            y: 12,
            duration: 0.7,
            stagger: 0.06,
            ease: "power2.out",
          },
          "-=0.6"
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about-artist"
      className="relative pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24 bg-[#F7F4EC] border-b border-[#464137]/10 overflow-hidden"
    >
      <div className="relative mx-auto max-w-6xl px-6 sm:px-8">
        {/* Header Block: Eyebrow, Heading, Role & Divider */}
        <div>
          {/* Eyebrow */}
          <p
            ref={eyebrowRef}
            className="text-[0.72rem] sm:text-xs font-semibold uppercase tracking-[0.24em] text-[#68705A]"
          >
            {aboutArtist.eyebrow}
          </p>

          {/* Large Serif Heading */}
          <h2
            ref={headingRef}
            className="no-gsap mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.75rem] leading-[1.18]"
          >
            {aboutArtist.heading}
          </h2>

          {/* Role */}
          <p
            ref={roleRef}
            className="mt-2.5 sm:mt-3 text-xs sm:text-[0.82rem] font-semibold tracking-[0.16em] uppercase text-[#68705A]"
          >
            {aboutArtist.role}
          </p>

          {/* Refined Horizontal Divider */}
          <div
            ref={dividerRef}
            className="mt-4 h-0.5 w-16 bg-[#68705A]/40"
          />
        </div>

        {/* Introductory Biography in controlled, comfortable text width */}
        <div className="mt-8 space-y-4.5 max-w-3xl">
          <p
            ref={introRef}
            className="text-base sm:text-lg lg:text-[1.08rem] leading-relaxed text-[#292923] font-normal"
          >
            {aboutArtist.introduction}
          </p>

          <div ref={bioRef} className="space-y-4">
            {aboutArtist.bio.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-sm sm:text-base leading-relaxed text-[#5A564D]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Below Biography: Two Understated Editorial Content Columns */}
        <div
          ref={credentialsRef}
          className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-[#464137]/10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 no-gsap items-start">
            {/* Column 1: Education & Professional Qualifications */}
            <div className="lg:col-span-5">
              <h3 className="text-xs sm:text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-[#68705A] mb-4 sm:mb-5">
                Education & Professional Qualifications
              </h3>

              <div
                ref={eduBlocksRef}
                className="space-y-2.5 sm:space-y-3 no-gsap"
              >
                {aboutArtist.qualifications.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#464137]/10 bg-[#FDFCF9] px-4.5 py-3.5 sm:px-5 sm:py-3.5 transition-colors duration-300 hover:border-[#68705A]/30 flex items-center justify-between"
                  >
                    <span className="text-sm sm:text-[0.93rem] font-medium text-[#292923] tracking-wide">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Areas of Expertise */}
            <div className="lg:col-span-7">
              <h3 className="text-xs sm:text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-[#68705A] mb-4 sm:mb-5">
                Areas of Expertise
              </h3>

              <div
                ref={expertiseBlocksRef}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 no-gsap"
              >
                {aboutArtist.expertise.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#464137]/10 bg-[#FDFCF9] px-4 py-3 sm:px-4.5 sm:py-3.5 transition-colors duration-300 hover:border-[#68705A]/30 flex items-center gap-2.5"
                  >
                    <span className="size-1.5 rounded-full bg-[#68705A]/60 shrink-0" />
                    <span className="text-sm sm:text-[0.91rem] text-[#292923] font-medium leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
