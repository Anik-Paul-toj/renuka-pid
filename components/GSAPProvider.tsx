"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const GSAPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Hero text fade-in and subtle slide up
      gsap.from("h1", {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: "power2.out",
      });

      // 2. Headings scroll-triggered reveal
      gsap.utils.toArray<HTMLElement>("h2:not(.no-gsap)").forEach((heading) => {
        gsap.from(heading, {
          scrollTrigger: {
            trigger: heading,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          opacity: 0,
          y: 20,
          duration: 0.7,
          ease: "power2.out",
        });
      });

      // 3. Staggered cards reveal for grid sections (excluding countdown timer)
      gsap.utils.toArray<HTMLElement>(".grid:not(.no-gsap)").forEach((grid) => {
        const cards = grid.children;
        if (cards.length > 0) {
          gsap.from(cards, {
            scrollTrigger: {
              trigger: grid,
              start: "top 85%",
              toggleActions: "play none none none",
            },
            opacity: 0,
            y: 20,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
          });
        }
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
};
