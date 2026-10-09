"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

const faqBoxTextures = [
  "/images/forBox/a17d991fa73a904f38f6fe7dd2c8da24.jpg.jpeg",
  "/images/forBox/aba3a3b6536ec35ee7bf460df3f8593c.jpg.jpeg",
  "/images/forBox/b765741cbefcab043925bc35973f3c45.jpg.jpeg",
  "/images/forBox/da347cc2855190acf6ba136578c7e31e.jpg.jpeg",
  "/images/forBox/e19752bad2007ef6f8a72ec074cbafec.jpg.jpeg",
  "/images/forBox/e9bd27865085ef28358146d25a76b74d.jpg.jpeg",
  "/images/forBox/49a18e49a484c5138a3faf7db0388c60.jpg.jpeg",
  "/images/forBox/4fedb8a8c5e7b12b013d7ebda7f5ad23.jpg.jpeg",
  "/images/forBox/3f3cf5f03a81fdc837ba23ea44e7199e.jpg.jpeg",
  "/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg",
];

export const FAQ: React.FC = () => {
  const { faqs } = useLandingContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="relative overflow-hidden py-8 sm:py-12 bg-[#F7F4EC]">
      {/* Unique Watercolor Background Artwork */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_10_43 PM.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-22 mix-blend-multiply select-none"
          priority
        />
        {/* Soft Blending Masks */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F4EC] via-transparent to-[#F7F4EC]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#F7F4EC] via-[#F7F4EC]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4EC]/60 via-transparent to-[#F7F4EC]/60" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header - Compact */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.68rem] sm:text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#444C38]">
            QUESTIONS & ANSWERS
          </p>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl lg:text-[2.2rem] font-bold tracking-tight text-[#14120E]">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto mt-2 h-0.5 w-12 bg-[#444C38]/50" />
        </div>

        {/* 2-Column Accordion Grid in 1 Scroll */}
        <div className="no-gsap mx-auto mt-6 max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const contentId = `faq-answer-${index}`;
            const headerId = `faq-question-${index}`;

            return (
              <div
                key={index}
                className={`no-gsap group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                  isOpen
                    ? "border-[#444C38]/55 bg-[#FAF8F2] shadow-sm"
                    : "border-[#444C38]/30 bg-[#FAF8F2] hover:border-[#444C38]/50 shadow-2xs"
                }`}
              >
                {/* Texture from forBox */}
                <div className="pointer-events-none absolute inset-0 z-0">
                  <Image
                    src={faqBoxTextures[index % faqBoxTextures.length]}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover object-center opacity-20 mix-blend-multiply group-hover:opacity-30 transition-opacity duration-300 select-none"
                  />
                  <div className="absolute inset-1 rounded-lg border border-[#444C38]/15 pointer-events-none" />
                </div>

                <div className="relative z-10 p-3 sm:p-3.5">
                  <h3>
                    <button
                      id={headerId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={contentId}
                      onClick={() => toggleFAQ(index)}
                      className="flex w-full items-center justify-between text-left font-serif text-[0.84rem] sm:text-[0.92rem] font-bold text-[#14120E] group-hover:text-[#444C38] cursor-pointer transition-colors"
                    >
                      <span className="pr-3 leading-snug font-bold">{faq.question}</span>
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-full bg-[#FAF8F2] border border-[#444C38]/25 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-[#444C38] border-[#444C38]/50" : "text-[#3E3A32]"
                        }`}
                      >
                        <ChevronDown className="size-3.5" />
                      </span>
                    </button>
                  </h3>

                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={headerId}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-72 opacity-100 pt-2 pb-0.5" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-xs sm:text-[0.84rem] leading-relaxed text-[#2C2A24] font-medium border-t border-[#444C38]/20 pt-2.5">
                      {faq.answer}
                    </p>
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
