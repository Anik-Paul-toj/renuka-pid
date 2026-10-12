import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Video,
  Ban,
  HeartHandshake,
  Users,
  Compass,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms & Conditions | Renuka Art Studio",
  description:
    "Official Terms & Conditions and studio guidelines for enrolling in watercolor courses, workshops, and live sessions at Renuka Art Studio.",
};

const TERMS_SECTIONS = [
  {
    number: "1",
    id: "live-classes-attendance",
    title: "Live Classes & Attendance",
    icon: Video,
    tag: "Studio Sessions",
    content:
      "We encourage all students to attend live sessions regularly to get the best learning experience, interact with the instructor, ask questions, and receive guidance. No recorded lessons or session recordings will be provided. Students are responsible for attending classes as per the announced schedule.",
  },
  {
    number: "2",
    id: "no-promotion-solicitation",
    title: "No Promotion or Solicitation",
    icon: Ban,
    tag: "Community Focus",
    content:
      "Renuka Art Studio maintains a learning-focused environment. Students are strictly prohibited from pitching, selling, advertising, or promoting their own or third-party products, services, courses, or businesses within the class sessions, student groups, or any studio-related community without prior written permission.",
  },
  {
    number: "3",
    id: "respectful-behaviour",
    title: "Respectful Behaviour",
    icon: HeartHandshake,
    tag: "Studio Culture",
    content:
      "All students are expected to maintain a respectful, supportive, and professional attitude during classes and in group interactions. The use of abusive, offensive, misleading, inappropriate, or disrespectful language, as well as any form of harassment, personal attacks, or disruptive behaviour, will not be tolerated.",
  },
  {
    number: "4",
    id: "group-etiquette",
    title: "Group Etiquette",
    icon: Users,
    tag: "Student Community",
    content:
      "All course-related groups are intended for learning, sharing artwork, asking relevant questions, and receiving course updates. Students must avoid spam, unsolicited private messages for promotional purposes, irrelevant content, and any activity that disrupts the learning environment.",
  },
  {
    number: "5",
    id: "student-responsibility",
    title: "Student Responsibility",
    icon: Compass,
    tag: "Personal Practice",
    content:
      "Students are responsible for their participation, practice, and progress. Results may vary depending on individual effort, consistency, and prior experience.",
  },
  {
    number: "6",
    id: "changes-to-schedule",
    title: "Changes to Schedule",
    icon: CalendarDays,
    tag: "Arrangements",
    content:
      "Renuka Art Studio reserves the right to make reasonable changes to class schedules, instructors, or session arrangements when necessary. Students will be informed of any significant changes in advance wherever possible.",
  },
  {
    number: "7",
    id: "violation-of-terms",
    title: "Violation of Terms",
    icon: AlertTriangle,
    tag: "Policy Enforcement",
    content:
      "Failure to follow these terms may result in a warning, removal from the student group, or suspension from classes, depending on the seriousness or repetition of the violation. No refund will be implied or guaranteed solely by such action; any refund entitlement will be governed by the applicable course refund policy and law.",
  },
  {
    number: "8",
    id: "agreement",
    title: "Agreement",
    icon: CheckCircle2,
    tag: "Enrollment Acknowledgement",
    content:
      "By enrolling in any course or workshop offered by Renuka Art Studio, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F4EC] text-[#14120E] flex flex-col justify-between">
      {/* Botanical Watercolor Background Art */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_06_12 PM.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover object-top opacity-30 mix-blend-multiply select-none"
        />
        {/* Soft Edge Blending Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F4EC]/50 via-transparent to-[#F7F4EC]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F4EC]/40 via-transparent to-[#F7F4EC]/40" />
      </div>

      {/* Ambient Watercolor Atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-5%] size-[36rem] rounded-full bg-[#C8D1C7]/20 blur-3xl"
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
        {/* Header Hero */}
        <div className="relative pt-8 sm:pt-14 pb-8 sm:pb-12 px-6 sm:px-8 text-center max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#6F6B61] mb-6">
            <Link
              href="/"
              className="hover:text-[#14120E] transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="size-3" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-[#444C38] font-bold">Terms &amp; Conditions</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#EBE7DC] border border-[#444C38]/20 px-3.5 py-1 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#444C38] mb-3 shadow-2xs">
            <FileText className="size-3.5" />
            <span>Studio Policy &amp; Guidelines</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#14120E]">
            Terms &amp; Conditions
          </h1>

          <div className="mt-3.5 h-0.5 w-16 bg-[#444C38]/40 mx-auto" />

          {/* Intro welcome statement */}
          <p className="mt-5 text-sm sm:text-base md:text-lg leading-relaxed text-[#2C2A24] font-medium max-w-2xl mx-auto">
            Welcome to Renuka Art Studio. By enrolling in our courses, workshops, or live sessions, you agree to the following terms and conditions.
          </p>
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-4xl px-6 sm:px-8">
          {/* Quick Table of Contents / Section Index */}
          <div className="mb-10 rounded-2xl bg-[#FAF8F2] border border-[#464137]/15 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#464137]/10 text-xs font-bold uppercase tracking-wider text-[#444C38]">
              <ShieldCheck className="size-4" />
              <span>Table of Contents</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {TERMS_SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center gap-2 py-1 px-2 rounded-lg text-[#3E3A32] hover:text-[#14120E] hover:bg-[#F0EDE6] transition-colors"
                >
                  <span className="size-5 shrink-0 rounded-full bg-[#EBE7DC] text-[#444C38] font-bold text-[10px] flex items-center justify-center">
                    {sec.number}
                  </span>
                  <span className="font-medium truncate">{sec.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Numbered Sections */}
          <div className="space-y-6 sm:space-y-7">
            {TERMS_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="group rounded-2xl bg-[#FAF8F2] border border-[#464137]/15 p-6 sm:p-8 shadow-xs hover:border-[#444C38]/30 hover:shadow-md transition-all duration-300 scroll-mt-24"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-[#EBE7DC] border border-[#444C38]/20 flex items-center justify-center text-[#444C38] group-hover:bg-[#444C38] group-hover:text-white transition-colors duration-300">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#6F6B61]">
                          Section {sec.number} • {sec.tag}
                        </div>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#14120E] mt-0.5">
                          {sec.number}. {sec.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm sm:text-[0.95rem] text-[#2C2A24] leading-relaxed pt-2">
                    {sec.content}
                  </p>
                </section>
              );
            })}
          </div>

          {/* Support and Questions Banner */}
          <div className="mt-12 rounded-2xl bg-[#EBE7DC]/70 border border-[#444C38]/20 p-6 sm:p-8 text-center space-y-4 shadow-xs">
            <div className="size-12 rounded-full bg-[#444C38]/10 text-[#444C38] flex items-center justify-center mx-auto">
              <Mail className="size-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#14120E]">
                Questions Regarding Studio Terms?
              </h3>
              <p className="text-xs sm:text-sm text-[#3E3A32] mt-1 max-w-lg mx-auto leading-relaxed">
                If you have any questions about these guidelines, course details, or scheduling arrangements, our studio team is here to assist you.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:hello@renukaartstudio.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#444C38] text-[#FAF8F2] text-xs font-bold hover:bg-[#353B2C] transition-colors shadow-xs"
              >
                <Mail className="size-3.5" />
                <span>hello@renukaartstudio.com</span>
              </a>
              <Link
                href="/course"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#464137]/20 bg-white/80 text-[#14120E] text-xs font-bold hover:bg-white transition-colors"
              >
                <span>Browse Courses</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
