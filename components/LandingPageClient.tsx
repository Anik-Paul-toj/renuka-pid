"use client";

import React, { useState } from "react";
import { MasterclassData } from "@/data/content";
import { LandingContentProvider } from "@/components/LandingContentProvider";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { InstructorIntro } from "@/components/InstructorIntro";
import { AudienceSection } from "@/components/AudienceSection";
import { VideoSection } from "@/components/VideoSection";
import { Transformation } from "@/components/Transformation";
import { MethodSection } from "@/components/MethodSection";
import { CoreConcepts } from "@/components/CoreConcepts";
import { Outcomes } from "@/components/Outcomes";
import { InstructorStory } from "@/components/InstructorStory";
import { Bonuses } from "@/components/Bonuses";
import { FitCheck } from "@/components/FitCheck";
import { IncludedSection } from "@/components/IncludedSection";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { RegistrationModal } from "@/components/RegistrationModal";
import { GSAPProvider } from "@/components/GSAPProvider";

export function LandingPageClient({
  content,
}: {
  content: MasterclassData;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <LandingContentProvider content={content}>
      <GSAPProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/25 selection:text-primary">
          {/* Sticky Header Navigation */}
          <Navbar onOpenModal={handleOpenModal} />

          <main className="flex-1">
            {/* Section 01: Hero */}
            <Hero onOpenModal={handleOpenModal} />

            {/* Section 02: Trust & Instructor Introduction */}
            <InstructorIntro />

            {/* Section 03: Who This Is For */}
            <AudienceSection />

            {/* Section 04 & 05: Video Preview & Learning Outcomes */}
            <VideoSection onOpenModal={handleOpenModal} />

            {/* Section 06: Transformation (Old Way vs New Way) */}
            <Transformation />

            {/* Section 07: Framework & Methodology (Observe, Simplify, Express) */}
            <MethodSection />

            {/* Section 08: Core Concepts (The Three Secrets) */}
            <CoreConcepts onOpenModal={handleOpenModal} />

            {/* Section 09: Tangible Outcomes */}
            <Outcomes />

            {/* Section 10: Instructor Story & Philosophy */}
            <InstructorStory />

            {/* Section 11: Live Attendee Bonuses */}
            <Bonuses />

            {/* Section 12: Right Fit Qualification Check */}
            <FitCheck />

            {/* Section 13: Everything Included & Pricing Summary */}
            <IncludedSection onOpenModal={handleOpenModal} />

            {/* Section 14: Frequently Asked Questions */}
            <FAQ />

            {/* Section 15: Final Conversion Call to Action */}
            <FinalCTA onOpenModal={handleOpenModal} />
          </main>

          {/* Section 16: Footer */}
          <Footer />

          {/* Persistent Sticky Bottom Conversion Bar */}
          <StickyBottomBar onOpenModal={handleOpenModal} />

          {/* Interactive Registration Modal Drawer */}
          <RegistrationModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </div>
      </GSAPProvider>
    </LandingContentProvider>
  );
}
