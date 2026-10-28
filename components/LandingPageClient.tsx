"use client";

import React, { useState, useEffect } from "react";
import { MasterclassData } from "@/data/content";
import { LandingContentProvider } from "@/components/LandingContentProvider";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { AudienceSection } from "@/components/AudienceSection";
import { VideoSection } from "@/components/VideoSection";
import { InstructorIntro } from "@/components/InstructorIntro";
import { GallerySection } from "@/components/GallerySection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { RegistrationModal } from "@/components/RegistrationModal";
import { GSAPProvider } from "@/components/GSAPProvider";
import { GalleryItem } from "@/lib/gallery/service";
import { VideoTestimonial } from "@/lib/testimonials/service";
import { isRegistrationDeadlineExpired } from "@/lib/batches-admin/format";

export function LandingPageClient({
  content,
  initialCourse,
  initialBatch,
  initialGalleryImages = [],
  initialTestimonials = [],
}: {
  content: MasterclassData;
  initialCourse?: {
    id?: string;
    title?: string;
    slug?: string;
    originalPrice: number;
    offerPrice: number;
    durationMinutes?: number;
  } | null;
  initialBatch?: any | null;
  initialGalleryImages?: GalleryItem[];
  initialTestimonials?: VideoTestimonial[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBatch, setActiveBatch] = useState<any | null>(initialBatch ?? null);
  const [isBatchLoading, setIsBatchLoading] = useState(initialBatch === undefined);

  // Keep batch and registration status up to date on client
  useEffect(() => {
    const slug = initialCourse?.slug || "the-watercolour";
    fetch(`/api/cohort-batches/active?courseSlug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) {
          // If 404 or non-ok, fail safely: no active batch means closed
          setActiveBatch(null);
          setIsBatchLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success && data?.batch) {
          setActiveBatch(data.batch);
        } else {
          setActiveBatch(null);
        }
        setIsBatchLoading(false);
      })
      .catch(() => {
        setIsBatchLoading(false);
      });
  }, [initialCourse?.slug]);

  // Authoritatively determine Roadmap registration eligibility:
  // If loading, missing, expired, sold out, or enrollment closed -> closed (fail-safe)
  const isRegistrationClosed = Boolean(
    isBatchLoading ||
      !activeBatch ||
      !activeBatch.isEnrollmentOpen ||
      activeBatch.isExpired ||
      activeBatch.isSoldOut ||
      isRegistrationDeadlineExpired(
        activeBatch.lastRegistrationDate || activeBatch.startDate,
        new Date(),
        {
          startDate: activeBatch.startDate,
          startTime: activeBatch.startTime,
        }
      )
  );

  const handleOpenModal = () => {
    // Fail safe: Never open modal or initiate booking if registration is closed
    if (isRegistrationClosed) return;
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <LandingContentProvider content={content}>
      <GSAPProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/25 selection:text-primary">
          {/* Sticky Header Navigation */}
          <Navbar
            onOpenModal={handleOpenModal}
            isRegistrationClosed={isRegistrationClosed}
          />

          <main className="flex-1">
            {/* Section 01: Hero & Stats */}
            <Hero
              onOpenModal={handleOpenModal}
              initialCourse={initialCourse}
              activeBatch={activeBatch}
              isRegistrationClosed={isRegistrationClosed}
            />

            {/* Section 02: Who This Is For (Target Audience) */}
            <AudienceSection />

            {/* Section 03: What You'll Learn in the Live Masterclass (Video Preview & Learning Outcomes) */}
            <VideoSection
              onOpenModal={handleOpenModal}
              isRegistrationClosed={isRegistrationClosed}
            />

            {/* Section 04: About the Artist — Renuka Aggarwal (Instructor Story & Credentials) */}
            <InstructorIntro />

            {/* Section 05: Curated Watercolour Gallery */}
            <GallerySection initialImages={initialGalleryImages} />

            {/* Section 06: Student Stories & Video Testimonials */}
            <TestimonialsSection initialTestimonials={initialTestimonials} />

            {/* Section 07: Frequently Asked Questions */}
            <FAQ />

            {/* Section 08: Final Conversion Call to Action */}
            <FinalCTA onOpenModal={handleOpenModal} />
          </main>

          {/* Section 08: Footer */}
          <Footer />

          {/* Persistent Sticky Bottom Conversion Bar */}
          <StickyBottomBar onOpenModal={handleOpenModal} />

          {/* Interactive Registration Modal Drawer */}
          <RegistrationModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            courseSlug={initialCourse?.slug || "the-watercolour"}
            courseTitle={initialCourse?.title}
            coursePrice={initialCourse?.offerPrice}
          />
        </div>
      </GSAPProvider>
    </LandingContentProvider>
  );
}
