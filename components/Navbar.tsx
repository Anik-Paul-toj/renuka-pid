"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MasterclassData } from "@/data/content";
import { useLandingContent } from "@/components/LandingContentProvider";

interface NavbarProps {
  onOpenModal?: () => void;
  content?: MasterclassData["brand"];
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenModal, content }) => {
  const { brand: contextBrand } = useLandingContent();
  const brand = content || contextBrand;
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isCourse = pathname?.startsWith("/course");

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "border-b border-[#464137]/10 bg-[#F7F4EC]/92 backdrop-blur-md shadow-xs"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl xl:max-w-[1400px] items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Brand Logo - Navigates directly to Home (/) */}
        <Link href="/" className="flex flex-col group">
          <span className="font-serif text-2xl tracking-tight text-[#14120E] font-bold">
            {brand.name}
          </span>
          <span className="text-[0.68rem] tracking-[0.22em] text-[#3E3A32] uppercase font-bold">
            {brand.studioName}
          </span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wider text-[#3E3A32] uppercase">
          <Link
            href="/"
            className={`transition-colors pb-0.5 ${
              isHome
                ? "text-[#14120E] font-bold border-b-2 border-[#444C38]"
                : "hover:text-[#14120E]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/#about"
            className="hover:text-[#14120E] transition-colors"
          >
            About
          </Link>
          <Link
            href="/course"
            className={`transition-colors pb-0.5 ${
              isCourse
                ? "text-[#14120E] font-bold border-b-2 border-[#444C38]"
                : "hover:text-[#14120E]"
            }`}
          >
            Courses
          </Link>
          <Link
            href="/#gallery"
            className="hover:text-[#14120E] transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/#testimonials"
            className="hover:text-[#14120E] transition-colors"
          >
            Testimonials
          </Link>
          <Link
            href="/#contact"
            className="hover:text-[#14120E] transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* CTA Button */}
        <div>
          {onOpenModal ? (
            <button
              onClick={onOpenModal}
              className="btn-studio px-5 py-2.5 shadow-none"
            >
              <span>Let&apos;s Create</span>
              <ArrowRight className="size-3.5" />
            </button>
          ) : (
            <Link
              href="/course"
              className="btn-studio px-5 py-2.5 shadow-none inline-flex items-center gap-1.5"
            >
              <span>Let&apos;s Create</span>
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
