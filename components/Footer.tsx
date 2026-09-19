"use client";

import React from "react";
import { masterclassData } from "@/data/content";

export const Footer: React.FC = () => {
  const { brand, footer } = masterclassData;

  return (
    <footer className="border-t border-border/60 bg-surface/40 py-12 pb-28 sm:pb-32">
      <div className="mx-auto max-w-6xl space-y-5 px-5 text-xs text-muted-foreground">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-icon/10 text-icon font-display font-bold text-sm">
            R
          </span>
          <span className="font-display text-sm font-bold tracking-wider text-primary">
            {brand.name}
          </span>
        </div>

        {/* Brand Narrative */}
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {footer.brandDescription}
        </p>

        {/* Links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-border/40">
          {footer.links.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              className="text-icon transition-colors hover:text-foreground hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className="pt-2">
          © {footer.copyrightYear} {brand.name}. All rights reserved.
        </p>

        {/* Legal Disclaimer */}
        <p className="max-w-3xl leading-relaxed text-[0.7rem] text-muted-foreground/80">
          {footer.disclaimer}
        </p>
      </div>
    </footer>
  );
};
