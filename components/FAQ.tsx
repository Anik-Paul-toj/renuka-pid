"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { masterclassData } from "@/data/content";

export const FAQ: React.FC = () => {
  const { faqs } = masterclassData;
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First open by default

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="py-16 sm:py-24 bg-surface/30 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-subheading">
            QUESTIONS
          </p>
          <h2 className="mt-2.5 font-display text-3xl font-semibold leading-tight tracking-tight text-primary sm:text-[2.6rem]">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto mt-5 h-0.5 w-16 bg-gradient-to-r from-icon/70 via-icon/30 to-transparent" />
        </div>

        {/* Accordion Container */}
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-border/50">
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
                    className="flex w-full items-center justify-between py-4 text-left font-display text-base sm:text-lg font-semibold text-primary transition-colors hover:text-cta cursor-pointer group"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full bg-surface transition-transform duration-300 group-hover:bg-border/30 ${
                        isOpen ? "rotate-180 text-cta" : "text-muted-foreground"
                      }`}
                    >
                      <ChevronDown className="size-4.5" />
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
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
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
