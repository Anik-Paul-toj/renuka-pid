"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Palette,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Brush,
  Camera,
} from "lucide-react";
import { GalleryItem, GalleryCategory } from "@/lib/gallery/service";

interface GallerySectionProps {
  initialImages?: GalleryItem[];
}

export function GallerySection({ initialImages = [] }: GallerySectionProps) {
  const [images] = useState<GalleryItem[]>(initialImages);
  const [activeTab, setActiveTab] = useState<"all" | GalleryCategory>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  // Partition images by category
  const artistImages = images.filter((img) => img.category === "artist_gallery");
  const studentsImages = images.filter((img) => img.category === "students_gallery");

  // Handle ESC key and arrow keys for Lightbox navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null ? (prev > 0 ? prev - 1 : images.length - 1) : null
        );
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null ? (prev < images.length - 1 ? prev + 1 : 0) : null
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, images.length]);

  const handleImageError = (id: string) => {
    setFailedImageIds((prev) => new Set(prev).add(id));
  };

  const currentLightboxImage =
    lightboxIndex !== null && images[lightboxIndex] ? images[lightboxIndex] : null;

  // Render individual artwork card
  const renderCard = (item: GalleryItem) => {
    const isFailed = failedImageIds.has(item.id);
    const globalIndex = images.findIndex((img) => img.id === item.id);

    return (
      <div
        key={item.id}
        onClick={() => setLightboxIndex(globalIndex >= 0 ? globalIndex : 0)}
        className="group relative rounded-2xl bg-[#F7F4EC] border border-[#464137]/12 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col"
      >
        {/* Artwork Image Container */}
        <div className="relative aspect-4/5 w-full bg-[#EEE9DE] overflow-hidden">
          {isFailed ? (
            /* Graceful Error Fallback */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#6F6B61] bg-[#F7F4EC] space-y-2">
              <Palette className="size-8 text-[#68705A]/40" />
              <span className="font-serif text-xs font-semibold text-[#292923]">
                {item.title}
              </span>
              <span className="text-[0.65rem] text-[#8C877C]">Studio Watercolour Work</span>
            </div>
          ) : (
            <>
              <Image
                src={item.thumbnailUrl || item.url}
                alt={item.altText || item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                onError={() => handleImageError(item.id)}
              />

              {/* Category Pill Tag */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[0.62rem] font-bold uppercase tracking-wider backdrop-blur-xs shadow-xs ${
                    item.category === "artist_gallery"
                      ? "bg-amber-900/80 text-amber-100 border border-amber-200/30"
                      : "bg-[#444C38]/85 text-[#F7F4EC] border border-white/20"
                  }`}
                >
                  {item.category === "artist_gallery" ? "Artist Gallery" : "Students Gallery"}
                </span>
              </div>

              {/* Hover Overlay with Caption & Zoom Icon */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 space-y-1">
                  <span className="text-[0.65rem] tracking-[0.16em] uppercase font-bold text-[#D4A373]">
                    {item.category === "artist_gallery" ? "Original Artist Artwork" : "Student Artwork"}
                  </span>
                  <h4 className="font-serif text-base font-bold text-white leading-snug drop-shadow-xs">
                    {item.title}
                  </h4>
                </div>

                <div className="absolute top-3 right-3 size-8 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white/90">
                  <Maximize2 className="size-3.5" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Card Title Bar */}
        <div className="p-4 bg-[#FAF8F2] border-t border-[#464137]/08 flex items-center justify-between">
          <div className="truncate">
            <h4 className="font-serif text-sm font-bold text-[#1F1D19] truncate">
              {item.title}
            </h4>
            <p className="text-[0.68rem] text-[#6F6B61] mt-0.5">
              {item.category === "artist_gallery"
                ? "Renuka Art Studio • Renuka Aggarwal"
                : "Renuka Art Studio • Student Work"}
            </p>
          </div>
          <span className="shrink-0 size-7 rounded-full bg-[#F0EDE6] flex items-center justify-center text-[#68705A] group-hover:bg-[#68705A] group-hover:text-white transition-colors">
            <Eye className="size-3.5" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <section
      id="gallery"
      className="relative overflow-hidden py-16 sm:py-24 lg:py-28 bg-[#F7F4EC]"
    >
      {/* Botanical Watercolor Background Art */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_08_32 PM.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-25 mix-blend-multiply select-none"
        />
        {/* Soft edge blending masks to match preceding video section and following FAQ */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#F7F4EC] via-[#F7F4EC]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F7F4EC] via-[#F7F4EC]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4EC]/60 via-transparent to-[#F7F4EC]/60" />
      </div>

      {/* Subtle Watercolor Ambient Glow */}
      <div className="absolute top-1/4 right-0 size-96 rounded-full bg-[#C8D1C7]/20 blur-3xl pointer-events-none -mr-48" />
      <div className="absolute bottom-10 left-0 size-80 rounded-full bg-[#D4A373]/15 blur-3xl pointer-events-none -ml-40" />

      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Main Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#555C48] border border-[#68705A]/15 shadow-2xs">
            <Palette className="size-3 text-[#68705A]" />
            <span>Studio Artwork Showcase</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1F1D19]">
            The Watercolour Gallery
          </h2>

          <p className="text-sm sm:text-base text-[#6F6B61] leading-relaxed">
            A curated exhibition of original studio artwork and student breakthroughs from Renuka Art Studio.
          </p>

          {/* Category Navigation Pills */}
          {images.length > 0 && (
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-[#68705A] text-white shadow-xs"
                    : "bg-white/80 border border-[#464137]/15 text-[#6F6B61] hover:text-[#292923] hover:bg-white"
                }`}
              >
                All ({images.length})
              </button>

              <button
                onClick={() => setActiveTab("artist_gallery")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "artist_gallery"
                    ? "bg-[#68705A] text-white shadow-xs"
                    : "bg-white/80 border border-[#464137]/15 text-[#6F6B61] hover:text-[#292923] hover:bg-white"
                }`}
              >
                <Palette className="size-3" />
                <span>Artist Gallery ({artistImages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("students_gallery")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "students_gallery"
                    ? "bg-[#68705A] text-white shadow-xs"
                    : "bg-white/80 border border-[#464137]/15 text-[#6F6B61] hover:text-[#292923] hover:bg-white"
                }`}
              >
                <Brush className="size-3" />
                <span>Students Gallery ({studentsImages.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Empty State */}
        {images.length === 0 ? (
          <div className="p-12 sm:p-16 rounded-3xl bg-[#F7F4EC] border border-dashed border-[#464137]/20 text-center max-w-xl mx-auto space-y-4 shadow-xs">
            <div className="size-14 rounded-2xl bg-[#C8D1C7]/30 flex items-center justify-center mx-auto text-[#68705A]">
              <Sparkles className="size-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1F1D19]">
              Curating Fresh Studio Paintings
            </h3>
            <p className="text-xs sm:text-sm text-[#6F6B61] leading-relaxed">
              Original demonstration works and student creations from recent workshops are currently being prepared for exhibition. Check back shortly to explore our newest pieces.
            </p>
          </div>
        ) : (
          <div className="space-y-16 sm:space-y-20">
            {/* SECTION 1: ARTIST GALLERY */}
            {(activeTab === "all" || activeTab === "artist_gallery") && (
              <div className="space-y-6">
                {/* Section 1 Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[#464137]/15">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#A66E38]">
                      <Palette className="size-3" />
                      <span>Section 01</span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1D19] mt-0.5">
                      Artist Gallery
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6F6B61] mt-1 max-w-2xl leading-relaxed">
                      Original watercolor paintings, botanical studies, and demonstration pieces created by Renuka Aggarwal.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#8C877C] shrink-0">
                    {artistImages.length} {artistImages.length === 1 ? "Artwork" : "Artworks"}
                  </span>
                </div>

                {/* Section 1 Grid */}
                {artistImages.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#FAF8F2]/70 border border-dashed border-[#464137]/15 text-center">
                    <p className="text-xs text-[#6F6B61]">
                      Artist paintings are being curated. Upload pieces via the Admin Media panel to display them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
                    {artistImages.map(renderCard)}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: STUDENTS GALLERY */}
            {(activeTab === "all" || activeTab === "students_gallery") && (
              <div className="space-y-6">
                {/* Section 2 Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[#464137]/15">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#68705A]">
                      <Brush className="size-3" />
                      <span>Section 02</span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1D19] mt-0.5">
                      Students Gallery
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6F6B61] mt-1 max-w-2xl leading-relaxed">
                      Original botanical studies, landscapes, and creative wash exercises painted by our students during live sessions.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#8C877C] shrink-0">
                    {studentsImages.length} {studentsImages.length === 1 ? "Artwork" : "Artworks"}
                  </span>
                </div>

                {/* Section 2 Grid */}
                {studentsImages.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#FAF8F2]/70 border border-dashed border-[#464137]/15 text-center">
                    <p className="text-xs text-[#6F6B61]">
                      Student paintings are being curated. Upload pieces via the Admin Media panel to display them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
                    {studentsImages.map(renderCard)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal (High-Resolution Artwork Preview) */}
      {currentLightboxImage && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 z-20 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Lightbox (ESC)"
          >
            <X className="size-5" />
          </button>

          {/* Previous Arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev !== null ? (prev > 0 ? prev - 1 : images.length - 1) : null
                );
              }}
              className="absolute left-4 sm:left-8 z-20 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Previous artwork"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          {/* Next Arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev !== null ? (prev < images.length - 1 ? prev + 1 : 0) : null
                );
              }}
              className="absolute right-4 sm:right-8 z-20 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Next artwork"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {/* Lightbox Content Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[92vh] w-full flex flex-col items-center"
          >
            <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={currentLightboxImage.optimizedUrl || currentLightboxImage.url}
                alt={currentLightboxImage.altText || currentLightboxImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
              />
            </div>

            {/* Lightbox Caption */}
            <div className="mt-4 text-center text-white space-y-1 px-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[0.62rem] font-bold uppercase tracking-wider bg-white/15 text-white/90">
                {currentLightboxImage.category === "artist_gallery"
                  ? "Artist Gallery"
                  : "Students Gallery"}
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold tracking-tight">
                {currentLightboxImage.title}
              </h3>
              <p className="text-xs text-white/70">
                Renuka Art Studio • Artwork {lightboxIndex! + 1} of {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
