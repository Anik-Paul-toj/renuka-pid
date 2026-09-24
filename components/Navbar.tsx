"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { MasterclassData } from "@/data/content";
import { useLandingContent } from "@/components/LandingContentProvider";

interface NavbarProps {
  onOpenModal: () => void;
  content?: MasterclassData["brand"];
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenModal, content }) => {
  const { brand: contextBrand } = useLandingContent();
  const brand = content || contextBrand;

  return (
    <header className="sticky top-0 z-40 border-b border-[#464137]/10 bg-[#F7F4EC]/95 backdrop-blur-sm transition-all">
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-6">
        {/* Brand Logo */}
        <a href="#" className="flex flex-col group">
          <span className="font-serif text-2xl tracking-tight text-[#292923] font-semibold">
            {brand.name}
          </span>
          <span className="text-[0.68rem] tracking-[0.22em] text-[#6F6B61] uppercase font-medium">
            {brand.studioName}
          </span>
        </a>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium tracking-wider text-[#6F6B61] uppercase">
          <a href="#" className="text-[#292923] border-b border-[#68705A] pb-0.5">
            Home
          </a>
          <a href="#about" className="hover:text-[#292923] transition-colors">
            About
          </a>
          <a href="#courses" className="hover:text-[#292923] transition-colors">
            Courses
          </a>
          <a href="#testimonials" className="hover:text-[#292923] transition-colors">
            Testimonials
          </a>
          <a href="#contact" className="hover:text-[#292923] transition-colors">
            Contact
          </a>
        </nav>

        {/* CTA Button */}
        <div>
          <button
            onClick={onOpenModal}
            className="btn-studio px-5 py-2.5 shadow-none"
          >
            <span>Let&apos;s Create</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
