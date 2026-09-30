"use client";

import React, { useState } from "react";
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
  ShieldCheck,
  Percent,
} from "lucide-react";
import { AdminCourseData } from "@/lib/courses-admin/service";

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

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: activeCourse?.title || "",
    slug: activeCourse?.slug || "",
    description: activeCourse?.description || "",
    durationMinutes: activeCourse?.durationMinutes || 120,
    originalPrice: activeCourse?.originalPrice || 599,
    offerPrice: activeCourse?.offerPrice || 199,
    currency: "INR" as const,
    isActive: activeCourse?.isActive ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Reset form when switching courses
  const handleSelectCourse = (course: AdminCourseData) => {
    setSelectedCourseId(course.id);
    setFormData({
      title: course.title,
      slug: course.slug,
      description: course.description || "",
      durationMinutes: course.durationMinutes,
      originalPrice: course.originalPrice,
      offerPrice: course.offerPrice,
      currency: "INR",
      isActive: course.isActive,
    });
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
      setFormData({
        title: activeCourse.title,
        slug: activeCourse.slug,
        description: activeCourse.description || "",
        durationMinutes: activeCourse.durationMinutes,
        originalPrice: activeCourse.originalPrice,
        offerPrice: activeCourse.offerPrice,
        currency: "INR",
        isActive: activeCourse.isActive,
      });
    }
    setIsEditing(false);
    setErrorMessage(null);
    setFieldErrors({});
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

    // Client-side quick checks
    if (!formData.title.trim()) {
      setErrorMessage("Course title is required.");
      return;
    }
    if (!formData.slug.trim()) {
      setErrorMessage("Course slug is required.");
      return;
    }
    if (offer > original) {
      setErrorMessage("Offer price (₹) cannot be higher than original MRP price (₹).");
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch(`/api/admin/courses/${activeCourse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          durationMinutes: Number(formData.durationMinutes),
          originalPrice: Number(formData.originalPrice),
          offerPrice: Number(formData.offerPrice),
          currency: "INR",
          isActive: formData.isActive,
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

      setSuccessMessage("Course details and pricing updated successfully! Future bookings will use the new price.");
      setIsEditing(false);

      // Update state with saved course
      if (data.course) {
        setCourses((prev) =>
          prev.map((c) => (c.id === data.course.id ? { ...c, ...data.course } : c))
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
              <span>Workshop Curriculum & Pricing</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#292923]">
              Course / Workshop Management
            </h1>
            <p className="text-xs text-[#6F6B61] mt-1 max-w-2xl leading-relaxed">
              Manage the active masterclass details, title, duration, and authoritative
              selling price. Prices entered here are converted to integer paise and serve
              as the authoritative single source of truth for new bookings and Razorpay orders.
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
                <span>Edit Course</span>
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

      {/* Multiple Course Tabs if more than one course exists */}
      {courses.length > 1 && (
        <div className="flex items-center gap-2 border-b border-[#464137]/15 pb-2 overflow-x-auto">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => handleSelectCourse(course)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                course.id === selectedCourseId
                  ? "bg-[#68705A] text-[#FAF8F2] shadow-xs"
                  : "bg-[#FAF8F2] text-[#6F6B61] hover:text-[#292923] border border-[#464137]/15"
              }`}
            >
              <span>{course.title}</span>
              {course.isActive && (
                <span className="size-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 text-xs text-emerald-900 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50/90 border border-rose-300 text-xs text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Course Information */}
        <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#464137]/10 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-[#68705A]" />
              <h2 className="font-bold text-sm text-[#292923] uppercase tracking-wider">
                Course Information
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider ${
                  formData.isActive
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-gray-200 text-gray-700 border border-gray-300"
                }`}
              >
                {formData.isActive ? "● Active Course" : "○ Inactive"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-[#292923] uppercase tracking-wider">
                Course Title *
              </label>
              <input
                type="text"
                disabled={!isEditing || isReadOnly}
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g. The WATERCOLOUR Roadmap: One-Day Masterclass"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-xs text-[#292923] transition-colors ${
                  !isEditing
                    ? "bg-[#F7F4EC] border-[#464137]/15 cursor-default font-medium"
                    : "bg-white border-[#68705A] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                }`}
              />
              {fieldErrors.title && (
                <p className="text-[0.7rem] text-rose-600 font-medium">
                  {fieldErrors.title[0]}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#292923] uppercase tracking-wider">
                Course Slug *
              </label>
              <input
                type="text"
                disabled={!isEditing || isReadOnly}
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value.toLowerCase())}
                placeholder="e.g. watercolor-masterclass"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-xs font-mono text-[#292923] transition-colors ${
                  !isEditing
                    ? "bg-[#F7F4EC] border-[#464137]/15 cursor-default"
                    : "bg-white border-[#68705A] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                }`}
              />
              <p className="text-[0.68rem] text-[#6F6B61]">
                Used for URL identifiers and database indexing. Lowercase letters, numbers, and hyphens only.
              </p>
              {fieldErrors.slug && (
                <p className="text-[0.7rem] text-rose-600 font-medium">
                  {fieldErrors.slug[0]}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#292923] uppercase tracking-wider">
                Duration (Minutes) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="15"
                  step="5"
                  disabled={!isEditing || isReadOnly}
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    handleInputChange("durationMinutes", parseInt(e.target.value, 10) || 0)
                  }
                  className={`w-full rounded-lg border pl-9 pr-3.5 py-2.5 text-xs text-[#292923] transition-colors ${
                    !isEditing
                      ? "bg-[#F7F4EC] border-[#464137]/15 cursor-default font-medium"
                      : "bg-white border-[#68705A] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                  }`}
                />
                <Clock className="absolute left-3 top-2.5 size-4 text-[#6F6B61]" />
              </div>
              <p className="text-[0.68rem] text-[#6F6B61]">
                Equivalent to:{" "}
                <span className="font-semibold text-[#292923]">
                  {Math.floor(formData.durationMinutes / 60)}h{" "}
                  {formData.durationMinutes % 60}m
                </span>
              </p>
              {fieldErrors.durationMinutes && (
                <p className="text-[0.7rem] text-rose-600 font-medium">
                  {fieldErrors.durationMinutes[0]}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-[#292923] uppercase tracking-wider">
                Course Description
              </label>
              <textarea
                rows={3}
                disabled={!isEditing || isReadOnly}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Overview of the workshop curriculum, student target audience, and key learning outcomes..."
                className={`w-full rounded-lg border px-3.5 py-2.5 text-xs text-[#292923] leading-relaxed transition-colors ${
                  !isEditing
                    ? "bg-[#F7F4EC] border-[#464137]/15 cursor-default font-medium"
                    : "bg-white border-[#68705A] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                }`}
              />
            </div>

            {/* Active Status Toggle */}
            <div className="md:col-span-2 pt-2 border-t border-[#464137]/10 flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-[#292923]">
                  Course Enrollment Status
                </label>
                <p className="text-[0.68rem] text-[#6F6B61]">
                  When active, new students can book cohorts for this course. Inactive courses hide booking access.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isEditing || isReadOnly}
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange("isActive", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#68705A] disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Authoritative Pricing Rules */}
        <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#464137]/10 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-[#68705A]" />
              <h2 className="font-bold text-sm text-[#292923] uppercase tracking-wider">
                Authoritative Pricing Rules
              </h2>
            </div>
            <span className="text-[0.68rem] font-mono font-bold text-[#68705A] bg-[#C8D1C7]/30 border border-[#68705A]/20 px-2 py-0.5 rounded-sm">
              Currency: INR (₹)
            </span>
          </div>

          {/* Pricing Architecture Explanation Callout */}
          <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61] flex items-start gap-3">
            <Info className="size-4 text-[#68705A] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[#292923]">
                Single Source of Truth for Payments & Razorpay:
              </p>
              <p>
                Enter standard whole INR amounts (e.g. ₹599 and ₹199). The system
                automatically converts them to integer paise (<strong>{internalPaise} paise</strong>)
                and stores them securely in Supabase.
              </p>
              <p className="text-[0.7rem] text-[#68705A] font-semibold">
                🔒 Any price change immediately applies to NEW bookings and Razorpay orders.
                Existing orders and already-completed payments are never modified.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Original MRP Price */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#292923] uppercase tracking-wider">
                Original / MRP Price (₹) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  disabled={!isEditing || isReadOnly}
                  value={formData.originalPrice}
                  onChange={(e) =>
                    handleInputChange("originalPrice", parseInt(e.target.value, 10) || 0)
                  }
                  placeholder="599"
                  className={`w-full rounded-lg border pl-9 pr-3.5 py-2.5 text-xs text-[#292923] font-mono transition-colors ${
                    !isEditing
                      ? "bg-[#F7F4EC] border-[#464137]/15 cursor-default font-bold text-sm"
                      : "bg-white border-[#68705A] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                  }`}
                />
                <IndianRupee className="absolute left-3 top-2.5 size-4 text-[#6F6B61]" />
              </div>
              <p className="text-[0.68rem] text-[#6F6B61]">
                Stored internally as:{" "}
                <span className="font-mono font-semibold text-[#292923]">
                  {Math.round(original * 100)} paise
                </span>
              </p>
              {fieldErrors.originalPrice && (
                <p className="text-[0.7rem] text-rose-600 font-medium">
                  {fieldErrors.originalPrice[0]}
                </p>
              )}
            </div>

            {/* Offer / Selling Price */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#292923] uppercase tracking-wider">
                Offer / Selling Price (₹) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  disabled={!isEditing || isReadOnly}
                  value={formData.offerPrice}
                  onChange={(e) =>
                    handleInputChange("offerPrice", parseInt(e.target.value, 10) || 0)
                  }
                  placeholder="199"
                  className={`w-full rounded-lg border pl-9 pr-3.5 py-2.5 text-xs text-[#292923] font-mono transition-colors ${
                    !isEditing
                      ? "bg-[#F7F4EC] border-[#464137]/15 cursor-default font-bold text-sm text-[#B93821]"
                      : "bg-white border-[#68705A] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                  }`}
                />
                <IndianRupee className="absolute left-3 top-2.5 size-4 text-[#B93821]" />
              </div>
              <p className="text-[0.68rem] text-[#6F6B61]">
                Stored internally as:{" "}
                <span className="font-mono font-semibold text-[#B93821]">
                  {internalPaise} paise
                </span>{" "}
                (Razorpay LIVE Order Amount)
              </p>
              {fieldErrors.offerPrice && (
                <p className="text-[0.7rem] text-rose-600 font-medium">
                  {fieldErrors.offerPrice[0]}
                </p>
              )}
            </div>
          </div>

          {/* Live Discount & Summary Card */}
          <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#6F6B61]">
                Live Customer Price Preview
              </span>
              <div className="flex items-baseline gap-2">
                <span className="line-through text-xs font-semibold text-[#6F6B61]">
                  ₹{original}
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#B93821]">
                  ₹{offer}
                </span>
                {discountPercent > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-[#B93821]/10 px-2 py-0.5 text-[0.65rem] font-bold text-[#8E2515] border border-[#B93821]/20">
                    <Percent className="size-3" />
                    <span>{discountPercent}% OFF • Student saves ₹{discountAmount}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-right sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#464137]/10">
              <span className="block text-[0.68rem] font-semibold text-[#6F6B61]">
                Authoritative Razorpay Amount
              </span>
              <span className="font-mono text-sm font-bold text-[#292923]">
                {internalPaise} paise (₹{offer}.00)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {isEditing && !isReadOnly && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-lg border border-[#464137]/20 text-xs font-semibold text-[#6F6B61] hover:text-[#292923] hover:bg-[#FAF8F2] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#68705A] text-[#FAF8F2] text-xs font-semibold hover:bg-[#575E4B] transition-colors shadow-xs disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="size-3.5 border-2 border-[#FAF8F2] border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Save Course & Pricing</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
