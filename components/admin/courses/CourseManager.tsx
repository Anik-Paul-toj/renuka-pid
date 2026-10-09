"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  GraduationCap,
  Sparkles,
  Tag,
  Clock,
  IndianRupee,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Layers,
  Info,
  Edit3,
  X,
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  Compass,
  FileText,
  HelpCircle,
  MousePointerClick,
  Percent,
  Video,
  Globe,
  Hourglass,
  ExternalLink,
} from "lucide-react";
import { AdminCourseData } from "@/lib/courses-admin/service";
import { CourseScheduleItem } from "@/lib/validations/course-admin";

interface CourseManagerProps {
  initialCourses: AdminCourseData[];
  userRole: "super_admin" | "admin" | "editor";
}

export function CourseManager({
  initialCourses,
  userRole,
}: CourseManagerProps) {
  const isReadOnly = userRole === "editor";

  const [courses, setCourses] = useState<AdminCourseData[]>(initialCourses);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourses[0]?.id || ""
  );

  const activeCourse =
    courses.find((c) => c.id === selectedCourseId) || courses[0];

  const isLandingPageWorkshop =
    activeCourse?.slug === "the-watercolour" ||
    activeCourse?.slug === "the-watercolour-roadmap";

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "basic" | "listing" | "pricing" | "duration" | "description" | "outcomes" | "schedule" | "cta"
  >("basic");

  // Form State initialized from activeCourse
  const buildFormData = (c?: AdminCourseData) => ({
    title: c?.title || "",
    slug: c?.slug || "",
    description: c?.description || "",
    durationMinutes: c?.durationMinutes || 120,
    originalPrice: c?.originalPrice || 990,
    offerPrice: c?.offerPrice || 990,
    currency: "INR" as const,
    isActive: c?.isActive ?? true,

    // 2. Listing Card Content
    cardSubtitle: c?.details?.cardSubtitle || "",
    cardSummary: c?.details?.cardSummary || "",
    cardDescription: c?.details?.cardDescription || "",
    subjects: c?.details?.subjects || "",
    cardPriceLabel: c?.details?.cardPriceLabel || "",

    // 4. Duration & Session Information
    sessionCountText: c?.details?.sessionCountText || "",
    sessionDurationText: c?.details?.sessionDurationText || "",
    durationMonthsText: c?.details?.durationMonthsText || "",

    // 5. Course Description
    fullDescription: c?.details?.fullDescription || "",

    // 6. Learning Outcomes
    learningOutcomesHeading:
      c?.details?.learningOutcomesHeading || "What You’ll Learn",
    learningOutcomesSubheading:
      c?.details?.learningOutcomesSubheading || "",
    learningOutcomes: c?.details?.learningOutcomes || [],

    // 7. Schedule
    scheduleHeading: c?.details?.scheduleHeading || "",
    scheduleItems: c?.details?.scheduleItems || [],
    scheduleNote: c?.details?.scheduleNote || "",

    // 8. Additional Content & CTA
    whyHeading: c?.details?.whyHeading || "Why This Course?",
    whyDescription: c?.details?.whyDescription || "",
    whyCallout: c?.details?.whyCallout || "",
    ctaText: c?.details?.ctaText || "Enrol Now",
  });

  const [formData, setFormData] = useState(buildFormData(activeCourse));
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Reset form when switching courses
  const handleSelectCourse = (course: AdminCourseData) => {
    setSelectedCourseId(course.id);
    setFormData(buildFormData(course));
    setIsEditing(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});
  };

  const handleInputChange = (field: string, value: any) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage(null);
    setErrorMessage(null);

    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCancel = () => {
    if (activeCourse) {
      setFormData(buildFormData(activeCourse));
    }
    setIsEditing(false);
    setErrorMessage(null);
    setFieldErrors({});
  };

  // Repeatable list helpers: Learning Outcomes
  const handleAddLearningOutcome = () => {
    if (isReadOnly) return;
    setFormData((prev) => ({
      ...prev,
      learningOutcomes: [...prev.learningOutcomes, ""],
    }));
  };

  const handleUpdateLearningOutcome = (index: number, value: string) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const next = [...prev.learningOutcomes];
      next[index] = value;
      return { ...prev, learningOutcomes: next };
    });
  };

  const handleRemoveLearningOutcome = (index: number) => {
    if (isReadOnly) return;
    setFormData((prev) => ({
      ...prev,
      learningOutcomes: prev.learningOutcomes.filter((_, i) => i !== index),
    }));
  };

  // Repeatable list helpers: Schedule Items
  const handleAddScheduleItem = () => {
    if (isReadOnly) return;
    setFormData((prev) => ({
      ...prev,
      scheduleItems: [
        ...prev.scheduleItems,
        { label: "New Session / Class", detail: "" },
      ],
    }));
  };

  const handleUpdateScheduleItem = (
    index: number,
    field: "label" | "detail",
    value: string
  ) => {
    if (isReadOnly) return;
    setFormData((prev) => {
      const next = [...prev.scheduleItems];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, scheduleItems: next };
    });
  };

  const handleRemoveScheduleItem = (index: number) => {
    if (isReadOnly) return;
    setFormData((prev) => ({
      ...prev,
      scheduleItems: prev.scheduleItems.filter((_, i) => i !== index),
    }));
  };

  // Pricing calculations
  const original = Number(formData.originalPrice) || 0;
  const offer = Number(formData.offerPrice) || 0;
  const discountAmount = Math.max(0, original - offer);
  const discountPercent =
    original > 0 && offer <= original
      ? Math.round(((original - offer) / original) * 100)
      : 0;
  const internalPaise = Math.round(offer * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !activeCourse) return;

    if (!formData.title.trim()) {
      setErrorMessage("Course title is required.");
      return;
    }
    if (!formData.slug.trim()) {
      setErrorMessage("Course slug is required.");
      return;
    }
    if (offer > original) {
      setErrorMessage(
        "Offer price (₹) cannot be higher than original MRP price (₹)."
      );
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const detailsPayload = isLandingPageWorkshop
        ? {
            cardSubtitle: "One-Day Masterclass",
            cardSummary: "Interactive Live Masterclass on Zoom",
            cardDescription:
              formData.description?.trim() ||
              "Live Masterclass designed to fix basics and get you painting.",
            subjects: "Watercolour Essentials • Live Demonstration",
            cardPriceLabel:
              formData.cardPriceLabel?.trim() || "Complete Live Atelier Access",
            sessionCountText: "1 Live Session",
            sessionDurationText: `${formData.durationMinutes} mins`,
            durationMonthsText: "1 Day",
            fullDescription:
              formData.description?.trim() ||
              "Live intimate masterclass session on Zoom with personal guidance.",
            learningOutcomesHeading: "",
            learningOutcomesSubheading: "",
            learningOutcomes: [],
            scheduleHeading: "Live Workshop Details",
            scheduleItems: [],
            scheduleNote:
              "Live interactive atelier sessions on Zoom with personal feedback and guidance.",
            whyHeading: "",
            whyDescription: "",
            whyCallout: "",
            ctaText: "Register Now",
          }
        : {
            cardSubtitle: formData.cardSubtitle.trim(),
            cardSummary: formData.cardSummary.trim(),
            cardDescription: formData.cardDescription.trim(),
            subjects: formData.subjects.trim(),
            cardPriceLabel: formData.cardPriceLabel.trim(),

            sessionCountText: formData.sessionCountText.trim(),
            sessionDurationText: formData.sessionDurationText.trim(),
            durationMonthsText: formData.durationMonthsText.trim(),

            fullDescription: formData.fullDescription.trim(),

            learningOutcomesHeading: formData.learningOutcomesHeading.trim(),
            learningOutcomesSubheading: formData.learningOutcomesSubheading.trim(),
            learningOutcomes: formData.learningOutcomes
              .map((item) => item.trim())
              .filter(Boolean),

            scheduleHeading: formData.scheduleHeading.trim(),
            scheduleItems: formData.scheduleItems.filter(
              (item) => item.label.trim().length > 0
            ),
            scheduleNote: formData.scheduleNote.trim(),

            whyHeading: formData.whyHeading.trim(),
            whyDescription: formData.whyDescription.trim(),
            whyCallout: formData.whyCallout.trim(),
            ctaText: formData.ctaText.trim(),
          };

      const res = await fetch(`/api/admin/courses/${activeCourse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          description: isLandingPageWorkshop
            ? formData.description?.trim() || ""
            : JSON.stringify(detailsPayload),
          durationMinutes: Number(formData.durationMinutes),
          originalPrice: Number(formData.originalPrice),
          offerPrice: Number(formData.offerPrice),
          currency: "INR",
          isActive: formData.isActive,
          details: detailsPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setErrorMessage(data.error || "Failed to update course.");
        return;
      }

      setSuccessMessage(
        isLandingPageWorkshop
          ? "Landing page masterclass details and pricing updated successfully! Live hero workshop box updated."
          : "Course content and pricing updated successfully! Public listing and detail pages updated."
      );
      setIsEditing(false);

      if (data.course) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === data.course.id ? { ...c, ...data.course } : c
          )
        );
      }
    } catch {
      setErrorMessage("A network error occurred while updating the course.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
              <GraduationCap className="size-3" />
              <span>Course Curriculum, Content & Pricing</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#292923]">
              Course / Workshop Management
            </h1>
            <p className="text-xs text-[#6F6B61] mt-1 max-w-2xl leading-relaxed">
              Manage the 2 watercolour courses: Listing card content, detail
              page syllabus, schedule, descriptions, and authoritative prices.
              Changes persist independently and reflect immediately on the
              public site.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && !isReadOnly && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#68705A] text-[#FAF8F2] text-xs font-semibold hover:bg-[#575E4B] transition-colors shadow-xs"
              >
                <Edit3 className="size-3.5" />
                <span>Edit This Course</span>
              </button>
            )}
            {isReadOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EEE9DE] px-3 py-1 text-xs font-medium text-[#6F6B61] border border-[#464137]/10">
                <Lock className="size-3" />
                <span>Read-only (Editor)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Course Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-[#464137]/15 pb-2 overflow-x-auto">
        {courses.map((course) => {
          const isWorkshopTab =
            course.slug === "the-watercolour" ||
            course.slug === "the-watercolour-roadmap";
          return (
            <button
              key={course.id}
              onClick={() => handleSelectCourse(course)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                course.id === selectedCourseId
                  ? "bg-[#68705A] text-[#FAF8F2] shadow-sm"
                  : "bg-[#FAF8F2] text-[#6F6B61] hover:text-[#292923] border border-[#464137]/15"
              }`}
            >
              <span>{course.title}</span>
              {isWorkshopTab && (
                <span className="text-[0.62rem] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#C8D1C7]/40 text-[#444C38]">
                  Landing Page
                </span>
              )}
              {course.isActive ? (
                <span className="size-2 rounded-full bg-emerald-400"></span>
              ) : (
                <span className="size-2 rounded-full bg-amber-400"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Changes Saved</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50/90 border border-rose-300 text-xs text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="size-4.5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Update Failed</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Course Content Card */}
      <div className="rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs overflow-hidden">
        {/* Course Banner Info */}
        <div className="p-5 border-b border-[#464137]/10 bg-[#F7F4EC]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {activeCourse?.imagePath && (
              <div className="relative size-14 rounded-lg overflow-hidden border border-[#464137]/20 shrink-0 shadow-2xs">
                <Image
                  src={activeCourse.imagePath}
                  alt={activeCourse.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.68rem] uppercase font-bold tracking-wider text-[#68705A]">
                  Course ID: {activeCourse?.id.slice(0, 8)}...
                </span>
                <span className="text-xs text-[#6F6B61]">·</span>
                <span className="text-[0.68rem] text-[#6F6B61] font-mono">
                  {isLandingPageWorkshop
                    ? "/ (Landing Page Hero)"
                    : `/course/${activeCourse?.slug}`}
                </span>
                {isLandingPageWorkshop && (
                  <span className="text-[0.62rem] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#68705A]/15 text-[#68705A]">
                    Landing Page Masterclass
                  </span>
                )}
              </div>
              <h2 className="font-serif text-xl font-bold text-[#14120E] mt-0.5">
                {activeCourse?.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[0.65rem] uppercase tracking-wider font-bold text-[#6F6B61] block">
                Current Price
              </span>
              <span className="font-serif text-lg font-bold text-[#B93821]">
                ₹{activeCourse?.offerPrice}
              </span>
            </div>
            <a
              href={isLandingPageWorkshop ? "/" : `/course/${activeCourse?.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-[#68705A] hover:underline px-3 py-1.5 rounded-md bg-[#FAF8F2] border border-[#464137]/20 inline-flex items-center gap-1.5"
            >
              <span>{isLandingPageWorkshop ? "View Landing Page" : "View Public Page"}</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        {/* Section Navigation Tabs: ONLY displayed for the 2 multi-week watercolour courses! */}
        {!isLandingPageWorkshop ? (
          <div className="flex border-b border-[#464137]/15 bg-[#FAF8F2] px-4 overflow-x-auto">
            {[
              { id: "basic", label: "1. Basic Info", icon: Info },
              { id: "listing", label: "2. Listing Card", icon: Layers },
              { id: "pricing", label: "3. Pricing", icon: IndianRupee },
              { id: "duration", label: "4. Sessions & Duration", icon: Clock },
              { id: "description", label: "5. Description", icon: FileText },
              { id: "outcomes", label: "6. Learning Outcomes", icon: BookOpen },
              { id: "schedule", label: "7. Schedule", icon: Calendar },
              { id: "cta", label: "8. Additional & CTA", icon: MousePointerClick },
            ].map((tab) => {
              const Icon = tab.icon;
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    isCurrent
                      ? "border-[#68705A] text-[#14120E] font-bold"
                      : "border-transparent text-[#6F6B61] hover:text-[#292923]"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="border-b border-[#464137]/15 bg-[#FAF8F2] px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#68705A]" />
              <span className="text-xs font-bold text-[#14120E] uppercase tracking-wider">
                Landing Page Workshop Box Settings
              </span>
            </div>
            <span className="text-[0.68rem] text-[#6F6B61] italic">
              Controls the Workshop Box directly on the main landing page
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {isLandingPageWorkshop ? (
            <div className="space-y-6">
              {/* Alert helper */}
              <div className="p-4 rounded-xl bg-[#EEE9DE]/60 border border-[#464137]/15 flex items-start gap-3">
                <Sparkles className="size-4.5 text-[#68705A] shrink-0 mt-0.5" />
                <div className="text-xs text-[#3E3A32] leading-relaxed">
                  <p className="font-bold">Landing Page Workshop Manager</p>
                  <p className="mt-0.5 text-[#6F6B61]">
                    This masterclass is featured directly on the main landing page hero. Manage the title, duration (mins), authoritative pricing (MRP and Special Offer Fee), and availability below. All changes immediately reflect in the public hero workshop box.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Workshop Settings Form */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Masterclass Title & Route */}
                  <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 space-y-4">
                    <div className="border-b border-[#464137]/10 pb-2">
                      <h3 className="font-serif text-sm font-bold text-[#14120E]">
                        Workshop Identity & Title
                      </h3>
                      <p className="text-[0.68rem] text-[#6F6B61]">
                        Primary masterclass title displayed on the landing page hero and booking modal.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                        Masterclass Title *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!isEditing}
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                      {fieldErrors.title && (
                        <p className="text-rose-600 text-xs mt-1">
                          {fieldErrors.title[0]}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5 flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          <span>Duration (Minutes) *</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          disabled={!isEditing}
                          value={formData.durationMinutes}
                          onChange={(e) =>
                            handleInputChange("durationMinutes", Number(e.target.value))
                          }
                          className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                        <p className="text-[0.66rem] text-[#6F6B61] mt-1">
                          Reflected as &ldquo;{formData.durationMinutes} mins&rdquo; in the workshop box
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                          Workshop Fee Label
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          placeholder="Complete Live Atelier Access"
                          value={formData.cardPriceLabel}
                          onChange={(e) =>
                            handleInputChange("cardPriceLabel", e.target.value)
                          }
                          className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                        <p className="text-[0.66rem] text-[#6F6B61] mt-1">
                          Badge / note displayed above the pricing
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Authoritative Pricing */}
                  <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 space-y-4">
                    <div className="border-b border-[#464137]/10 pb-2 flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-sm font-bold text-[#14120E] flex items-center gap-1.5">
                          <IndianRupee className="size-3.5 text-[#68705A]" />
                          <span>Authoritative Pricing (INR Rupees)</span>
                        </h3>
                        <p className="text-[0.68rem] text-[#6F6B61]">
                          Live pricing that directly dictates Razorpay payment amounts.
                        </p>
                      </div>
                      {discountPercent > 0 && (
                        <span className="text-[0.68rem] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                          Original MRP Price (₹) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          disabled={!isEditing}
                          value={formData.originalPrice}
                          onChange={(e) =>
                            handleInputChange("originalPrice", Number(e.target.value))
                          }
                          className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                        <p className="text-[0.66rem] text-[#6F6B61] mt-1">
                          Crossed-out anchor price (e.g. ₹{formData.originalPrice})
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5 text-[#B93821]">
                          Special Offer Price (₹) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          disabled={!isEditing}
                          value={formData.offerPrice}
                          onChange={(e) =>
                            handleInputChange("offerPrice", Number(e.target.value))
                          }
                          className="w-full rounded-md border border-[#B93821]/40 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#B93821] font-bold outline-none focus:border-[#B93821] disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                        <p className="text-[0.66rem] text-[#6F6B61] mt-1">
                          Amount charged: ₹{formData.offerPrice} ({internalPaise} paise)
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#EEE9DE]/60 border border-[#464137]/15 flex items-center justify-between text-xs">
                      <span className="text-[#6F6B61]">Learner Savings:</span>
                      <span className="font-bold text-emerald-800">
                        ₹{discountAmount} saved ({discountPercent}% OFF)
                      </span>
                    </div>
                  </div>

                  {/* Availability & Description */}
                  <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!isEditing}
                        checked={formData.isActive}
                        onChange={(e) =>
                          handleInputChange("isActive", e.target.checked)
                        }
                        className="size-4 text-[#68705A] rounded-sm focus:ring-[#68705A]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#14120E]">
                          Masterclass is Active & Accepting Registrations
                        </span>
                        <p className="text-[0.68rem] text-[#6F6B61]">
                          When active, the registration button and modal allow new enrolments.
                        </p>
                      </div>
                    </label>

                    <div className="pt-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                        Supporting Atelier Note (Optional)
                      </label>
                      <textarea
                        rows={2}
                        disabled={!isEditing}
                        placeholder="Live interactive atelier sessions on Zoom with personal feedback and guidance."
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2 text-xs text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Landing Page Visual Preview Matching Screenshot 2 */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[0.7rem] uppercase tracking-wider font-bold text-[#68705A] flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      <span>Live Landing Page Preview</span>
                    </span>
                    <span className="text-[0.62rem] text-[#6F6B61] font-mono bg-[#444C38]/10 px-2 py-0.5 rounded">
                      Hero Workshop Box
                    </span>
                  </div>

                  {/* The exact card from Screenshot 2 */}
                  <div className="group relative overflow-hidden rounded-xl bg-[#FAF8F2]/95 backdrop-blur-md p-4 sm:p-5 border border-[#444C38]/40 shadow-md">
                    {/* Botanical Watercolor Texture Overlay */}
                    <div className="pointer-events-none absolute inset-0 z-0">
                      <Image
                        src="/images/forBox/74fc888bca54b341f924b7f463803851.jpg.jpeg"
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 400px"
                        className="object-cover object-center opacity-30 mix-blend-multiply select-none"
                      />
                      <div className="absolute inset-1 rounded-lg border border-[#444C38]/20 pointer-events-none" />
                    </div>

                    <div className="relative z-10 space-y-3.5">
                      {/* 5 Core Details Grid: Date, Time, Platform, Duration, Language */}
                      <div className="grid grid-cols-2 gap-y-3.5 gap-x-3 text-xs">
                        {/* Date */}
                        <div className="flex items-start gap-2.5 col-span-2">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#444C38]/15 border border-[#444C38]/25 text-[#444C38]">
                            <Calendar className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-[0.62rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                              Date
                            </span>
                            <span className="font-bold text-xs sm:text-[0.84rem] text-[#14120E] leading-tight block">
                              Saturday, 28 October 2026
                            </span>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-start gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#444C38]/15 border border-[#444C38]/25 text-[#444C38]">
                            <Clock className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-[0.62rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                              Time
                            </span>
                            <span className="font-bold text-xs sm:text-[0.84rem] text-[#14120E] leading-tight block">
                              6:30 PM – 8:30 PM IST
                            </span>
                          </div>
                        </div>

                        {/* Platform */}
                        <div className="flex items-start gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#1E3A5F]/15 border border-[#1E3A5F]/25 text-[#132A45]">
                            <Video className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-[0.62rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                              Platform
                            </span>
                            <span className="inline-flex items-center font-bold text-[#132A45] bg-[#1E3A5F]/15 border border-[#1E3A5F]/30 px-2 py-0.5 rounded text-[0.76rem] leading-none">
                              Zoom
                            </span>
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="flex items-start gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#444C38]/15 border border-[#444C38]/25 text-[#444C38]">
                            <Hourglass className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-[0.62rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                              Duration
                            </span>
                            <span className="font-bold text-xs sm:text-[0.84rem] text-[#14120E] leading-tight block">
                              {formData.durationMinutes ? `${formData.durationMinutes} mins` : "130 mins"}
                            </span>
                          </div>
                        </div>

                        {/* Language */}
                        <div className="flex items-start gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#444C38]/15 border border-[#444C38]/25 text-[#444C38]">
                            <Globe className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-[0.62rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none mb-1">
                              Language
                            </span>
                            <span className="font-bold text-xs sm:text-[0.84rem] text-[#353D2A] tracking-wider leading-tight block">
                              HINGLISH
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Workshop Fee Row */}
                      <div className="pt-3 border-t border-[#464137]/15 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[0.64rem] uppercase tracking-[0.14em] font-bold text-[#3E3A32] block leading-none">
                            Workshop Fee:
                          </span>
                          <span className="text-[0.64rem] font-semibold text-[#38352E] mt-0.5 block">
                            {formData.cardPriceLabel || "Complete Live Atelier Access"}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="line-through text-[#6F6B61] text-xs sm:text-sm font-semibold">
                            ₹{formData.originalPrice}
                          </span>
                          <span className="font-serif text-2xl sm:text-[1.85rem] font-extrabold text-[#B93821] tracking-tight">
                            ₹{formData.offerPrice}
                          </span>
                          <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#8E2515] bg-[#B93821]/12 border border-[#B93821]/30 px-2 py-0.5 rounded-sm">
                            SPECIAL OFFER
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#EEE9DE]/60 border border-[#464137]/15 text-[0.68rem] text-[#6F6B61] leading-relaxed">
                    💡 <strong>Live Synchronization:</strong> Changes saved here immediately update the live workshop box and booking checkout on the main landing page.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: BASIC INFORMATION */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div className="border-b border-[#464137]/10 pb-2">
                    <h3 className="font-serif text-base font-bold text-[#14120E]">
                      1. Basic Information
                    </h3>
                    <p className="text-xs text-[#6F6B61]">
                      Core course identifiers and publishing status.
                    </p>
                  </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  {fieldErrors.title && (
                    <p className="text-rose-600 text-xs mt-1">
                      {fieldErrors.title[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Route Slug (URL Identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-mono outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <p className="text-[0.68rem] text-[#6F6B61] mt-1">
                    Route will be accessible at: /course/{formData.slug}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isEditing}
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                    className="size-4 text-[#68705A] rounded-sm focus:ring-[#68705A]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#14120E]">
                      Course is Active & Bookable
                    </span>
                    <p className="text-[0.68rem] text-[#6F6B61]">
                      When active, this course appears in public catalog and
                      accepts new registrations.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* SECTION 2: LISTING CARD CONTENT */}
          {activeTab === "listing" && (
            <div className="space-y-4">
              <div className="border-b border-[#464137]/10 pb-2">
                <h3 className="font-serif text-base font-bold text-[#14120E]">
                  2. Listing Card Content (shown on /course)
                </h3>
                <p className="text-xs text-[#6F6B61]">
                  Configure text and highlights displayed on the public catalog
                  card.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Card Subtitle / Sessions Note
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. 2 Live Sessions • 90 Minutes Each"
                    value={formData.cardSubtitle}
                    onChange={(e) =>
                      handleInputChange("cardSubtitle", e.target.value)
                    }
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Subjects / Topics Covered
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. Materials • Techniques • Colour Mixing • Wash"
                    value={formData.subjects}
                    onChange={(e) =>
                      handleInputChange("subjects", e.target.value)
                    }
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Card Headline / Summary Text
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. Master the Fundamentals of Watercolour Painting"
                  value={formData.cardSummary}
                  onChange={(e) =>
                    handleInputChange("cardSummary", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Card Description (Short summary paragraph)
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditing}
                  placeholder="e.g. A Complete 3-Months Watercolour Learning Journey."
                  value={formData.cardDescription}
                  onChange={(e) =>
                    handleInputChange("cardDescription", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Card Price Display Label (optional prefix)
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. Course Fee: ₹9,990/- or ₹990/-"
                  value={formData.cardPriceLabel}
                  onChange={(e) =>
                    handleInputChange("cardPriceLabel", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: PRICING */}
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="border-b border-[#464137]/10 pb-2">
                <h3 className="font-serif text-base font-bold text-[#14120E]">
                  3. Authoritative Pricing
                </h3>
                <p className="text-xs text-[#6F6B61]">
                  Prices entered here in normal INR Rupees are converted to
                  integer paise and strictly govern Razorpay orders.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Original / MRP Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-[#6F6B61] font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      disabled={!isEditing}
                      value={formData.originalPrice}
                      onChange={(e) =>
                        handleInputChange(
                          "originalPrice",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-bold outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#B93821] mb-1.5">
                    Offer / Selling Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-[#B93821] font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      disabled={!isEditing}
                      value={formData.offerPrice}
                      onChange={(e) =>
                        handleInputChange(
                          "offerPrice",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-md border border-[#B93821]/40 bg-[#F7F4EC] pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-[#B93821] font-bold outline-none focus:border-[#B93821] disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Price Calculation Widget */}
              <div className="p-4 rounded-lg bg-[#FAF8F2] border border-[#464137]/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-[#6F6B61] block">
                    Customer Pays
                  </span>
                  <span className="font-serif text-lg font-bold text-[#B93821]">
                    ₹{offer}
                  </span>
                </div>
                <div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-[#6F6B61] block">
                    Original Price
                  </span>
                  <span className="line-through text-xs font-medium text-[#6F6B61]">
                    ₹{original}
                  </span>
                </div>
                <div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-[#6F6B61] block">
                    Discount
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {discountPercent}% OFF (Save ₹{discountAmount})
                  </span>
                </div>
                <div>
                  <span className="text-[0.65rem] uppercase tracking-wider text-[#6F6B61] block">
                    Razorpay Paise
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#14120E]">
                    {internalPaise.toLocaleString()} paise
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DURATION & SESSION INFORMATION */}
          {activeTab === "duration" && (
            <div className="space-y-4">
              <div className="border-b border-[#464137]/10 pb-2">
                <h3 className="font-serif text-base font-bold text-[#14120E]">
                  4. Duration & Session Information
                </h3>
                <p className="text-xs text-[#6F6B61]">
                  Specify duration labels and session counts displayed on the
                  course cards and detail pages.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Session Count Text
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. 2 Live Interactive Sessions or 24 Live Classes"
                    value={formData.sessionCountText}
                    onChange={(e) =>
                      handleInputChange("sessionCountText", e.target.value)
                    }
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Session Duration Text
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. 90 Minutes Each"
                    value={formData.sessionDurationText}
                    onChange={(e) =>
                      handleInputChange("sessionDurationText", e.target.value)
                    }
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Total Duration in Minutes (Internal DB value) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    disabled={!isEditing}
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      handleInputChange(
                        "durationMinutes",
                        parseInt(e.target.value) || 120
                      )
                    }
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Course Duration in Months / Weeks
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. 3 Months or 1 Week"
                    value={formData.durationMonthsText}
                    onChange={(e) =>
                      handleInputChange("durationMonthsText", e.target.value)
                    }
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: COURSE DESCRIPTION */}
          {activeTab === "description" && (
            <div className="space-y-4">
              <div className="border-b border-[#464137]/10 pb-2">
                <h3 className="font-serif text-base font-bold text-[#14120E]">
                  5. Course Description
                </h3>
                <p className="text-xs text-[#6F6B61]">
                  The detailed course overview displayed prominently at the top
                  of the course detail page.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Full Description *
                </label>
                <textarea
                  rows={6}
                  disabled={!isEditing}
                  placeholder="Enter the complete course description..."
                  value={formData.fullDescription}
                  onChange={(e) =>
                    handleInputChange("fullDescription", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium leading-relaxed outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* SECTION 6: LEARNING OUTCOMES */}
          {activeTab === "outcomes" && (
            <div className="space-y-4">
              <div className="border-b border-[#464137]/10 pb-2">
                <h3 className="font-serif text-base font-bold text-[#14120E]">
                  6. Learning Outcomes (“What You’ll Learn”)
                </h3>
                <p className="text-xs text-[#6F6B61]">
                  Manage the heading and individual syllabus bullet items.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. What You’ll Learn"
                    value={formData.learningOutcomesHeading}
                    onChange={(e) =>
                      handleInputChange(
                        "learningOutcomesHeading",
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                    Subheading / Major Subjects Note
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g. Landscape | Still Life | Floral"
                    value={formData.learningOutcomesSubheading}
                    onChange={(e) =>
                      handleInputChange(
                        "learningOutcomesSubheading",
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Repeatable List of Learning Outcomes */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A]">
                    Curriculum Bullet Items ({formData.learningOutcomes.length})
                  </label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleAddLearningOutcome}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:text-[#575E4B] bg-[#EBE7DC] px-2.5 py-1 rounded-md"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Item</span>
                    </button>
                  )}
                </div>

                {formData.learningOutcomes.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#6F6B61] w-6 shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={item}
                      onChange={(e) =>
                        handleUpdateLearningOutcome(idx, e.target.value)
                      }
                      className="flex-1 rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                      placeholder={`Curriculum item ${idx + 1}`}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLearningOutcome(idx)}
                        className="text-[#6F6B61] hover:text-rose-600 p-1.5 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}

                {formData.learningOutcomes.length === 0 && (
                  <p className="text-xs text-[#6F6B61] italic py-2">
                    No curriculum items added yet. Click &quot;Add Item&quot; to
                    add one.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SECTION 7: SCHEDULE */}
          {activeTab === "schedule" && (
            <div className="space-y-4">
              <div className="border-b border-[#464137]/10 pb-2">
                <h3 className="font-serif text-base font-bold text-[#14120E]">
                  7. Schedule & Class Breakdown
                </h3>
                <p className="text-xs text-[#6F6B61]">
                  Specify schedule items (e.g. 2 Foundation Classes, 18 Demo
                  Classes, etc.).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Schedule Section Heading
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. 3 Months | 24 Live Classes"
                  value={formData.scheduleHeading}
                  onChange={(e) =>
                    handleInputChange("scheduleHeading", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* Repeatable Schedule Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A]">
                    Schedule Breakdown Items ({formData.scheduleItems.length})
                  </label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleAddScheduleItem}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#68705A] hover:text-[#575E4B] bg-[#EBE7DC] px-2.5 py-1 rounded-md"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Schedule Row</span>
                    </button>
                  )}
                </div>

                {formData.scheduleItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-[#464137]/15 bg-[#FAF8F2] space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#68705A]">
                        Class / Session {idx + 1}
                      </span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleItem(idx)}
                          className="text-[#6F6B61] hover:text-rose-600 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={item.label}
                        onChange={(e) =>
                          handleUpdateScheduleItem(idx, "label", e.target.value)
                        }
                        className="rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3 py-1.5 text-xs font-bold text-[#14120E] outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                        placeholder="e.g. 2 Foundation Classes"
                      />
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={item.detail}
                        onChange={(e) =>
                          handleUpdateScheduleItem(
                            idx,
                            "detail",
                            e.target.value
                          )
                        }
                        className="sm:col-span-2 rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3 py-1.5 text-xs text-[#14120E] outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                        placeholder="e.g. to build a strong understanding of basics"
                      />
                    </div>
                  </div>
                ))}

                {formData.scheduleItems.length === 0 && (
                  <p className="text-xs text-[#6F6B61] italic py-2">
                    No schedule breakdown items configured yet.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Supporting Note (Displayed below schedule)
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditing}
                  placeholder="e.g. The detailed class schedule will be shared every month after enrolment."
                  value={formData.scheduleNote}
                  onChange={(e) =>
                    handleInputChange("scheduleNote", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* SECTION 8: ADDITIONAL CONTENT & CTA */}
          {activeTab === "cta" && (
            <div className="space-y-4">
              <div className="border-b border-[#464137]/10 pb-2">
                <h3 className="font-serif text-base font-bold text-[#14120E]">
                  8. Additional Content & Enrolment CTA
                </h3>
                <p className="text-xs text-[#6F6B61]">
                  Configure the &quot;Why This Course?&quot; section and booking
                  button text.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  “Why This Course?” Heading
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. Why This Course?"
                  value={formData.whyHeading}
                  onChange={(e) =>
                    handleInputChange("whyHeading", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  “Why This Course?” Detailed Explanation
                </label>
                <textarea
                  rows={4}
                  disabled={!isEditing}
                  placeholder="Starting watercolour can be confusing..."
                  value={formData.whyDescription}
                  onChange={(e) =>
                    handleInputChange("whyDescription", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-medium leading-relaxed outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Callout / Bold Highlight Statement
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. A strong foundation before you start creating."
                  value={formData.whyCallout}
                  onChange={(e) =>
                    handleInputChange("whyCallout", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-bold outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Primary Enrolment CTA Button Text
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g. Enrol in Foundation Course"
                  value={formData.ctaText}
                  onChange={(e) =>
                    handleInputChange("ctaText", e.target.value)
                  }
                  className="w-full rounded-md border border-[#464137]/20 bg-[#F7F4EC] px-3.5 py-2.5 text-xs sm:text-sm text-[#14120E] font-bold outline-none focus:border-[#68705A] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </>
      )}

          {/* Form Actions Footer */}
          {isEditing && (
            <div className="pt-4 border-t border-[#464137]/15 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg border border-[#464137]/25 text-[#6F6B61] text-xs font-semibold hover:bg-[#F7F4EC] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#68705A] text-[#FAF8F2] text-xs font-bold hover:bg-[#575E4B] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" />
                    <span>
                      {isLandingPageWorkshop
                        ? "Save Workshop Details"
                        : "Save Course Updates"}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {!isEditing && !isReadOnly && isLandingPageWorkshop && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#68705A] text-[#FAF8F2] text-xs font-semibold hover:bg-[#575E4B] transition-colors shadow-xs cursor-pointer"
              >
                <Edit3 className="size-3.5" />
                <span>Edit Workshop Details</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
