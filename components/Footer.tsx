"use client";

import React from "react";
import Link from "next/link";
import { useLandingContent } from "@/components/LandingContentProvider";

export const Footer: React.FC = () => {
  const { brand, footer } = useLandingContent();

  const instagramUrl =
    footer?.socialLinks?.instagram ||
    "https://www.instagram.com/renuka_art_educator?obrf=aHE1aXliMWhwbWZ4&utm_source=qr";
  const facebookUrl =
    footer?.socialLinks?.facebook ||
    "https://www.facebook.com/share/1ccDJzNQHj/?mibextid=wwXIfr";
  const youtubeUrl = footer?.socialLinks?.youtube;
  const linkedinUrl = footer?.socialLinks?.linkedin;

  return (
    <footer id="contact" className="border-t border-[#464137]/10 bg-[#F7F4EC] py-14 pb-28 sm:pb-32">
      <div className="mx-auto max-w-6xl space-y-8 px-6">
        {/* Top Row: Brand & Nav Links */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#464137]/15">
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#14120E]">
              {brand.name}
            </span>
            <span className="text-[0.68rem] tracking-[0.24em] uppercase text-[#3E3A32] font-bold mt-0.5">
              {brand.studioName}
            </span>
            <span className="text-[0.65rem] tracking-[0.18em] uppercase text-[#444C38] font-bold mt-1">
              {brand.tagline}
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-wider text-[#3E3A32] font-semibold">
            {footer.links.map((link, idx) => {
              const l = link.label.toLowerCase();
              let href = link.href;
              if (l === "home") href = "/";
              else if (l === "courses") href = "/course";
              else if (href.startsWith("#")) href = `/${href}`;

              return (
                <Link
                  key={idx}
                  href={href}
                  className="hover:text-[#14120E] transition-colors"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Middle Row: Descriptor & Socials */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#2C2A24]">
          <p className="max-w-xl text-xs sm:text-[0.82rem] font-medium leading-relaxed">
            {footer.brandDescription}
          </p>

          {/* Social Links (Verified Handles) */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[#444C38]">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#444C38]/20 bg-[#FAF8F2] px-3 py-1.5 text-xs font-semibold text-[#444C38] transition-all duration-200 hover:border-[#444C38]/50 hover:bg-[#EBE7DC] hover:text-[#14120E] hover:shadow-2xs group"
              aria-label="Follow Renuka on Instagram @renuka_art_educator"
              title="Instagram: @renuka_art_educator"
            >
              <svg className="size-3.5 fill-none stroke-current stroke-[1.8] transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span className="text-[0.72rem] tracking-wide">@renuka_art_educator</span>
            </a>

            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#444C38]/20 bg-[#FAF8F2] px-3 py-1.5 text-xs font-semibold text-[#444C38] transition-all duration-200 hover:border-[#444C38]/50 hover:bg-[#EBE7DC] hover:text-[#14120E] hover:shadow-2xs group"
              aria-label="Connect with Renuka on Facebook"
              title="Facebook: Renuka Art Studio"
            >
              <svg className="size-3.5 fill-none stroke-current stroke-[1.8] transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              <span className="text-[0.72rem] tracking-wide">Facebook</span>
            </a>

            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#444C38]/20 bg-[#FAF8F2] px-3 py-1.5 text-xs font-semibold text-[#444C38] transition-all duration-200 hover:border-[#444C38]/50 hover:bg-[#EBE7DC] hover:text-[#14120E] hover:shadow-2xs group"
                aria-label="YouTube"
              >
                <svg className="size-3.5 fill-none stroke-current stroke-[1.8] transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <path d="m10 15 5-3-5-3z" />
                </svg>
                <span className="text-[0.72rem] tracking-wide">YouTube</span>
              </a>
            )}

            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#444C38]/20 bg-[#FAF8F2] px-3 py-1.5 text-xs font-semibold text-[#444C38] transition-all duration-200 hover:border-[#444C38]/50 hover:bg-[#EBE7DC] hover:text-[#14120E] hover:shadow-2xs group"
                aria-label="LinkedIn"
              >
                <svg className="size-3.5 fill-none stroke-current stroke-[1.8] transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                <span className="text-[0.72rem] tracking-wide">LinkedIn</span>
              </a>
            )}
          </div>
        </div>

        {/* Bottom Row: Copyright & Handwritten Signoff */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-[#464137]/15 text-xs text-[#3E3A32]">
          <p className="font-medium">© {footer.copyrightYear} {brand.name}. All rights reserved.</p>

          <p className="font-script text-2xl text-[#444C38] select-none font-bold">
            {footer.handwrittenSignature}
          </p>
        </div>
      </div>
    </footer>
  );
};
