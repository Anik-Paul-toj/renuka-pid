"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

export const FAQ: React.FC = () => {
  const { faqs } = useLandingContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="py-16 sm:py-24 bg-[#F7F4EC] border-b border-[#464137]/10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#68705A]">
            QUESTIONS & ANSWERS
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#292923] sm:text-4xl lg:text-[2.6rem]">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto mt-4 h-0.5 w-14 bg-[#68705A]/40" />
        </div>

        {/* Accordion Container */}
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-[#464137]/10">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const contentId = `faq-answer-${index}`;
            const headerId = `faq-question-${index}`;

            return (
              <div key={index} className="py-2">
                <h3>
                  <button
                    id={headerId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    onClick={() => toggleFAQ(index)}
                    className="flex w-full items-center justify-between py-4 text-left font-serif text-base sm:text-lg font-medium text-[#292923] transition-colors hover:text-[#68705A] cursor-pointer group"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full bg-[#FAF8F2] border border-[#464137]/10 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-[#68705A]" : "text-[#6F6B61]"
                      }`}
                    >
                      <ChevronDown className="size-4" />
                    </span>
                  </button>
                </h3>

                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={headerId}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100 pb-5 pt-1" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
