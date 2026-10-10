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
    <div className="relative min-h-screen overflow-hidden bg-[#F7F4EC] text-[#14120E] flex flex-col justify-between">
      {/* Botanical Watercolor Background Art from Public Assets */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_06_12 PM.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover object-top opacity-30 mix-blend-multiply select-none"
        />
        {/* Soft Blending Masks */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F4EC]/40 via-transparent to-[#F7F4EC]/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4EC]/35 via-transparent to-[#F7F4EC]/35" />
      </div>

      {/* Delicate watercolor ambient washes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-5%] size-[38rem] rounded-full bg-[#C8D1C7]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-[-10%] size-[32rem] rounded-full bg-[#D9BDB2]/15 blur-3xl"
      />

      {/* Top Navigation */}
      <div className="relative z-10">
        <Navbar />
      </div>

      <main className="relative z-10 flex-1 pb-16 sm:pb-24">
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
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#FAF8F2]/95 backdrop-blur-md border border-[#444C38]/35 shadow-[0_4px_24px_rgba(40,36,28,0.06)] hover:border-[#444C38]/55 hover:shadow-[0_12px_36px_rgba(40,36,28,0.1)] transition-all duration-300">
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

                  {/* Seamless Watercolor Blend into Card Body */}
                  <div className="absolute inset-x-0 -bottom-px h-10 sm:h-12 bg-gradient-to-b from-transparent via-[#FAF8F2]/70 to-[#FAF8F2] pointer-events-none" />

                  {/* Badges on Image */}
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

                {/* Card Content Body with Botanical Watercolor Shading Overlay */}
                <div className="relative p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6 overflow-hidden">
                  {/* Custom Botanical Watercolor Texture Overlay with Soft Feathered Blend */}
                  <div className="pointer-events-none absolute inset-0 z-0">
                    <Image
                      src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover object-center opacity-30 mix-blend-multiply group-hover:opacity-38 transition-opacity duration-300 select-none"
                    />
                    {/* Soft Blending Masks - Feathered Edges */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F2] via-transparent to-[#FAF8F2]/80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F2]/60 via-transparent to-[#FAF8F2]/60" />
                  </div>

                  <div className="relative z-10 space-y-4">
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

                    {/* Topics / Materials pill with shaded wash */}
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

                    <Link
                      href={`/course/${foundationCourse.slug}`}
                      className="btn-studio w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-xs tracking-wider font-bold inline-flex items-center justify-center gap-2 shadow-sm shrink-0 text-center"
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
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#FAF8F2]/95 backdrop-blur-md border border-[#444C38]/35 shadow-[0_4px_24px_rgba(40,36,28,0.06)] hover:border-[#444C38]/55 hover:shadow-[0_12px_36px_rgba(40,36,28,0.1)] transition-all duration-300">
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

                  {/* Seamless Watercolor Blend into Card Body */}
                  <div className="absolute inset-x-0 -bottom-px h-10 sm:h-12 bg-gradient-to-b from-transparent via-[#FAF8F2]/70 to-[#FAF8F2] pointer-events-none" />

                  {/* Badges on Image */}
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

                {/* Card Content Body with Botanical Watercolor Shading Overlay */}
                <div className="relative p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6 overflow-hidden">
                  {/* Custom Botanical Watercolor Texture Overlay with Soft Feathered Blend */}
                  <div className="pointer-events-none absolute inset-0 z-0">
                    <Image
                      src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover object-center opacity-30 mix-blend-multiply group-hover:opacity-38 transition-opacity duration-300 select-none"
                    />
                    {/* Soft Blending Masks - Feathered Edges */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F2] via-transparent to-[#FAF8F2]/80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F2]/60 via-transparent to-[#FAF8F2]/60" />
                  </div>

                  <div className="relative z-10 space-y-4">
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

                    {/* Topics / Subjects Pill with shaded wash */}
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

                    <Link
                      href={`/course/${artistryCourse.slug}`}
                      className="btn-studio w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-xs tracking-wider font-bold inline-flex items-center justify-center gap-2 shadow-sm shrink-0 text-center"
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

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
