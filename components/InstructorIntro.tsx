"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { BookOpen, Users, GraduationCap, CheckCircle2 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLandingContent } from "@/components/LandingContentProvider";

const credentialBadges = [
  {
    icon: BookOpen,
    label: "15+ Years Experience",
    detail: "15+ years of dedicated teaching experience",
    boxImage: "/images/forBox/3f3cf5f03a81fdc837ba23ea44e7199e.jpg.jpeg",
  },
  {
    icon: Users,
    label: "5,000+ Students Taught",
    detail: "Across diverse age groups & artistic skill levels",
    boxImage: "/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg",
  },
  {
    icon: GraduationCap,
    label: "Qualified Art Educator",
    detail: "Trained at premier reputed art institutions",
    boxImage: "/images/forBox/052d678ca9d09b49c5a93e5d722998b7.jpg.jpeg",
  },
];

function formatBioParagraph(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|Meraki Institute of Fine Art)/gi);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#14120E]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.toLowerCase() === "meraki institute of fine art") {
      return (
        <strong key={i} className="font-semibold text-[#14120E]">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export const InstructorIntro: React.FC = () => {
  const { aboutArtist, instructorStory } = useLandingContent();

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

  // Content fallbacks to guarantee robust rendering
  const eyebrow = aboutArtist?.eyebrow || instructorStory?.overline || "ABOUT THE ARTIST";
  const heading = aboutArtist?.heading || (instructorStory ? `${instructorStory.headline} ${instructorStory.name}` : "Meet Renuka Aggarwal");
  const role = aboutArtist?.role || instructorStory?.subtitle || "Art Educator | Founder, Renuka Art Studio";
  const introduction = aboutArtist?.introduction || (instructorStory?.paragraphs?.[0] ?? "");
  const bio = (aboutArtist?.bio && aboutArtist.bio.length > 0)
    ? aboutArtist.bio
    : (instructorStory?.paragraphs || []);
  const qualifications = aboutArtist?.qualifications || [];
  const expertise = aboutArtist?.expertise || [];

  // Temporarily hide Education and Areas of Expertise sections per client request
  const SHOW_EDUCATION_AND_EXPERTISE = false;

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
            transformOrigin: "center center",
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
        );

      if (credentialsRef.current) {
        tl.from(
          credentialsRef.current,
          {
            opacity: 0,
            y: 16,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.4"
        );
      }

      if (eduBlocksRef.current && eduBlocksRef.current.children.length > 0) {
        tl.from(
          Array.from(eduBlocksRef.current.children),
          {
            opacity: 0,
            y: 12,
            duration: 0.7,
            stagger: 0.08,
            ease: "power2.out",
          },
          "-=0.5"
        );
      }

      if (expertiseBlocksRef.current && expertiseBlocksRef.current.children.length > 0) {
        tl.from(
          Array.from(expertiseBlocksRef.current.children),
          {
            opacity: 0,
            y: 12,
            duration: 0.7,
            stagger: 0.06,
            ease: "power2.out",
          },
          "-=0.6"
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-[#F7F4EC] border-b border-[#464137]/10 overflow-hidden"
    >
      {/* Unique Watercolor Background Artwork */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_09_39 PM.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-20 mix-blend-multiply select-none"
          priority
        />
        {/* Soft Blending Masks */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F4EC] via-transparent to-[#F7F4EC]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4EC]/75 via-transparent to-[#F7F4EC]/75" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
        {/* Header Block: Eyebrow, Heading, Role & Divider */}
        <div className="text-center">
          {eyebrow && (
            <p
              ref={eyebrowRef}
              className="text-[0.72rem] sm:text-xs font-semibold uppercase tracking-[0.24em] text-[#444C38]"
            >
              {eyebrow}
            </p>
          )}

          {/* Large Serif Heading */}
          <h2
            ref={headingRef}
            className="no-gsap mt-3 font-serif text-3xl font-medium tracking-tight text-[#14120E] sm:text-4xl lg:text-[2.75rem] leading-[1.18]"
          >
            {heading}
          </h2>

          {/* Role */}
          <p
            ref={roleRef}
            className="mt-2.5 sm:mt-3 text-xs sm:text-[0.82rem] font-bold tracking-[0.18em] uppercase text-[#444C38]"
          >
            {role}
          </p>

          {/* Centered Decorative Divider */}
          <div
            ref={dividerRef}
            className="mx-auto mt-4 mb-6 flex items-center justify-center gap-2"
          >
            <div className="h-px w-10 sm:w-16 bg-[#444C38]/30" />
            <span className="size-1.5 rounded-full bg-[#444C38]/60" />
            <div className="h-px w-10 sm:w-16 bg-[#444C38]/30" />
          </div>
        </div>

        {/* Introductory Lead & Bio Paragraphs in centered comfortable width */}
        <div className="mx-auto max-w-2xl sm:max-w-3xl space-y-4 text-center text-sm sm:text-base lg:text-[1.03rem] leading-relaxed text-[#2C2A24] font-medium">
          {introduction && (
            <p
              ref={introRef}
              className="text-base sm:text-lg lg:text-[1.08rem] leading-relaxed text-[#14120E] font-medium"
            >
              {formatBioParagraph(introduction)}
            </p>
          )}

          {/* Bio Paragraphs */}
          <div ref={bioRef} className="space-y-4">
            {bio.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-sm sm:text-base leading-relaxed text-[#2C2A24]"
              >
                {formatBioParagraph(paragraph)}
              </p>
            ))}
          </div>
        </div>

        {/* Credential Cards Highlight Badges */}
        <div className="no-gsap mx-auto mt-10 sm:mt-12 max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5 text-left">
          {credentialBadges.map((badge, idx) => (
            <div
              key={idx}
              className="no-gsap group relative overflow-hidden rounded-2xl border border-[#444C38]/30 bg-[#FAF8F2] p-4 sm:p-5 shadow-xs hover:border-[#444C38]/55 hover:shadow-sm transition-all duration-300"
            >
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src={badge.boxImage}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 280px"
                  className="object-cover object-center opacity-20 mix-blend-multiply group-hover:opacity-30 transition-opacity duration-300 select-none"
                />
                <div className="absolute inset-1 rounded-xl border border-[#444C38]/15 pointer-events-none" />
              </div>

              <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="mb-2.5 flex size-9 items-center justify-center rounded-xl bg-[#EBE7DC] border border-[#444C38]/25 text-[#353D2A]">
                  <badge.icon className="size-4.5 text-[#353D2A]" strokeWidth={1.75} />
                </div>
                <span className="text-sm sm:text-[0.92rem] font-bold text-[#14120E] leading-snug">
                  {badge.label}
                </span>
                <span className="mt-1 text-xs sm:text-[0.78rem] font-semibold text-[#38352E] leading-relaxed">
                  {badge.detail}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Credentials & Expertise Columns */}
        {SHOW_EDUCATION_AND_EXPERTISE && (qualifications.length > 0 || expertise.length > 0) && (
          <div
            ref={credentialsRef}
            className="mx-auto max-w-4xl mt-12 sm:mt-16 pt-10 sm:pt-12 border-t border-[#464137]/15"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 no-gsap items-start">
              {/* Column 1: Education & Professional Qualifications */}
              {qualifications.length > 0 && (
                <div className="lg:col-span-5">
                  <h3 className="text-xs sm:text-[0.78rem] font-bold uppercase tracking-[0.2em] text-[#444C38] mb-4 sm:mb-5">
                    Education &amp; Professional Qualifications
                  </h3>

                  <div
                    ref={eduBlocksRef}
                    className="space-y-2.5 sm:space-y-3 no-gsap"
                  >
                    {qualifications.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#464137]/15 bg-[#FAF8F2] px-4 py-3 sm:px-4.5 sm:py-3.5 transition-colors duration-300 hover:border-[#444C38]/40 flex items-center gap-3 shadow-2xs"
                      >
                        <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-[#14120E] tracking-wide">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Column 2: Areas of Expertise */}
              {expertise.length > 0 && (
                <div className={qualifications.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
                  <h3 className="text-xs sm:text-[0.78rem] font-bold uppercase tracking-[0.2em] text-[#444C38] mb-4 sm:mb-5">
                    Areas of Expertise
                  </h3>

                  <div
                    ref={expertiseBlocksRef}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 no-gsap"
                  >
                    {expertise.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#464137]/15 bg-[#FAF8F2] px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors duration-300 hover:border-[#444C38]/40 flex items-center gap-2.5 shadow-2xs"
                      >
                        <span className="size-1.5 rounded-full bg-[#444C38] shrink-0" />
                        <span className="text-xs sm:text-sm text-[#14120E] font-medium leading-snug">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
