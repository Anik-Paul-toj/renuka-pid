"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { MasterclassData } from "@/data/content";
import { useLandingContent } from "@/components/LandingContentProvider";

interface NavbarProps {
  onOpenModal?: () => void;
  content?: MasterclassData["brand"];
}

interface NavItem {
  label: string;
  href: string;
  key: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", key: "home" },
  { label: "About", href: "/#about", key: "about" },
  { label: "Courses", href: "/course", key: "courses" },
  { label: "Gallery", href: "/#gallery", key: "gallery" },
  { label: "Testimonials", href: "/#testimonials", key: "testimonials" },
  { label: "Contact", href: "/#contact", key: "contact" },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenModal, content }) => {
  const { brand: contextBrand } = useLandingContent();
  const brand = content || contextBrand;
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isCourse = pathname?.startsWith("/course");

  const [activeSection, setActiveSection] = useState<string>(() => {
    if (isCourse) return "courses";
    return "home";
  });

  // Track active section on scroll when on landing page
  useEffect(() => {
    if (!isHome) {
      if (isCourse) {
        setActiveSection("courses");
      }
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Check if user is scrolled to bottom
      if (windowHeight + scrollY >= docHeight - 120) {
        setActiveSection("contact");
        return;
      }

      // Check if user is at top
      if (scrollY < 180) {
        setActiveSection("home");
        return;
      }

      // Sections to check in bottom-to-top order
      const sections = [
        { id: "contact", key: "contact" },
        { id: "testimonials", key: "testimonials" },
        { id: "gallery", key: "gallery" },
        { id: "about", key: "about" },
      ];

      const HEADER_OFFSET = 140;

      let matched = false;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= HEADER_OFFSET) {
            setActiveSection(section.key);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        setActiveSection("home");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Also check initial hash
    if (typeof window !== "undefined" && window.location.hash) {
      const hashKey = window.location.hash.replace("#", "");
      if (NAV_ITEMS.some((item) => item.key === hashKey)) {
        setActiveSection(hashKey);
      }
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome, isCourse]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem
  ) => {
    setMobileMenuOpen(false);

    if (isHome && item.href.startsWith("/#")) {
      e.preventDefault();
      const id = item.href.replace("/#", "");
      const targetEl = document.getElementById(id);
      if (targetEl) {
        const topOffset = 70;
        const targetY = targetEl.getBoundingClientRect().top + window.scrollY - topOffset;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: "smooth",
        });
        setActiveSection(item.key);
        window.history.pushState(null, "", item.href);
      }
    } else if (isHome && item.href === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("home");
      window.history.pushState(null, "", "/");
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "border-b border-[#464137]/10 bg-[#F7F4EC]/95 backdrop-blur-md shadow-xs"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl xl:max-w-[1400px] items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Brand Logo - Navigates directly to Home (/) */}
        <Link
          href="/"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
              setActiveSection("home");
              window.history.pushState(null, "", "/");
            }
          }}
          className="flex flex-col group"
        >
          <span className="font-serif text-2xl tracking-tight text-[#14120E] font-bold">
            {brand.name}
          </span>
          <span className="text-[0.68rem] tracking-[0.22em] text-[#3E3A32] uppercase font-bold">
            {brand.studioName}
          </span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-xs tracking-wider uppercase">
          {NAV_ITEMS.map((item) => {
            const isActive = isCourse
              ? item.key === "courses"
              : activeSection === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`transition-all duration-200 pb-0.5 border-b-2 ${
                  isActive
                    ? "text-[#14120E] font-bold border-[#444C38]"
                    : "text-[#3E3A32] font-semibold border-transparent hover:text-[#14120E] hover:border-[#444C38]/30"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <div>
            {onOpenModal ? (
              <button
                onClick={onOpenModal}
                className="btn-studio px-4 sm:px-5 py-2 sm:py-2.5 shadow-none text-xs"
              >
                <span>Enroll Now</span>
                <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <Link
                href="/course"
                className="btn-studio px-4 sm:px-5 py-2 sm:py-2.5 shadow-none inline-flex items-center gap-1.5 text-xs"
              >
                <span>Enroll Now</span>
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex items-center justify-center size-9 rounded-lg border border-[#464137]/15 bg-[#FAF8F2] text-[#14120E] hover:bg-[#EBE7DC] transition-colors"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#464137]/15 bg-[#F7F4EC]/98 backdrop-blur-md px-6 py-4 shadow-md transition-all">
          <nav className="flex flex-col space-y-3 text-xs tracking-wider uppercase font-semibold">
            {NAV_ITEMS.map((item) => {
              const isActive = isCourse
                ? item.key === "courses"
                : activeSection === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`py-1.5 transition-colors border-b-2 inline-block w-fit ${
                    isActive
                      ? "text-[#14120E] font-bold border-[#444C38]"
                      : "text-[#3E3A32] border-transparent hover:text-[#14120E]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
