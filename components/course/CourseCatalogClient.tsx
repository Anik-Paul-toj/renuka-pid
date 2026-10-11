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
  AlertCircle,
  Hourglass,
  Layers,
} from "lucide-react";
import { AdminCourseData } from "@/lib/courses-admin/service";
import { RegistrationModal } from "@/components/RegistrationModal";

interface CourseCatalogClientProps {
  courses: AdminCourseData[];
}

export function CourseCatalogClient({ courses }: CourseCatalogClientProps) {
  const [selectedCourseForModal, setSelectedCourseForModal] =
    useState<AdminCourseData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <div className="rounded-lg bg-[#FAF8F2]/90 p-3.5 border border-[#444C38]/20 text-xs text-[#6F6B61]">
          <span>Schedule details will be announced soon.</span>
        </div>
      );
    }

    const isClosed = !batch.isEnrollmentOpen || batch.isExpired || batch.isSoldOut;

    return (
      <div className="group/sched relative overflow-hidden rounded-xl bg-[#FAF8F2]/95 border border-[#444C38]/30 p-3.5 sm:p-4 shadow-2xs space-y-2.5">
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
            alt=""
            fill
            sizes="500px"
            className="object-cover object-center opacity-15 mix-blend-multiply select-none"
          />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-[#444C38]/15 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#444C38] animate-pulse" />
            <span className="text-[0.66rem] uppercase tracking-wider font-bold text-[#444C38]">
              {batch.batchName || "Upcoming Live Cohort"}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[0.64rem] font-bold uppercase tracking-wider ${
              isClosed
                ? "bg-[#6F6B61]/15 text-[#6F6B61] border border-[#6F6B61]/25"
                : "bg-[#3E522D]/15 text-[#3E522D] border border-[#3E522D]/30"
            }`}
          >
            {isClosed ? "Registration Closed" : "Open for Registration"}
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
          {/* Start Date */}
          <div className="flex items-start gap-2">
            <div className="size-7 rounded-md bg-[#444C38]/12 border border-[#444C38]/20 flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
              <Calendar className="size-3.5" />
            </div>
            <div>
              <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none mb-1">
                Batch Starts
              </span>
              <span className="font-bold text-[#14120E] text-[0.78rem] block leading-tight">
                {batch.formattedStartDate || batch.startDate || "TBA"}
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
                {batch.formattedLastRegistrationDate ||
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* CARD 1: WATERCOLOUR FOUNDATION */}
        {foundationCourse && (
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#FAF8F2]/95 backdrop-blur-md border border-[#444C38]/35 shadow-[0_4px_24px_rgba(40,36,28,0.06)] hover:border-[#444C38]/55 hover:shadow-[0_12px_36px_rgba(40,36,28,0.1)] transition-all duration-300">
            {/* Course Image Banner */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EBE7DC]">
              <Image
                src="/images/foundation.jpeg"
                alt={foundationCourse.title}
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14120E]/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 -bottom-px h-10 sm:h-12 bg-gradient-to-b from-transparent via-[#FAF8F2]/70 to-[#FAF8F2] pointer-events-none" />

              <div className="absolute top-4 left-4">
                <span className="rounded-md bg-[#FAF8F2]/95 backdrop-blur-xs px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest text-[#444C38] border border-[#444C38]/20 shadow-xs">
                  Foundation Course
                </span>
              </div>

              <div className="absolute bottom-5 left-4 right-4 text-[#FAF8F2] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#FAF8F2]/90 block">
                  {foundationCourse.details?.cardSubtitle ||
                    "2 Live Sessions • 90 Minutes Each"}
                </span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#FAF8F2] leading-tight mt-0.5">
                  {foundationCourse.title}
                </h2>
              </div>
            </div>

            {/* Card Body */}
            <div className="relative p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5 overflow-hidden">
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center opacity-30 mix-blend-multiply group-hover:opacity-38 transition-opacity duration-300 select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F2] via-transparent to-[#FAF8F2]/80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F2]/60 via-transparent to-[#FAF8F2]/60" />
              </div>

              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#14120E] leading-snug">
                    {foundationCourse.details?.cardSummary ||
                      "Master the Fundamentals of Watercolour Painting"}
                  </h3>
                  {foundationCourse.details?.fullDescription && (
                    <p className="mt-2 text-xs sm:text-sm text-[#2C2A24] font-medium leading-relaxed line-clamp-3">
                      {foundationCourse.details.fullDescription}
                    </p>
                  )}
                </div>

                {/* Dynamic Batch Schedule Box */}
                {renderScheduleBadge(foundationCourse)}

                {/* Core Syllabus Focus */}
                <div className="group/sub relative overflow-hidden rounded-lg bg-[#FAF8F2]/90 p-3 border border-[#444C38]/25 shadow-2xs">
                  <div className="pointer-events-none absolute inset-0 z-0">
                    <Image
                      src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                      alt=""
                      fill
                      sizes="500px"
                      className="object-cover object-center opacity-20 mix-blend-multiply select-none"
                    />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#444C38] block mb-1">
                      Core Syllabus Focus:
                    </span>
                    <p className="text-xs font-semibold text-[#14120E] leading-relaxed">
                      {foundationCourse.details?.subjects ||
                        "Materials • Techniques • Colour Mixing • Wash"}
                    </p>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2 text-xs text-[#2C2A24] font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                    <span>Complete Material, Brush & Paper Knowledge</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                    <span>Wash Techniques, Colour Theory & Palette Setup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                    <span>Guided Mini Activity with Live Feedback</span>
                  </li>
                </ul>
              </div>

              {/* Card Footer: Price & CTA Actions */}
              <div className="relative z-10 pt-4 border-t border-[#464137]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                <div>
                  <span className="text-[0.66rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                    Course Fee
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2 mt-1">
                    <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#B93821] tracking-tight">
                      ₹{foundationCourse.offerPrice}/-
                    </span>
                    {foundationCourse.originalPrice >
                      foundationCourse.offerPrice && (
                      <span className="line-through text-xs font-semibold text-[#6F6B61]">
                        ₹{foundationCourse.originalPrice}/-
                      </span>
                    )}
                    <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#8E2515] bg-[#B93821]/12 border border-[#B93821]/30 px-2 py-0.5 rounded-sm">
                      Special Offer
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[0.68rem] text-[#3E522D] font-bold">
                    <Sparkles className="size-3 text-[#B93821] shrink-0" />
                    <span>Includes ₹990 credit toward subsequent Artistry course</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <Link
                    href={`/course/${foundationCourse.slug}`}
                    className="flex-1 sm:flex-none border border-[#444C38]/40 hover:bg-[#EBE7DC] px-4 py-2.5 rounded-md text-xs font-bold text-[#444C38] transition-colors text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="size-3.5" />
                  </Link>

                  <button
                    onClick={() => handleOpenBooking(foundationCourse)}
                    disabled={
                      foundationCourse.activeBatch?.isExpired ||
                      !foundationCourse.activeBatch?.isEnrollmentOpen ||
                      foundationCourse.activeBatch?.isSoldOut
                    }
                    className="btn-studio flex-1 sm:flex-none px-5 py-2.5 text-xs tracking-wider font-bold inline-flex items-center justify-center gap-2 shadow-sm text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>
                      {foundationCourse.activeBatch?.isExpired ||
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

        {/* CARD 2: WATERCOLOUR ARTISTRY + FOUNDATION COURSE */}
        {artistryCourse && (
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#FAF8F2]/95 backdrop-blur-md border border-[#444C38]/35 shadow-[0_4px_24px_rgba(40,36,28,0.06)] hover:border-[#444C38]/55 hover:shadow-[0_12px_36px_rgba(40,36,28,0.1)] transition-all duration-300">
            {/* Course Image Banner */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EBE7DC]">
              <Image
                src="/images/ARTISTRY.jpeg"
                alt={artistryCourse.title}
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover object-center group-hover:scale-103 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14120E]/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 -bottom-px h-10 sm:h-12 bg-gradient-to-b from-transparent via-[#FAF8F2]/70 to-[#FAF8F2] pointer-events-none" />

              <div className="absolute top-4 left-4">
                <span className="rounded-md bg-[#444C38] text-[#FAF8F2] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest shadow-xs">
                  Comprehensive 3-Month Program
                </span>
              </div>

              <div className="absolute bottom-5 left-4 right-4 text-[#FAF8F2] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#FAF8F2]/90 block">
                  {artistryCourse.details?.subjects ||
                    "Landscape • Floral • Still Life"}
                </span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#FAF8F2] leading-tight mt-0.5">
                  {artistryCourse.title}
                </h2>
              </div>
            </div>

            {/* Card Body */}
            <div className="relative p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5 overflow-hidden">
              <div className="pointer-events-none absolute inset-0 z-0">
                <Image
                  src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center opacity-30 mix-blend-multiply group-hover:opacity-38 transition-opacity duration-300 select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F2] via-transparent to-[#FAF8F2]/80" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F2]/60 via-transparent to-[#FAF8F2]/60" />
              </div>

              <div className="relative z-10 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[0.7rem] uppercase tracking-wider font-bold text-[#444C38] bg-[#EBE7DC] px-2 py-0.5 rounded-sm">
                      {artistryCourse.details?.sessionCountText ||
                        "24 Live Interactive Sessions"}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#14120E] leading-snug">
                    {artistryCourse.details?.cardDescription ||
                      "A Complete 3-Months Watercolour Learning Journey."}
                  </h3>
                  {artistryCourse.details?.fullDescription && (
                    <p className="mt-2 text-xs sm:text-sm text-[#2C2A24] font-medium leading-relaxed line-clamp-3">
                      {artistryCourse.details.fullDescription}
                    </p>
                  )}
                </div>

                {/* Dynamic Batch Schedule Box */}
                {renderScheduleBadge(artistryCourse)}

                {/* Master Subjects */}
                <div className="group/sub relative overflow-hidden rounded-lg bg-[#FAF8F2]/90 p-3 border border-[#444C38]/25 shadow-2xs">
                  <div className="pointer-events-none absolute inset-0 z-0">
                    <Image
                      src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                      alt=""
                      fill
                      sizes="500px"
                      className="object-cover object-center opacity-20 mix-blend-multiply select-none"
                    />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#444C38] block mb-1">
                      3 Master Subjects:
                    </span>
                    <p className="text-xs font-semibold text-[#14120E] leading-relaxed">
                      {artistryCourse.details?.subjects ||
                        "Landscape • Floral • Still Life"}
                    </p>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2 text-xs text-[#2C2A24] font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                    <span>2 Foundation + 18 Demo + 3 Discussion Sessions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                    <span>Complimentary Black Ink Demo Session</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#444C38] shrink-0" />
                    <span>Step-by-step complete paintings from scratch</span>
                  </li>
                </ul>
              </div>

              {/* Card Footer: Price & CTA Actions */}
              <div className="relative z-10 pt-4 border-t border-[#464137]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                <div>
                  <span className="text-[0.66rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none">
                    Course Fee
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2 mt-1">
                    <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#B93821] tracking-tight">
                      ₹{artistryCourse.offerPrice.toLocaleString()}/-
                    </span>
                    {artistryCourse.originalPrice >
                      artistryCourse.offerPrice && (
                      <span className="line-through text-xs font-semibold text-[#6F6B61]">
                        ₹{artistryCourse.originalPrice.toLocaleString()}/-
                      </span>
                    )}
                    <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#8E2515] bg-[#B93821]/12 border border-[#B93821]/30 px-2 py-0.5 rounded-sm">
                      Special Offer
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[0.68rem] text-[#3E522D] font-bold">
                    <Sparkles className="size-3 text-[#B93821] shrink-0" />
                    <span>Foundation Alumni: ₹990 Credit (Pay ₹9,000)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <Link
                    href={`/course/${artistryCourse.slug}`}
                    className="flex-1 sm:flex-none border border-[#444C38]/40 hover:bg-[#EBE7DC] px-4 py-2.5 rounded-md text-xs font-bold text-[#444C38] transition-colors text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="size-3.5" />
                  </Link>

                  <button
                    onClick={() => handleOpenBooking(artistryCourse)}
                    disabled={
                      artistryCourse.activeBatch?.isExpired ||
                      !artistryCourse.activeBatch?.isEnrollmentOpen ||
                      artistryCourse.activeBatch?.isSoldOut
                    }
                    className="btn-studio flex-1 sm:flex-none px-5 py-2.5 text-xs tracking-wider font-bold inline-flex items-center justify-center gap-2 shadow-sm text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>
                      {artistryCourse.activeBatch?.isExpired ||
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

      {/* Booking Modal */}
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
