import React from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { getPublicCourses } from "@/lib/courses-admin/service";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CourseCatalogClient } from "@/components/course/CourseCatalogClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Watercolour Courses | Renuka Art Studio",
  description:
    "Explore mindful, guided watercolour courses with Renuka Aggarwal. Master the fundamentals or embark on a complete 3-months artistic journey.",
};

export default async function CourseCatalogPage() {
  const courses = await getPublicCourses();

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

        {/* Dynamic 2-Course Grid with Live Supabase Batch Scheduling */}
        <div className="mx-auto max-w-6xl xl:max-w-7xl px-6 sm:px-8">
          <CourseCatalogClient courses={courses} />
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
