"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Hourglass,
} from "lucide-react";
import { AdminCourseData } from "@/lib/courses-admin/service";
import { RegistrationModal } from "@/components/RegistrationModal";
import { PriceDisplay } from "@/components/ui/PriceDisplay";

interface CourseCatalogClientProps {
  courses: AdminCourseData[];
}

export function CourseCatalogClient({ courses }: CourseCatalogClientProps) {
  const [selectedCourseForModal, setSelectedCourseForModal] =
    useState<AdminCourseData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const masterclassCourse = courses.find(
    (c) => c.slug === "the-watercolour" || c.slug === "the-watercolour-roadmap"
  );
  const foundationCourse =
    courses.find((c) => c.slug === "watercolour-foundation") || courses[0];
  const artistryCourse =
    courses.find((c) => c.slug === "watercolour-artistry-foundation") ||
    courses[1];

  const handleOpenBooking = (course: AdminCourseData) => {
    setSelectedCourseForModal(course);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourseForModal(null);
  };

  const renderScheduleBadge = (course: AdminCourseData) => {
    const batch = course.activeBatch;
    if (!batch) {
      return (
        <div className="rounded-xl bg-[#FAF8F2]/90 p-3.5 border border-[#444C38]/20 text-xs text-[#6F6B61]">
          <span>Schedule details will be announced soon.</span>
        </div>
      );
    }

    const isSoldOut = Boolean(
      batch.isSoldOut ||
        (batch.seatsRemaining !== undefined && batch.seatsRemaining <= 0)
    );
    const isClosed = !batch.isEnrollmentOpen || batch.isExpired || isSoldOut;
    const statusLabel = isSoldOut
      ? "Batch Full / Sold Out"
      : isClosed
      ? "Registration Closed"
      : "Open for Registration";

    const isStartingSoonCourse =
      course.slug === "watercolour-foundation" ||
      course.slug === "watercolour-artistry-foundation";

    return (
      <div className="relative overflow-hidden rounded-xl bg-[#FAF8F2]/90 border border-[#444C38]/25 p-3.5 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-[#444C38]/15 pb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${
                isClosed ? "bg-[#6F6B61]" : "bg-[#444C38] animate-pulse"
              }`}
            />
            <span className="text-[0.66rem] uppercase tracking-wider font-bold text-[#444C38]">
              {batch.batchName || "Upcoming Live Cohort"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {batch.seatsRemaining !== undefined && batch.seatsRemaining > 0 && !isClosed && (
              <span className="hidden sm:inline-block text-[0.62rem] font-semibold text-[#6F6B61]">
                {batch.seatsRemaining} seats available
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-[0.64rem] font-bold uppercase tracking-wider ${
                isSoldOut
                  ? "bg-[#B93821]/15 text-[#B93821] border border-[#B93821]/30"
                  : isClosed
                  ? "bg-[#6F6B61]/15 text-[#6F6B61] border border-[#6F6B61]/25"
                  : "bg-[#3E522D]/15 text-[#3E522D] border border-[#3E522D]/30"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
          {/* Start Date */}
          <div className="flex items-start gap-2">
            <div className="size-7 rounded-md bg-[#444C38]/10 border border-[#444C38]/20 flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
              <Calendar className="size-3.5" />
            </div>
            <div>
              <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none mb-1">
                Batch Starts
              </span>
              <span
                className={`font-bold text-[0.78rem] block leading-tight ${
                  isStartingSoonCourse ? "text-[#3E522D] tracking-wide" : "text-[#14120E]"
                }`}
              >
                {isStartingSoonCourse
                  ? "STARTING SOON"
                  : batch.formattedStartDate || batch.startDate || "TBA"}
              </span>
            </div>
          </div>

          {/* Registration Deadline */}
          <div className="flex items-start gap-2">
            <div className="size-7 rounded-md bg-[#B93821]/10 border border-[#B93821]/20 flex items-center justify-center text-[#B93821] shrink-0 mt-0.5">
              <Hourglass className="size-3.5" />
            </div>
            <div>
              <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none mb-1">
                Last Date
              </span>
              <span
                className={`font-bold text-[0.78rem] block leading-tight ${
                  isClosed ? "text-[#6F6B61] line-through" : "text-[#B93821]"
                }`}
              >
                {isStartingSoonCourse
                  ? "To be announced"
                  : batch.formattedLastRegistrationDate ||
                    batch.lastRegistrationDate ||
                    batch.startDate ||
                    "TBA"}
              </span>
            </div>
          </div>

          {/* Batch Timing */}
          <div className="flex items-start gap-2">
            <div className="size-7 rounded-md bg-[#1E3A5F]/10 border border-[#1E3A5F]/20 flex items-center justify-center text-[#1E3A5F] shrink-0 mt-0.5">
              <Clock className="size-3.5" />
            </div>
            <div>
              <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none mb-1">
                Batch Timing
              </span>
              <span className="font-bold text-[#14120E] text-[0.78rem] block leading-tight">
                {batch.formattedTiming ||
                  (batch.startTime ? `${batch.startTime} IST` : "TBA")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-10 sm:gap-12">
        {/* ============================================================== */}
        {/* COURSE 1: THE WATERCOLOUR ROADMAP — ONE-DAY MASTERCLASS        */}
        {/* ============================================================== */}
        {masterclassCourse && (
          <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl bg-[#FAF8F2]/95 backdrop-blur-md border border-[#444C38]/30 shadow-[0_6px_28px_rgba(40,36,28,0.06)] hover:border-[#444C38]/50 hover:shadow-[0_12px_40px_rgba(40,36,28,0.1)] transition-all duration-300">
            {/* Left Side: Course Image or Blank Clean Placeholder (~40% on Desktop/Tablet) */}
            <div className="relative w-full md:w-[38%] lg:w-[40%] min-h-[260px] sm:min-h-[320px] md:min-h-full overflow-hidden bg-gradient-to-br from-[#EFECE4] via-[#EAE5D8] to-[#DFD8C6] shrink-0 border-b md:border-b-0 md:border-r border-[#444C38]/20 flex flex-col items-center justify-center">
              {masterclassCourse.imagePath && !masterclassCourse.imagePath.includes("placeholder") ? (
                <>
                  <Image
                    src={masterclassCourse.imagePath}
                    alt={masterclassCourse.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 500px"
                    className="object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14120E]/50 via-transparent to-transparent md:hidden" />
                </>
              ) : (
                /* Blank, Clean Atelier Placeholder Area with Subtle Watercolor Neutral Aesthetics */
                <div className="relative w-full h-full min-h-[260px] sm:min-h-[320px] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                  {/* Subtle botanical watercolor texture backdrop */}
                  <div className="pointer-events-none absolute inset-0 z-0 opacity-35 mix-blend-multiply">
                    <Image
                      src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                      alt=""
                      fill
                      sizes="400px"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FAF8F2]/30 via-transparent to-[#FAF8F2]/50" />

                  {/* Soft ambient center wash */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute size-44 rounded-full bg-[#C8D1C7]/30 blur-2xl"
                  />

                  {/* Refined subtle atelier watermark */}
                  <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-[#444C38]/50">
                    <div className="size-12 rounded-full bg-[#FAF8F2]/80 border border-[#444C38]/15 flex items-center justify-center shadow-2xs backdrop-blur-xs">
                      <Sparkles className="size-5 text-[#444C38]/60" />
                    </div>
                    <span className="font-serif italic text-xs tracking-wider text-[#444C38]/70 font-medium mt-1">
                      Live Atelier Experience
                    </span>
                  </div>
                </div>
              )}

              {/* Badge in top-left */}
              <div className="absolute top-4 left-4 z-10">
                <span className="rounded-md bg-[#FAF8F2]/95 backdrop-blur-xs px-3 py-1 text-[0.66rem] font-bold uppercase tracking-widest text-[#444C38] border border-[#444C38]/20 shadow-xs">
                  One-Day Masterclass
                </span>
              </div>
            </div>

            {/* Right Side: Course Details (~60% on Desktop/Tablet) */}
            <div className="relative w-full md:w-[62%] lg:w-[60%] p-6 sm:p-8 lg:p-9 flex flex-col justify-between space-y-5 overflow-hidden">
              {/* Soft Watercolor Paper Texture Background */}
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="object-cover object-center opacity-25 mix-blend-multiply group-hover:opacity-30 transition-opacity duration-300 select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F2] via-transparent to-[#FAF8F2]/80" />
              </div>

              <div className="relative z-10 space-y-4">
                {/* Course Header */}
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#14120E] uppercase leading-tight">
                    {masterclassCourse.title}
                  </h2>
                  <div className="mt-2.5 h-0.5 w-16 bg-[#444C38]/35" />

                  {/* Subtitle / Tagline */}
                  <p className="mt-2 text-sm sm:text-base font-serif italic text-[#444C38] font-medium leading-relaxed">
                    “I Can’t Paint” to “I Painted This Myself.”
                  </p>

                  {/* Sessions, Duration & Language */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-[#2C2A24] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#444C38]" />
                      Live Online Masterclass
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#444C38]" />
                      120 Minutes (2 Hours)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#444C38]" />
                      HINGLISH
                    </span>
                  </div>
                </div>

                {/* Concise Course Description */}
                <p className="text-xs sm:text-sm text-[#2C2A24] font-medium leading-relaxed">
                  A focused 120-minute live masterclass designed for beginners and adults who want to learn watercolour painting, overcome fundamental mistakes, and paint with confidence.
                </p>

                {/* Dynamic Supabase Batch Schedule Box */}
                {renderScheduleBadge(masterclassCourse)}

                {/* Course Focus Section */}
                <div className="space-y-2">
                  <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#444C38]">
                    Masterclass Focus
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2C2A24] font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                      <span>Fix Fundamentals & Overcome Mistakes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                      <span>Live Interactive Demonstration on Zoom</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                      <span>Step-by-Step Mindful Painting Flow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                      <span>Direct Live Guidance & Creative Q&A</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Course Fees & Action Buttons */}
              <div className="relative z-10 pt-4 border-t border-[#444C38]/20 space-y-4">
                {/* Fees */}
                <div>
                  <span className="text-[0.66rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                    Course Fees
                  </span>
                  <div className="mt-1.5">
                    <PriceDisplay
                      amount={masterclassCourse.offerPrice}
                      originalAmount={masterclassCourse.originalPrice}
                      size="2xl"
                      showSuffix
                      badgeText="Special Offer"
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[0.7rem] text-[#3E522D] font-bold">
                    <Sparkles className="size-3 text-[#B93821] shrink-0" />
                    <span>Complete Live Atelier Access • Zoom Interactive</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Link
                    href={`/course/${masterclassCourse.slug}`}
                    className="btn-course-learn flex-1 sm:flex-none"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="size-4" />
                  </Link>

                  <button
                    onClick={() => handleOpenBooking(masterclassCourse)}
                    disabled={
                      masterclassCourse.activeBatch?.isExpired ||
                      !masterclassCourse.activeBatch?.isEnrollmentOpen ||
                      masterclassCourse.activeBatch?.isSoldOut
                    }
                    className="btn-course-enrol flex-1 sm:flex-none"
                  >
                    <span>
                      {masterclassCourse.activeBatch?.isExpired ||
                      !masterclassCourse.activeBatch?.isEnrollmentOpen
                        ? "Registration Closed"
                        : "Enrol Now"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ============================================================== */}
        {/* COURSE 1: WATERCOLOUR FOUNDATION (HORIZONTAL SIDE-BY-SIDE)    */}
        {/* ============================================================== */}
        {foundationCourse && (
          <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl bg-[#FAF8F2]/95 backdrop-blur-md border border-[#444C38]/30 shadow-[0_6px_28px_rgba(40,36,28,0.06)] hover:border-[#444C38]/50 hover:shadow-[0_12px_40px_rgba(40,36,28,0.1)] transition-all duration-300">
            {/* Left Side: Course Image (~40% on Desktop/Tablet) */}
            <div className="relative w-full md:w-[38%] lg:w-[40%] min-h-[260px] sm:min-h-[320px] md:min-h-full overflow-hidden bg-[#EBE7DC] shrink-0 border-b md:border-b-0 md:border-r border-[#444C38]/20">
              <Image
                src={foundationCourse.imagePath || "/images/foundation.jpeg"}
                alt={foundationCourse.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 500px"
                className="object-cover object-center group-hover:scale-102 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14120E]/50 via-transparent to-transparent md:hidden" />

              <div className="absolute top-4 left-4 z-10">
                <span className="rounded-md bg-[#FAF8F2]/95 backdrop-blur-xs px-3 py-1 text-[0.66rem] font-bold uppercase tracking-widest text-[#444C38] border border-[#444C38]/20 shadow-xs">
                  Foundation Course
                </span>
              </div>
            </div>

            {/* Right Side: Course Details (~60% on Desktop/Tablet) */}
            <div className="relative w-full md:w-[62%] lg:w-[60%] p-6 sm:p-8 lg:p-9 flex flex-col justify-between space-y-5 overflow-hidden">
              {/* Soft Watercolor Paper Texture Background */}
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="object-cover object-center opacity-25 mix-blend-multiply group-hover:opacity-30 transition-opacity duration-300 select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F2] via-transparent to-[#FAF8F2]/80" />
              </div>

              <div className="relative z-10 space-y-4">
                {/* Course Header */}
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#14120E] uppercase leading-tight">
                    {foundationCourse.title}
                  </h2>
                  <div className="mt-2.5 h-0.5 w-16 bg-[#444C38]/35" />

                  {/* Sessions & Duration */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-[#2C2A24] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#444C38]" />
                      2 LIVE Sessions (No Recording)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#444C38]" />
                      90 Min Each
                    </span>
                  </div>
                </div>

                {/* Dynamic Supabase Batch Schedule Box */}
                {renderScheduleBadge(foundationCourse)}

                {/* Course Focus Section */}
                <div className="space-y-2">
                  <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#444C38]">
                    Course Focus
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2C2A24] font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                      <span>Materials & Paper Knowledge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                      <span>Essential Brush Techniques</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                      <span>Colour Mixing & Palette Setup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                      <span>Wash Techniques & Mini Activity</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Course Fees & Action Buttons */}
              <div className="relative z-10 pt-4 border-t border-[#444C38]/20 space-y-4">
                {/* Fees */}
                <div>
                  <span className="text-[0.66rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                    Course Fees
                  </span>
                  <div className="mt-1.5">
                    <PriceDisplay
                      amount={foundationCourse.offerPrice}
                      originalAmount={foundationCourse.originalPrice}
                      size="2xl"
                      showSuffix
                      badgeText="Special Offer"
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[0.7rem] text-[#3E522D] font-bold">
                    <Sparkles className="size-3 text-[#B93821] shrink-0" />
                    <span>Includes <span className="font-price font-semibold tabular-nums">₹990</span> credit toward subsequent Artistry course</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Link
                    href={`/course/${foundationCourse.slug}`}
                    className="btn-course-learn flex-1 sm:flex-none"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="size-4" />
                  </Link>

                  <button
                    onClick={() => handleOpenBooking(foundationCourse)}
                    disabled={
                      foundationCourse.activeBatch?.isExpired ||
                      !foundationCourse.activeBatch?.isEnrollmentOpen ||
                      foundationCourse.activeBatch?.isSoldOut ||
                      (foundationCourse.activeBatch?.seatsRemaining !== undefined &&
                        foundationCourse.activeBatch.seatsRemaining <= 0)
                    }
                    className="btn-course-enrol flex-1 sm:flex-none"
                  >
                    <span>
                      {foundationCourse.activeBatch?.isSoldOut ||
                      (foundationCourse.activeBatch?.seatsRemaining !== undefined &&
                        foundationCourse.activeBatch.seatsRemaining <= 0)
                        ? "Batch Full"
                        : foundationCourse.activeBatch?.isExpired ||
                          !foundationCourse.activeBatch?.isEnrollmentOpen
                        ? "Registration Closed"
                        : "Enrol Now"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* COURSE 2: WATERCOLOUR ARTISTRY + FOUNDATION COURSE (HORIZONTAL) */}
        {/* ============================================================== */}
        {artistryCourse && (
          <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl bg-[#FAF8F2]/95 backdrop-blur-md border border-[#444C38]/30 shadow-[0_6px_28px_rgba(40,36,28,0.06)] hover:border-[#444C38]/50 hover:shadow-[0_12px_40px_rgba(40,36,28,0.1)] transition-all duration-300">
            {/* Left Side: Course Image (~40% on Desktop/Tablet) */}
            <div className="relative w-full md:w-[38%] lg:w-[40%] min-h-[260px] sm:min-h-[320px] md:min-h-full overflow-hidden bg-[#EBE7DC] shrink-0 border-b md:border-b-0 md:border-r border-[#444C38]/20">
              <Image
                src={artistryCourse.imagePath || "/images/ARTISTRY.jpeg"}
                alt={artistryCourse.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 500px"
                className="object-cover object-center group-hover:scale-102 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14120E]/50 via-transparent to-transparent md:hidden" />

              <div className="absolute top-4 left-4 z-10">
                <span className="rounded-md bg-[#444C38] text-[#FAF8F2] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-widest shadow-xs">
                  Comprehensive 3-Month Program
                </span>
              </div>
            </div>

            {/* Right Side: Course Details (~60% on Desktop/Tablet) */}
            <div className="relative w-full md:w-[62%] lg:w-[60%] p-6 sm:p-8 lg:p-9 flex flex-col justify-between space-y-5 overflow-hidden">
              {/* Soft Watercolor Paper Texture Background */}
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="object-cover object-center opacity-25 mix-blend-multiply group-hover:opacity-30 transition-opacity duration-300 select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F2] via-transparent to-[#FAF8F2]/80" />
              </div>

              <div className="relative z-10 space-y-4">
                {/* Course Header */}
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#14120E] uppercase leading-tight">
                    {artistryCourse.title}
                  </h2>
                  <div className="mt-2.5 h-0.5 w-16 bg-[#444C38]/35" />

                  {/* Sessions & Duration */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-[#2C2A24] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#444C38]" />
                      24 Live Interactive Sessions (3 Months)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#444C38]" />
                      90–120 Min Each
                    </span>
                  </div>
                </div>

                {/* Dynamic Supabase Batch Schedule Box */}
                {renderScheduleBadge(artistryCourse)}

                {/* 3 Master Subjects Highlight */}
                <div className="relative overflow-hidden rounded-xl bg-[#FAF8F2]/90 border border-[#444C38]/25 p-3.5 sm:p-4 shadow-2xs flex items-center justify-center text-center">
                  <div className="pointer-events-none absolute inset-0 z-0">
                    <Image
                      src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                      alt=""
                      fill
                      sizes="600px"
                      className="object-cover object-center opacity-15 mix-blend-multiply select-none"
                    />
                  </div>
                  <span className="relative z-10 font-serif text-sm sm:text-base md:text-[1.05rem] font-bold tracking-[0.14em] sm:tracking-[0.2em] text-[#353D2A] uppercase leading-relaxed break-words">
                    LANDSCAPE · FLORAL · STILL LIFE
                  </span>
                </div>
              </div>

              {/* Bottom Section: Course Fees & Action Buttons */}
              <div className="relative z-10 pt-4 border-t border-[#444C38]/20 space-y-4">
                {/* Fees */}
                <div>
                  <span className="text-[0.66rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                    Course Fees
                  </span>
                  <div className="mt-1.5">
                    <PriceDisplay
                      amount={artistryCourse.offerPrice}
                      originalAmount={artistryCourse.originalPrice}
                      size="2xl"
                      showSuffix
                      badgeText="Special Offer"
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[0.7rem] text-[#3E522D] font-bold">
                    <Sparkles className="size-3 text-[#B93821] shrink-0" />
                    <span>Foundation Alumni: <span className="font-price font-semibold tabular-nums">₹990</span> Credit applied (Pay <span className="font-price font-bold tabular-nums">₹9,000</span>)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Link
                    href={`/course/${artistryCourse.slug}`}
                    className="btn-course-learn flex-1 sm:flex-none"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="size-4" />
                  </Link>

                  <button
                    onClick={() => handleOpenBooking(artistryCourse)}
                    disabled={
                      artistryCourse.activeBatch?.isExpired ||
                      !artistryCourse.activeBatch?.isEnrollmentOpen ||
                      artistryCourse.activeBatch?.isSoldOut ||
                      (artistryCourse.activeBatch?.seatsRemaining !== undefined &&
                        artistryCourse.activeBatch.seatsRemaining <= 0)
                    }
                    className="btn-course-enrol flex-1 sm:flex-none"
                  >
                    <span>
                      {artistryCourse.activeBatch?.isSoldOut ||
                      (artistryCourse.activeBatch?.seatsRemaining !== undefined &&
                        artistryCourse.activeBatch.seatsRemaining <= 0)
                        ? "Batch Full"
                        : artistryCourse.activeBatch?.isExpired ||
                          !artistryCourse.activeBatch?.isEnrollmentOpen
                        ? "Registration Closed"
                        : "Enrol Now"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Booking / Enrolment Modal */}
      {selectedCourseForModal && (
        <RegistrationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          courseSlug={selectedCourseForModal.slug}
          courseTitle={selectedCourseForModal.title}
          coursePrice={selectedCourseForModal.offerPrice}
          batchId={selectedCourseForModal.activeBatch?.id}
        />
      )}
    </>
  );
}
