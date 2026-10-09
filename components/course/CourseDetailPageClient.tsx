"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  Video,
  Award,
  Layers,
  HelpCircle,
} from "lucide-react";
import { AdminCourseData } from "@/lib/courses-admin/service";
import { RegistrationModal } from "@/components/RegistrationModal";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface CourseDetailPageClientProps {
  course: AdminCourseData;
  activeBatch: {
    id: string;
    batchName: string;
    startDate: string;
    startTime: string;
    endTime: string;
    totalSeats: number;
    seatsBooked: number;
    seatsRemaining: number;
    isSoldOut: boolean;
  } | null;
}

export function CourseDetailPageClient({
  course,
  activeBatch,
}: CourseDetailPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFoundation = course.slug === "watercolour-foundation";
  const details = course.details;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F4EC] text-[#14120E] flex flex-col justify-between selection:bg-[#444C38]/20">
      {/* Botanical Watercolor Background Art from Public Assets */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_08_15 PM.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover object-top opacity-28 mix-blend-multiply select-none"
        />
        {/* Soft Blending Masks */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F4EC]/40 via-transparent to-[#F7F4EC]/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4EC]/35 via-transparent to-[#F7F4EC]/35" />
      </div>

      {/* Delicate watercolor ambient washes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-[-5%] size-[36rem] rounded-full bg-[#C8D1C7]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-[-10%] size-[30rem] rounded-full bg-[#D9BDB2]/15 blur-3xl"
      />

      {/* Top Navbar */}
      <div className="relative z-10">
        <Navbar onOpenModal={() => setIsModalOpen(true)} />
      </div>

      <main className="relative z-10 flex-1 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mx-auto max-w-4xl mb-4 sm:mb-6">
          <Link
            href="/course"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#68705A] hover:text-[#14120E] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to All Courses</span>
          </Link>
        </div>

        {/* ONE SINGLE COMPREHENSIVE COURSE CARD */}
        <div className="mx-auto max-w-4xl rounded-2xl bg-[#FAF8F2] border border-[#464137]/20 shadow-[0_12px_45px_rgba(40,36,28,0.08)] overflow-hidden">
          {/* Card Top Banner / Course Image */}
          <div className="relative aspect-[16/8.5] sm:aspect-[16/7.5] w-full overflow-hidden bg-[#EBE7DC]">
            <Image
              src={course.imagePath}
              alt={course.title}
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-cover object-center select-none"
              priority
            />
            {/* Subtle Atelier Dark Gradient for Text Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#14120E]/85 via-[#14120E]/30 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="rounded-md bg-[#FAF8F2]/95 backdrop-blur-xs px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest text-[#444C38] border border-[#444C38]/20 shadow-xs">
                {isFoundation ? "Foundation Workshop" : "3-Month Intensive Program"}
              </span>
            </div>

            {/* Bottom Title on Image Banner */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-[#FAF8F2]">
              <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#FAF8F2]/90 block mb-1">
                {details.subjects || (isFoundation ? "Materials • Techniques • Colour Mixing • Wash" : "Landscape • Floral • Still Life")}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#FAF8F2] leading-tight">
                {course.title}
              </h1>
            </div>
          </div>

          {/* Card Body - All Course Details in One Single Unified Container */}
          <div className="p-6 sm:p-8 lg:p-10 space-y-8">
            {/* 1. Quick Info Spec Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-[#F7F4EC] p-4 border border-[#464137]/15">
              <div className="flex items-start gap-2.5">
                <div className="size-8 rounded-lg bg-[#EBE7DC] flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
                  <Clock className="size-4" />
                </div>
                <div>
                  <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                    Sessions
                  </span>
                  <span className="font-bold text-xs sm:text-[0.82rem] text-[#14120E] mt-1 block">
                    {details.sessionCountText || (isFoundation ? "2 Live Interactive Sessions" : "24 Live Interactive Classes")}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-8 rounded-lg bg-[#EBE7DC] flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                    Duration
                  </span>
                  <span className="font-bold text-xs sm:text-[0.82rem] text-[#14120E] mt-1 block">
                    {details.sessionDurationText || (isFoundation ? "90 Minutes Each" : "3 Months (90 Min Sessions)")}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 col-span-2 sm:col-span-1">
                <div className="size-8 rounded-lg bg-[#EBE7DC] flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
                  <Video className="size-4" />
                </div>
                <div>
                  <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                    Platform
                  </span>
                  <span className="font-bold text-xs sm:text-[0.82rem] text-[#14120E] mt-1 block">
                    Live Zoom Atelier
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Course Description */}
            {details.fullDescription && (
              <div className="space-y-2">
                <span className="text-[0.7rem] uppercase tracking-widest font-bold text-[#444C38] block">
                  Course Overview
                </span>
                <p className="text-xs sm:text-sm md:text-[0.95rem] text-[#2C2A24] font-medium leading-relaxed whitespace-pre-line">
                  {details.fullDescription}
                </p>
              </div>
            )}

            {/* 3. What You'll Learn (Curriculum Checklist) */}
            {details.learningOutcomes && details.learningOutcomes.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="border-b border-[#464137]/15 pb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[0.7rem] uppercase tracking-widest font-bold text-[#444C38] block">
                      Curriculum
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#14120E] mt-0.5">
                      {details.learningOutcomesHeading || "What You’ll Learn"}
                    </h2>
                  </div>
                  {details.learningOutcomesSubheading && (
                    <span className="hidden sm:inline-block text-xs font-semibold text-[#444C38] bg-[#EBE7DC] px-2.5 py-1 rounded-md">
                      {details.learningOutcomesSubheading}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {details.learningOutcomes.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-lg bg-[#F7F4EC] p-3 sm:p-3.5 border border-[#464137]/15"
                    >
                      <div className="size-5 rounded-md bg-[#444C38]/15 flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
                        <CheckCircle2 className="size-3.5" strokeWidth={2.4} />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-[#14120E] leading-snug">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Schedule Breakdown (if applicable) */}
            {details.scheduleItems && details.scheduleItems.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="border-b border-[#464137]/15 pb-2">
                  <span className="text-[0.7rem] uppercase tracking-widest font-bold text-[#444C38] block">
                    Class Structure
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#14120E] mt-0.5">
                    {details.scheduleHeading || "Schedule Breakdown"}
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {details.scheduleItems.map((sched, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 rounded-lg bg-[#F7F4EC] p-3.5 border border-[#464137]/15"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="size-6 rounded-md bg-[#EBE7DC] flex items-center justify-center text-xs font-bold text-[#444C38] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#14120E]">
                          {sched.label}
                        </span>
                      </div>
                      {sched.detail && (
                        <span className="text-xs sm:text-sm text-[#2C2A24] font-medium sm:text-right">
                          {sched.detail}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {details.scheduleNote && (
                  <p className="text-xs text-[#444C38] font-semibold bg-[#EBE7DC]/60 p-3 rounded-lg border border-[#444C38]/20">
                    ℹ️ {details.scheduleNote}
                  </p>
                )}
              </div>
            )}

            {/* 5. Why This Course Section */}
            {(details.whyDescription || details.whyCallout) && (
              <div className="space-y-3 pt-2">
                <div className="border-b border-[#464137]/15 pb-2">
                  <span className="text-[0.7rem] uppercase tracking-widest font-bold text-[#444C38] block">
                    Guidance
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#14120E] mt-0.5">
                    {details.whyHeading || "Why This Course?"}
                  </h2>
                </div>

                {details.whyDescription && (
                  <p className="text-xs sm:text-sm leading-relaxed text-[#2C2A24] font-medium whitespace-pre-line">
                    {details.whyDescription}
                  </p>
                )}

                {details.whyCallout && (
                  <div className="rounded-lg bg-[#F7F4EC] p-4 border border-[#444C38]/30">
                    <p className="font-serif text-sm sm:text-base font-bold text-[#14120E] italic text-center">
                      &ldquo;{details.whyCallout}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Pricing & Enrolment Section inside the Card */}
            <div className="pt-4 border-t border-[#464137]/20">
              <div className="rounded-xl bg-[#F7F4EC] p-5 sm:p-6 border border-[#444C38]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[0.68rem] uppercase tracking-widest font-bold text-[#6F6B61] block">
                    {details.cardPriceLabel || (isFoundation ? "Course Fee" : "Course Fee: ₹9,990/-")}
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-0.5">
                    <span className="font-serif text-3xl sm:text-4xl font-extrabold text-[#B93821] tracking-tight">
                      ₹{course.offerPrice.toLocaleString()}/-
                    </span>
                    {course.originalPrice > course.offerPrice && (
                      <span className="line-through text-sm font-semibold text-[#6F6B61]">
                        ₹{course.originalPrice.toLocaleString()}/-
                      </span>
                    )}
                    <span className="text-[0.68rem] uppercase tracking-wider font-bold text-[#444C38] bg-[#EBE7DC] px-2.5 py-0.5 rounded-sm">
                      Direct Atelier Access
                    </span>
                  </div>
                  {activeBatch && (
                    <span className="text-[0.72rem] text-[#444C38] font-bold block mt-1.5">
                      ✓ {activeBatch.batchName} ({activeBatch.startDate}) • {activeBatch.seatsRemaining ? `${activeBatch.seatsRemaining} seats left` : "Seats available"}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-studio px-8 py-4 text-xs sm:text-sm tracking-wider font-bold shadow-md inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>{details.ctaText || (isFoundation ? "Enrol in Foundation Course" : "Enrol in Artistry Course")}</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>

      {/* Registration & Razorpay Booking Modal */}
      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseSlug={course.slug}
        courseTitle={course.title}
        coursePrice={course.offerPrice}
        batchId={activeBatch?.id}
      />
    </div>
  );
}
