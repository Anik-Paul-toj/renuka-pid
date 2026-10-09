import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, Calendar, Clock, Layers } from "lucide-react";
import { getPublicCourses } from "@/lib/courses-admin/service";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Watercolour Courses | Renuka Art Studio",
  description:
    "Explore mindful, guided watercolour courses with Renuka Aggarwal. Master the fundamentals or embark on a complete 3-months artistic journey.",
};

export default async function CourseCatalogPage() {
  const courses = await getPublicCourses();

  // Specifically select the 2 courses: Foundation and Artistry
  const foundationCourse =
    courses.find((c) => c.slug === "watercolour-foundation") || courses[0];
  const artistryCourse =
    courses.find((c) => c.slug === "watercolour-artistry-foundation") || courses[1];

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#14120E] flex flex-col justify-between">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1 pb-16 sm:pb-24">
        {/* Header Section */}
        <div className="relative pt-8 sm:pt-14 pb-10 sm:pb-14 px-6 sm:px-8 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EBE7DC] border border-[#444C38]/20 px-3.5 py-1 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#444C38] mb-3">
            <Sparkles className="size-3.5" />
            <span>Curated Atelier Curriculum</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#14120E]">
            Watercolour Courses & Learning Journeys
          </h1>

          <div className="mt-3.5 h-0.5 w-16 bg-[#444C38]/40 mx-auto" />

          <p className="mt-4 text-xs sm:text-sm md:text-base leading-relaxed text-[#2C2A24] font-medium max-w-2xl mx-auto">
            Choose your learning path below. Every course is taught live by
            Renuka Aggarwal with personal artistic guidance, mindful techniques,
            and complete material clarity.
          </p>
        </div>

        {/* 2-Course Grid */}
        <div className="mx-auto max-w-6xl xl:max-w-7xl px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* CARD 1: WATERCOLOUR FOUNDATION */}
            {foundationCourse && (
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#FAF8F2] border border-[#464137]/20 shadow-[0_4px_24px_rgba(40,36,28,0.05)] hover:border-[#444C38]/50 hover:shadow-[0_12px_36px_rgba(40,36,28,0.09)] transition-all duration-300">
                {/* Course Image Container */}
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

                  {/* Badges on Image */}
                  <div className="absolute top-4 left-4">
                    <span className="rounded-md bg-[#FAF8F2]/95 backdrop-blur-xs px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest text-[#444C38] border border-[#444C38]/20 shadow-xs">
                      Foundation Course
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-[#FAF8F2]">
                    <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#FAF8F2]/90 block">
                      {foundationCourse.details?.cardSubtitle ||
                        "2 Live Sessions • 90 Minutes Each"}
                    </span>
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-[#FAF8F2] leading-tight mt-0.5">
                      {foundationCourse.title}
                    </h2>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Summary Headline */}
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

                    {/* Topics / Materials pill */}
                    <div className="rounded-lg bg-[#F7F4EC] p-3 border border-[#464137]/15">
                      <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#444C38] block mb-1">
                        Core Syllabus Focus:
                      </span>
                      <p className="text-xs font-semibold text-[#14120E] leading-relaxed">
                        {foundationCourse.details?.subjects ||
                          "Materials • Techniques • Colour Mixing • Wash"}
                      </p>
                    </div>

                    {/* Quick Features List */}
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

                  {/* Card Footer: Price & CTA */}
                  <div className="pt-4 border-t border-[#464137]/15 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[0.68rem] uppercase tracking-wider font-bold text-[#6F6B61] block">
                        Course Fee
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#B93821] tracking-tight">
                          ₹{foundationCourse.offerPrice}/-
                        </span>
                        {foundationCourse.originalPrice >
                          foundationCourse.offerPrice && (
                          <span className="line-through text-xs font-medium text-[#6F6B61]">
                            ₹{foundationCourse.originalPrice}/-
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/course/${foundationCourse.slug}`}
                      className="btn-studio px-5 sm:px-6 py-3 text-xs tracking-wider font-bold inline-flex items-center gap-2"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* CARD 2: WATERCOLOUR ARTISTRY + FOUNDATION COURSE */}
            {artistryCourse && (
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#FAF8F2] border border-[#464137]/20 shadow-[0_4px_24px_rgba(40,36,28,0.05)] hover:border-[#444C38]/50 hover:shadow-[0_12px_36px_rgba(40,36,28,0.09)] transition-all duration-300">
                {/* Course Image Container */}
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

                  {/* Badges on Image */}
                  <div className="absolute top-4 left-4">
                    <span className="rounded-md bg-[#444C38] text-[#FAF8F2] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest shadow-xs">
                      Comprehensive 3-Month Program
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-[#FAF8F2]">
                    <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#FAF8F2]/90 block">
                      {artistryCourse.details?.subjects ||
                        "Landscape • Floral • Still Life"}
                    </span>
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-[#FAF8F2] leading-tight mt-0.5">
                      {artistryCourse.title}
                    </h2>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Summary Headline */}
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

                    {/* Topics / Subjects Pill */}
                    <div className="rounded-lg bg-[#F7F4EC] p-3 border border-[#464137]/15">
                      <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#444C38] block mb-1">
                        3 Master Subjects:
                      </span>
                      <p className="text-xs font-semibold text-[#14120E] leading-relaxed">
                        {artistryCourse.details?.subjects ||
                          "Landscape • Floral • Still Life"}
                      </p>
                    </div>

                    {/* Quick Features List */}
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

                  {/* Card Footer: Price & CTA */}
                  <div className="pt-4 border-t border-[#464137]/15 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[0.68rem] uppercase tracking-wider font-bold text-[#6F6B61] block">
                        Course Fee
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#B93821] tracking-tight">
                          ₹{artistryCourse.offerPrice.toLocaleString()}/-
                        </span>
                        {artistryCourse.originalPrice >
                          artistryCourse.offerPrice && (
                          <span className="line-through text-xs font-medium text-[#6F6B61]">
                            ₹{artistryCourse.originalPrice.toLocaleString()}/-
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/course/${artistryCourse.slug}`}
                      className="btn-studio px-5 sm:px-6 py-3 text-xs tracking-wider font-bold inline-flex items-center gap-2"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
