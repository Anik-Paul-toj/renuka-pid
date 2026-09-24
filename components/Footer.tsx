"use client";

import React from "react";
import { useLandingContent } from "@/components/LandingContentProvider";

export const Footer: React.FC = () => {
  const { brand, footer } = useLandingContent();

  return (
    <footer className="border-t border-[#464137]/10 bg-[#F7F4EC] py-14 pb-28 sm:pb-32">
      <div className="mx-auto max-w-6xl space-y-8 px-6">
        {/* Top Row: Brand & Nav Links */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#464137]/10">
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-semibold tracking-tight text-[#292923]">
              {brand.name}
            </span>
            <span className="text-[0.68rem] tracking-[0.24em] uppercase text-[#6F6B61] font-medium mt-0.5">
              {brand.studioName}
            </span>
            <span className="text-[0.65rem] tracking-[0.18em] uppercase text-[#68705A] mt-1">
              {brand.tagline}
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-wider text-[#6F6B61]">
            {footer.links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="hover:text-[#292923] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Middle Row: Descriptor & Socials */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#6F6B61]">
          <p className="max-w-xl text-xs leading-relaxed">
            {footer.brandDescription}
          </p>

          {/* Social Icons (Handcrafted minimal SVGs) */}
          <div className="flex items-center gap-4 text-[#6F6B61]">
            <a href="#" className="hover:text-[#68705A] transition-colors" aria-label="Instagram">
              <svg className="size-4 fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a href="#" className="hover:text-[#68705A] transition-colors" aria-label="YouTube">
              <svg className="size-4 fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                <path d="m10 15 5-3-5-3z" />
              </svg>
            </a>
            <a href="#" className="hover:text-[#68705A] transition-colors" aria-label="Facebook">
              <svg className="size-4 fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#" className="hover:text-[#68705A] transition-colors" aria-label="LinkedIn">
              <svg className="size-4 fill-none stroke-current stroke-[1.5]" viewBox="0 0 24 24">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom Row: Copyright & Handwritten Signoff */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-[#464137]/10 text-xs text-[#6F6B61]">
          <p>© {footer.copyrightYear} {brand.name}. All rights reserved.</p>

          <p className="font-script text-2xl text-[#68705A] select-none">
            {footer.handwrittenSignature}
          </p>
        </div>
      </div>
    </footer>
  );
};
