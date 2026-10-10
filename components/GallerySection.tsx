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
} from "lucide-react";
import { GalleryItem } from "@/lib/gallery/service";

interface GallerySectionProps {
  initialImages?: GalleryItem[];
}

export function GallerySection({ initialImages = [] }: GallerySectionProps) {
  const [images] = useState<GalleryItem[]>(initialImages);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

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

  return (
    <section id="gallery" className="py-20 sm:py-28 bg-[#FAF8F2] relative overflow-hidden border-t border-[#464137]/10">
      {/* Subtle Watercolor Ambient Glow */}
      <div className="absolute top-1/4 right-0 size-96 rounded-full bg-[#C8D1C7]/20 blur-3xl pointer-events-none -mr-48" />
      <div className="absolute bottom-10 left-0 size-80 rounded-full bg-[#D4A373]/15 blur-3xl pointer-events-none -ml-40" />

      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#555C48] border border-[#68705A]/15 shadow-2xs">
            <Palette className="size-3 text-[#68705A]" />
            <span>Studio Artwork Showcase</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1F1D19]">
            The Watercolour Gallery
          </h2>

          <p className="text-sm sm:text-base text-[#6F6B61] leading-relaxed">
            A curated exhibition of botanical studies, loose landscapes, and demonstration paintings created live in the Renuka Art Studio.
          </p>
        </div>

        {/* Gallery Grid */}
        {images.length === 0 ? (
          /* Empty State */
          <div className="p-12 sm:p-16 rounded-3xl bg-[#F7F4EC] border border-dashed border-[#464137]/20 text-center max-w-xl mx-auto space-y-4 shadow-xs">
            <div className="size-14 rounded-2xl bg-[#C8D1C7]/30 flex items-center justify-center mx-auto text-[#68705A]">
              <Sparkles className="size-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1F1D19]">
              Curating Fresh Studio Paintings
            </h3>
            <p className="text-xs sm:text-sm text-[#6F6B61] leading-relaxed">
              Original demonstration works and student project highlights from recent workshops are currently being prepared for exhibition. Check back shortly to explore our newest pieces.
            </p>
          </div>
        ) : (
          /* Active Responsive Artwork Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {images.map((item, index) => {
              const isFailed = failedImageIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(index)}
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

                        {/* Hover Overlay with Caption & Zoom Icon */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 space-y-1">
                            <span className="text-[0.65rem] tracking-[0.16em] uppercase font-bold text-[#D4A373]">
                              Original Piece
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

                  {/* Card Title Bar (Always visible on mobile/clean) */}
                  <div className="p-4 bg-[#FAF8F2] border-t border-[#464137]/08 flex items-center justify-between">
                    <div className="truncate">
                      <h4 className="font-serif text-sm font-bold text-[#1F1D19] truncate">
                        {item.title}
                      </h4>
                      <p className="text-[0.68rem] text-[#6F6B61] mt-0.5">
                        Renuka Art Studio Collection
                      </p>
                    </div>
                    <span className="shrink-0 size-7 rounded-full bg-[#F0EDE6] flex items-center justify-center text-[#68705A] group-hover:bg-[#68705A] group-hover:text-white transition-colors">
                      <Eye className="size-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
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
            className="absolute top-5 right-5 z-20 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
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
              className="absolute left-4 sm:left-8 z-20 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
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
              className="absolute right-4 sm:right-8 z-20 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
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
