"use client";

import React, { useState } from "react";
import { MasterclassData } from "@/data/content";
import { LandingContentProvider } from "@/components/LandingContentProvider";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { AudienceSection } from "@/components/AudienceSection";
import { VideoSection } from "@/components/VideoSection";
import { Outcomes } from "@/components/Outcomes";
import { InstructorStory } from "@/components/InstructorStory";
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
            {/* Section 01: Hero & Stats */}
            <Hero onOpenModal={handleOpenModal} />

            {/* Section 02: Who This Is For (Target Audience) */}
            <AudienceSection />

            {/* Section 03: Video Preview */}
            <VideoSection onOpenModal={handleOpenModal} />

            {/* Section 04: Tangible Learning Outcomes */}
            <Outcomes />

            {/* Section 05: Instructor Story & Philosophy */}
            <InstructorStory />

            {/* Section 06: Frequently Asked Questions */}
            <FAQ />

            {/* Section 07: Final Conversion Call to Action */}
            <FinalCTA onOpenModal={handleOpenModal} />
          </main>

          {/* Section 08: Footer */}
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
