"use client";

import React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export const Footer: React.FC = () => {
  const { brand, footer } = useLandingContent();
  const contactEmail =
    footer.contactEmail && !footer.contactEmail.includes("hello@renukaartstudio.com") && !footer.contactEmail.includes("contact@renukaartstudio.com")
      ? footer.contactEmail
      : "renuka.art.studio25@gmail.com";
  const contactPhone =
    footer.contactPhone && !footer.contactPhone.includes("98765")
      ? footer.contactPhone
      : "+91 95991 09200";

  const rawDigits = contactPhone.replace(/\D/g, "");
  const intlNumber =
    rawDigits.length === 10
      ? `91${rawDigits}`
      : rawDigits.startsWith("91") && rawDigits.length === 12
      ? rawDigits
      : `91${rawDigits.slice(-10)}`;
  const whatsappUrl = `https://wa.me/${intlNumber}`;

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
              else if (l.includes("terms")) href = "/terms-and-conditions";
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
            {!footer.links.some((l) => l.label.toLowerCase().includes("terms")) && (
              <Link
                href="/terms-and-conditions"
                className="hover:text-[#14120E] transition-colors"
              >
                Terms &amp; Conditions
              </Link>
            )}
          </nav>
        </div>

        {/* Middle Row: Descriptor & Direct Contact */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="text-xs text-[#2C2A24] max-w-xl">
            <p className="text-xs sm:text-[0.82rem] font-medium leading-relaxed">
              {footer.brandDescription}
            </p>
          </div>

          {/* Studio Contact Channels */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold">
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-[#464137]/15 text-[#14120E] hover:border-[#444C38]/40 hover:bg-white transition-all shadow-2xs group"
              title="Email Renuka Art Studio"
            >
              <Mail className="size-3.5 text-[#444C38] group-hover:scale-110 transition-transform" />
              <span>{contactEmail}</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-[#464137]/15 text-[#14120E] hover:border-[#444C38]/40 hover:bg-white transition-all shadow-2xs group"
              title="Chat on WhatsApp with Renuka Art Studio"
              aria-label={`Chat on WhatsApp with Renuka Art Studio at +91 ${contactPhone.replace(/\D/g, "").slice(-10)}`}
            >
              <WhatsAppIcon className="size-3.5 text-[#444C38] group-hover:scale-110 transition-transform shrink-0" />
              <span>+91 {contactPhone.replace(/\D/g, "").slice(-10)}</span>
            </a>
          </div>
        </div>

        {/* Bottom Row: Copyright, Terms & Handwritten Signoff */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-[#464137]/15 text-xs text-[#3E3A32]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-medium">© {footer.copyrightYear} {brand.name}. All rights reserved.</p>
            <span className="text-[#464137]/30 hidden sm:inline">•</span>
            <Link
              href="/terms-and-conditions"
              className="hover:text-[#14120E] underline underline-offset-2 transition-colors font-medium"
            >
              Terms &amp; Conditions
            </Link>
          </div>

          <p className="font-script text-2xl text-[#444C38] select-none font-bold">
            {footer.handwrittenSignature}
          </p>
        </div>
      </div>
    </footer>
  );
};
