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
  ShieldCheck,
  Heart,
  Palette,
  Users,
  Award,
  Video,
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
    <div className="min-h-screen bg-[#F7F4EC] text-[#14120E] flex flex-col justify-between selection:bg-[#444C38]/20">
      {/* Top Navbar */}
      <Navbar onOpenModal={() => setIsModalOpen(true)} />

      <main className="flex-1 pb-20 sm:pb-28">
        {/* Breadcrumb Navigation */}
        <div className="mx-auto max-w-6xl xl:max-w-7xl px-6 sm:px-8 pt-6 pb-2">
          <Link
            href="/course"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#68705A] hover:text-[#14120E] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>All Courses & Masterclasses</span>
          </Link>
        </div>

        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-4 pb-12 sm:pb-16 px-6 sm:px-8">
          <div className="mx-auto max-w-6xl xl:max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Course Headline & Details */}
              <div className="lg:col-span-7 flex flex-col space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EBE7DC] border border-[#444C38]/20 px-3.5 py-1 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#444C38] mb-3">
                    <Sparkles className="size-3" />
                    <span>
                      {isFoundation ? "Foundation Workshop" : "3-Month Intensive Program"}
                    </span>
                  </div>

                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#14120E] leading-tight">
                    {course.title}
                  </h1>

                  {/* Subtitle / Subjects */}
                  <p className="mt-2 text-xs sm:text-sm md:text-base font-semibold tracking-wide uppercase text-[#444C38]">
                    {details.subjects ||
                      (isFoundation
                        ? "Materials • Techniques • Colour Mixing • Wash"
                        : "Landscape • Floral • Still Life")}
                  </p>
                </div>

                {/* Duration / Sessions Highlight Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-[#FAF8F2] p-4 border border-[#464137]/15 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <div className="size-8 rounded-lg bg-[#EBE7DC] flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                        Sessions
                      </span>
                      <span className="font-bold text-xs sm:text-[0.82rem] text-[#14120E] mt-1 block">
                        {details.sessionCountText ||
                          (isFoundation ? "2 Live Interactive Sessions" : "24 Live Interactive Classes")}
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
                        {details.sessionDurationText ||
                          (isFoundation ? "90 Minutes Each" : "3 Months (90 Min Sessions)")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 col-span-2 sm:col-span-1">
                    <div className="size-8 rounded-lg bg-[#EBE7DC] flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
                      <Video className="size-4" />
                    </div>
                    <div>
                      <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                        Format
                      </span>
                      <span className="font-bold text-xs sm:text-[0.82rem] text-[#14120E] mt-1 block">
                        Live on Zoom + Q&A
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Description */}
                {details.fullDescription && (
                  <div className="text-xs sm:text-sm md:text-[0.95rem] text-[#2C2A24] font-medium leading-relaxed space-y-3 whitespace-pre-line">
                    <p>{details.fullDescription}</p>
                  </div>
                )}

                {/* Pricing & CTA Card */}
                <div className="rounded-xl bg-[#FAF8F2] p-5 sm:p-6 border border-[#444C38]/25 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    </div>

                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="btn-studio px-8 py-3.5 text-xs sm:text-sm tracking-wider font-bold shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{details.ctaText || (isFoundation ? "Enrol in Foundation Course" : "Enrol in Artistry Course")}</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>

                  {/* Batch availability note */}
                  <div className="pt-3 border-t border-[#464137]/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6F6B61]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#14120E]">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        {activeBatch
                          ? `${activeBatch.batchName} (${activeBatch.startDate})`
                          : "Enrollment Open for Upcoming Live Atelier"}
                      </span>
                    </div>
                    <span className="text-[0.72rem] text-[#444C38] font-bold">
                      {activeBatch?.seatsRemaining
                        ? `Only ${activeBatch.seatsRemaining} seats remaining`
                        : "Limited intimate cohort size"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Static Course Framed Image */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full aspect-[4/3.2] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-[#EBE7DC] border-2 border-[#464137]/20 shadow-[0_16px_40px_rgba(40,36,28,0.1)]">
                  <Image
                    src={course.imagePath}
                    alt={course.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 500px"
                    className="object-cover object-center select-none"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14120E]/40 via-transparent to-transparent pointer-events-none" />

                  {/* Fine Art Inner Border */}
                  <div className="absolute inset-1.5 rounded-xl border border-[#FAF8F2]/30 pointer-events-none" />
                </div>

                {/* Handcrafted Caption */}
                <div className="mt-3 text-center">
                  <span className="font-script text-xl text-[#444C38] font-bold block">
                    {isFoundation ? "Where every painting journey begins" : "Cultivate mastery in watercolour"}
                  </span>
                  <span className="text-[0.68rem] uppercase tracking-widest font-bold text-[#6F6B61] mt-0.5 block">
                    Renuka Art Studio Atelier • Mentorship by Renuka Aggarwal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: WHAT YOU'LL LEARN */}
        <section className="py-12 sm:py-16 bg-[#FAF8F2]/90 border-y border-[#464137]/15">
          <div className="mx-auto max-w-6xl xl:max-w-7xl px-6 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#444C38]">
                Syllabus & Core Outcomes
              </span>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#14120E]">
                {details.learningOutcomesHeading || "What You’ll Learn"}
              </h2>
              <div className="mt-3 h-0.5 w-14 bg-[#444C38]/40 mx-auto" />
              {details.learningOutcomesSubheading && (
                <p className="mt-3 text-xs sm:text-sm text-[#2C2A24] font-semibold">
                  {details.learningOutcomesSubheading}
                </p>
              )}
            </div>

            {/* List Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 max-w-5xl mx-auto">
              {details.learningOutcomes.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 rounded-xl bg-[#F7F4EC] p-4 border border-[#464137]/15 shadow-2xs hover:border-[#444C38]/40 transition-colors"
                >
                  <div className="size-6 rounded-md bg-[#444C38]/15 flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
                    <CheckCircle2 className="size-4" strokeWidth={2.2} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#14120E] leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: SCHEDULE (Crucial for 3-Month Course & Available for Foundation) */}
        {details.scheduleItems && details.scheduleItems.length > 0 && (
          <section className="py-12 sm:py-16 px-6 sm:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#444C38]">
                  Structure & Timeline
                </span>
                <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#14120E]">
                  {details.scheduleHeading || "Course Schedule & Breakdown"}
                </h2>
                <div className="mt-3 h-0.5 w-14 bg-[#444C38]/40 mx-auto" />
              </div>

              <div className="space-y-3.5">
                {details.scheduleItems.map((sched, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 rounded-xl bg-[#FAF8F2] p-4 sm:p-5 border border-[#464137]/15 shadow-2xs hover:border-[#444C38]/35 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-7 rounded-lg bg-[#EBE7DC] flex items-center justify-center text-xs font-bold text-[#444C38] shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#14120E]">
                        {sched.label}
                      </h3>
                    </div>
                    {sched.detail && (
                      <p className="text-xs sm:text-sm text-[#2C2A24] font-medium sm:text-right">
                        {sched.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {details.scheduleNote && (
                <div className="mt-6 rounded-lg bg-[#EBE7DC]/60 p-4 border border-[#444C38]/20 text-center">
                  <p className="text-xs sm:text-sm font-semibold text-[#444C38]">
                    ℹ️ {details.scheduleNote}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION: WHY THIS COURSE? */}
        <section className="py-12 sm:py-16 bg-[#F7F4EC] px-6 sm:px-8 border-t border-[#464137]/15">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#444C38]">
              Artistic Mentorship
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#14120E]">
              {details.whyHeading || "Why This Course?"}
            </h2>
            <div className="h-0.5 w-14 bg-[#444C38]/40 mx-auto" />

            {details.whyDescription && (
              <p className="text-xs sm:text-base leading-relaxed text-[#2C2A24] font-medium max-w-2xl mx-auto whitespace-pre-line">
                {details.whyDescription}
              </p>
            )}

            {details.whyCallout && (
              <div className="inline-block mt-4 rounded-xl bg-[#FAF8F2] px-6 py-4 border border-[#444C38]/30 shadow-xs">
                <p className="font-serif text-sm sm:text-base md:text-lg font-bold text-[#14120E] italic">
                  &ldquo;{details.whyCallout}&rdquo;
                </p>
              </div>
            )}

            <div className="pt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-studio px-10 py-4 text-xs sm:text-sm tracking-wider font-bold shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{details.ctaText || "Enrol Now"}</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Bottom Bar for Mobile Enrolment */}
      <div className="fixed inset-x-0 bottom-0 z-30 sm:hidden bg-[#FAF8F2]/95 backdrop-blur-md border-t border-[#464137]/20 p-3 px-4 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
            Fee
          </span>
          <span className="font-serif text-lg font-extrabold text-[#B93821] block">
            ₹{course.offerPrice.toLocaleString()}/-
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-studio px-5 py-2.5 text-xs font-bold tracking-wider inline-flex items-center gap-1.5"
        >
          <span>Enrol Now</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      <Footer />

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
