"use client";

import React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.004 0C5.372 0 .004 5.372.004 12c0 2.115.549 4.16 1.597 5.968L.004 24l6.196-1.626A11.936 11.936 0 0012.004 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm.001 22.023h-.003a9.99 9.99 0 01-5.1-1.397l-.366-.217-3.79 .994 1.012-3.695-.239-.379a9.997 9.997 0 01-1.53-5.329c0-5.524 4.495-10.019 10.021-10.019 2.678 0 5.195 1.043 7.087 2.937a10.003 10.003 0 012.934 7.082c0 5.524-4.495 10.02-10.022 10.02zm5.485-7.502c-.301-.151-1.78-.879-2.056-.98-.276-.1-.476-.15-.677.151-.2.302-.778.98-.954 1.181-.176.201-.351.226-.652.076-.301-.151-1.272-.469-2.423-1.496-.895-.799-1.5-1.786-1.676-2.087-.176-.302-.019-.465.132-.615.136-.135.301-.352.452-.527.151-.176.201-.302.301-.503.101-.201.05-.377-.025-.527-.075-.151-.678-1.634-.928-2.237-.245-.587-.494-.507-.678-.517-.176-.008-.377-.01-.577-.01-.201 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.512 0 1.482 1.079 2.913 1.23 3.114.151.201 2.124 3.244 5.146 4.549.719.31 1.28.496 1.717.634.722.23 1.379.197 1.897.12.578-.086 1.78-.728 2.031-1.432.251-.703.251-1.306.176-1.432-.075-.125-.276-.201-.577-.352z" />
    </svg>
  );
}

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
