"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Hourglass,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
  Layers,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  formatBatchDateIST,
  formatBatchTimeIST,
  isRegistrationDeadlineExpired,
} from "@/lib/batches-admin/format";

interface BatchFormData {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  batchName: string;
  startDate: string;
  endDate: string;
  lastRegistrationDate: string;
  startTime: string;
  endTime: string;
  status: "open" | "closed" | "upcoming" | "completed";
  totalSeats: number;
  seatsBooked: number;
}

interface AdminBatchScheduleManagerProps {
  initialCourseId?: string;
  userRole?: "super_admin" | "admin" | "editor";
  onBatchUpdated?: (batch: any) => void;
}

export function AdminBatchScheduleManager({
  initialCourseId,
  userRole = "admin",
  onBatchUpdated,
}: AdminBatchScheduleManagerProps) {
  const isReadOnly = userRole === "editor";

  // The two core watercolor courses
  const COURSES = [
    {
      id: "e1111111-2222-3333-4444-555555555555",
      title: "WATERCOLOUR FOUNDATION",
      slug: "watercolour-foundation",
      defaultTiming: "6:30 PM",
      defaultEndTime: "8:00 PM",
    },
    {
      id: "e2222222-2222-3333-4444-555555555555",
      title: "WATERCOLOUR ARTISTRY + FOUNDATION COURSE",
      slug: "watercolour-artistry-foundation",
      defaultTiming: "6:30 PM",
      defaultEndTime: "8:00 PM",
    },
  ];

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourseId || COURSES[0].id
  );

  const activeCourse =
    COURSES.find((c) => c.id === selectedCourseId) || COURSES[0];

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<BatchFormData>({
    id: "",
    courseId: activeCourse.id,
    courseTitle: activeCourse.title,
    courseSlug: activeCourse.slug,
    batchName: "",
    startDate: "",
    endDate: "",
    lastRegistrationDate: "",
    startTime: activeCourse.defaultTiming,
    endTime: activeCourse.defaultEndTime,
    status: "open",
    totalSeats: 100,
    seatsBooked: 0,
  });

  const [originalData, setOriginalData] = useState<BatchFormData | null>(null);

  // Fetch batch for selected course
  const loadBatch = async (courseId: string) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch(`/api/admin/batches?courseId=${encodeURIComponent(courseId)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data?.success && data?.batch) {
        const b = data.batch;
        const initialForm: BatchFormData = {
          id: b.id,
          courseId: b.courseId,
          courseTitle: b.courseTitle || activeCourse.title,
          courseSlug: b.courseSlug || activeCourse.slug,
          batchName: b.batchName || "",
          startDate: b.startDate || "",
          endDate: b.endDate || "",
          lastRegistrationDate: b.lastRegistrationDate || b.startDate || "",
          startTime: b.startTime || "6:30 PM",
          endTime: b.endTime || "8:00 PM",
          status: b.status || (b.isEnrollmentOpen ? "open" : "closed"),
          totalSeats: b.totalSeats || 100,
          seatsBooked: b.seatsBooked || 0,
        };
        setFormData(initialForm);
        setOriginalData(initialForm);
      } else {
        // Fallback default structure
        const defaultForm: BatchFormData = {
          id: "",
          courseId,
          courseTitle: activeCourse.title,
          courseSlug: activeCourse.slug,
          batchName: `${activeCourse.title} — Upcoming Live Batch`,
          startDate: "2026-11-01",
          endDate: "2026-11-02",
          lastRegistrationDate: "2026-11-01",
          startTime: "6:30 PM",
          endTime: "8:00 PM",
          status: "open",
          totalSeats: 100,
          seatsBooked: 0,
        };
        setFormData(defaultForm);
        setOriginalData(defaultForm);
      }
    } catch {
      setErrorMessage("Failed to load batch schedule from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatch(selectedCourseId);
  }, [selectedCourseId]);

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const handleInputChange = (field: keyof BatchFormData, value: any) => {
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

  const handleReset = () => {
    if (originalData) {
      setFormData(originalData);
      setFieldErrors({});
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    // Client-side Validation
    const errors: Record<string, string> = {};
    if (!formData.batchName.trim()) {
      errors.batchName = "Batch name is required.";
    }
    if (!formData.startDate) {
      errors.startDate = "Batch start date is required.";
    }
    if (!formData.lastRegistrationDate) {
      errors.lastRegistrationDate = "Last date for registration is required.";
    }
    if (!formData.startTime.trim()) {
      errors.startTime = "Batch start time is required.";
    }

    // Critical Constraint: The registration deadline must not be earlier than the batch start date.
    if (formData.lastRegistrationDate && formData.startDate) {
      if (formData.lastRegistrationDate < formData.startDate) {
        errors.lastRegistrationDate =
          "The registration deadline must not be earlier than the batch start date.";
      }
    }

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      errors.endDate = "Batch end date cannot be earlier than start date.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage(Object.values(errors)[0]);
      return;
    }

    if (!formData.id) {
      setErrorMessage("Batch record ID is not found. Please reload.");
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch(`/api/admin/batches/${encodeURIComponent(formData.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName: formData.batchName.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          lastRegistrationDate: formData.lastRegistrationDate,
          startTime: formData.startTime.trim(),
          endTime: formData.endTime ? formData.endTime.trim() : null,
          status: formData.status,
          totalSeats: Number(formData.totalSeats) || 100,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result?.success) {
        if (result?.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.fieldErrors)) {
            if (Array.isArray(v) && v[0]) mapped[k] = v[0] as string;
          }
          setFieldErrors(mapped);
        }
        throw new Error(result?.error || "Failed to update batch schedule.");
      }

      setSuccessMessage(
        `Batch schedule for ${formData.courseTitle} updated successfully! Public course routes updated.`
      );
      setOriginalData({ ...formData });

      if (onBatchUpdated) {
        onBatchUpdated(result.batch);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save batch changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const isExpired = isRegistrationDeadlineExpired(formData.lastRegistrationDate);
  const isClosed =
    formData.status === "closed" ||
    formData.status === "completed" ||
    isExpired;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
              <Calendar className="size-3" />
              <span>Cohort Scheduling Engine</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#292923]">
              Dynamic Batch & Schedule Management
            </h2>
            <p className="text-xs text-[#6F6B61] mt-1 max-w-2xl">
              Configure live workshop start dates, registration deadlines, and atelier batch timings.
              Changes persist authoritatively in Supabase and reflect instantly on public course cards and booking modals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/course/${activeCourse.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#464137]/20 text-xs font-semibold text-[#464137] hover:bg-[#F7F4EC] transition-colors"
            >
              <span>View Public Page</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        {/* Course Switcher Pills */}
        <div className="mt-5 flex flex-wrap gap-2.5 pt-4 border-t border-[#464137]/10">
          {COURSES.map((course) => {
            const isSelected = course.id === selectedCourseId;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => handleSelectCourse(course.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#68705A] text-[#FAF8F2] shadow-sm ring-2 ring-[#68705A]/30"
                    : "bg-[#F7F4EC] text-[#464137] hover:bg-[#EBE7DC] border border-[#464137]/15"
                }`}
              >
                <GraduationCap className="size-3.5" />
                <span>{course.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form Column */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSave}
            className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#464137]/10 pb-3">
              <div>
                <span className="text-[0.66rem] uppercase font-bold tracking-wider text-[#68705A] block">
                  Editing Schedule For
                </span>
                <h3 className="font-serif text-lg font-bold text-[#292923]">
                  {activeCourse.title}
                </h3>
              </div>

              {isReadOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-[#E6DFD3] text-[#464137]">
                  <Lock className="size-3" />
                  Read-Only
                </span>
              )}
            </div>

            {/* Success Alert */}
            {successMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#3E522D]/10 border border-[#3E522D]/30 text-xs text-[#2A371F] font-semibold">
                <CheckCircle2 className="size-4 text-[#3E522D] shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-900 font-semibold">
                <AlertCircle className="size-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 text-center text-xs text-[#6F6B61] space-y-2">
                <div className="size-6 border-2 border-[#68705A] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading batch schedule details...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Batch Name */}
                <div>
                  <label className="block text-xs font-bold text-[#292923] mb-1">
                    Batch Name / Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formData.batchName}
                    onChange={(e) => handleInputChange("batchName", e.target.value)}
                    placeholder="e.g. Watercolour Foundation — Upcoming Live Batch"
                    className={`w-full rounded-lg bg-[#F7F4EC] border px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A] ${
                      fieldErrors.batchName
                        ? "border-rose-400 bg-rose-50/50"
                        : "border-[#464137]/20"
                    }`}
                  />
                  {fieldErrors.batchName && (
                    <p className="text-[0.7rem] text-rose-600 font-medium mt-1">
                      {fieldErrors.batchName}
                    </p>
                  )}
                </div>

                {/* 2. Dates Row: Batch Start Date & Last Registration Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Batch Start Date */}
                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Batch Start Date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className={`w-full rounded-lg bg-[#F7F4EC] border px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A] ${
                        fieldErrors.startDate
                          ? "border-rose-400 bg-rose-50/50"
                          : "border-[#464137]/20"
                      }`}
                    />
                    {fieldErrors.startDate && (
                      <p className="text-[0.7rem] text-rose-600 font-medium mt-1">
                        {fieldErrors.startDate}
                      </p>
                    )}
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5 block">
                      IST Display: {formatBatchDateIST(formData.startDate)}
                    </span>
                  </div>

                  {/* Last Registration Date */}
                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Last Date for Registration <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.lastRegistrationDate}
                      onChange={(e) =>
                        handleInputChange("lastRegistrationDate", e.target.value)
                      }
                      className={`w-full rounded-lg bg-[#F7F4EC] border px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A] ${
                        fieldErrors.lastRegistrationDate
                          ? "border-rose-400 bg-rose-50/50"
                          : "border-[#464137]/20"
                      }`}
                    />
                    {fieldErrors.lastRegistrationDate && (
                      <p className="text-[0.7rem] text-rose-600 font-medium mt-1">
                        {fieldErrors.lastRegistrationDate}
                      </p>
                    )}
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5 block">
                      IST Display: {formatBatchDateIST(formData.lastRegistrationDate)}
                    </span>
                  </div>
                </div>

                {/* 3. Timings Row: Start Time & End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Batch Start Time <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.startTime}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                      placeholder="e.g. 6:30 PM"
                      className={`w-full rounded-lg bg-[#F7F4EC] border px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A] ${
                        fieldErrors.startTime
                          ? "border-rose-400 bg-rose-50/50"
                          : "border-[#464137]/20"
                      }`}
                    />
                    {fieldErrors.startTime && (
                      <p className="text-[0.7rem] text-rose-600 font-medium mt-1">
                        {fieldErrors.startTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Batch End Time
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.endTime}
                      onChange={(e) => handleInputChange("endTime", e.target.value)}
                      placeholder="e.g. 8:00 PM"
                      className="w-full rounded-lg bg-[#F7F4EC] border border-[#464137]/20 px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                    />
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5 block">
                      IST Display: {formatBatchTimeIST(formData.startTime, formData.endTime)}
                    </span>
                  </div>
                </div>

                {/* 4. Batch Status & Total Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Batch Status <span className="text-rose-600">*</span>
                    </label>
                    <select
                      disabled={isReadOnly}
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange(
                          "status",
                          e.target.value as "open" | "closed" | "upcoming" | "completed"
                        )
                      }
                      className="w-full rounded-lg bg-[#F7F4EC] border border-[#464137]/20 px-3 py-2 text-xs text-[#292923] font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                    >
                      <option value="open">🟢 Open for Registration</option>
                      <option value="upcoming">🟡 Upcoming (Announced)</option>
                      <option value="closed">🔴 Registration Closed</option>
                      <option value="completed">⚪ Completed</option>
                    </select>
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5 block">
                      Controls whether the booking engine accepts payments.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Total Seat Capacity
                    </label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={formData.totalSeats}
                      min={1}
                      max={1000}
                      onChange={(e) =>
                        handleInputChange("totalSeats", parseInt(e.target.value) || 100)
                      }
                      className="w-full rounded-lg bg-[#F7F4EC] border border-[#464137]/20 px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                    />
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5 block">
                      Booked: {formData.seatsBooked} • Remaining:{" "}
                      {Math.max(0, formData.totalSeats - formData.seatsBooked)}
                    </span>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-[#464137]/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isReadOnly || isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#464137]/20 text-xs font-semibold text-[#464137] hover:bg-[#EBE7DC] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Reset Changes</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isReadOnly || isSaving}
                    className="btn-studio px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <div className="size-3.5 border-2 border-[#FAF8F2] border-t-transparent rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="size-3.5" />
                        <span>Save Batch Schedule</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[0.66rem] uppercase tracking-wider font-bold text-[#68705A]">
                Live Public Card Preview
              </span>
              <span className="text-[0.62rem] font-bold text-[#3E522D] bg-[#3E522D]/10 px-2 py-0.5 rounded">
                Real-Time Preview
              </span>
            </div>

            <p className="text-xs text-[#6F6B61]">
              This is how students will see the schedule on <strong>/course</strong> and <strong>/course/{activeCourse.slug}</strong>:
            </p>

            {/* Rendered Badge Preview */}
            <div className="group/sched relative overflow-hidden rounded-xl bg-[#FAF8F2] border border-[#444C38]/30 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-[#444C38]/15 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#444C38] animate-pulse" />
                  <span className="text-[0.66rem] uppercase tracking-wider font-bold text-[#444C38]">
                    {formData.batchName || `${activeCourse.title} Live Cohort`}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[0.62rem] font-bold uppercase tracking-wider ${
                    isClosed
                      ? "bg-[#6F6B61]/15 text-[#6F6B61] border border-[#6F6B61]/25"
                      : "bg-[#3E522D]/15 text-[#3E522D] border border-[#3E522D]/30"
                  }`}
                >
                  {isClosed ? "Registration Closed" : "Open for Registration"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs">
                {/* Batch Starting Date */}
                <div className="flex items-start gap-2.5">
                  <div className="size-7 rounded-md bg-[#444C38]/12 border border-[#444C38]/20 flex items-center justify-center text-[#444C38] shrink-0 mt-0.5">
                    <Calendar className="size-3.5" />
                  </div>
                  <div>
                    <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none mb-1">
                      Batch Starting Date
                    </span>
                    <span className="font-bold text-[#14120E] text-xs block">
                      {formatBatchDateIST(formData.startDate)}
                    </span>
                  </div>
                </div>

                {/* Last Date for Registration */}
                <div className="flex items-start gap-2.5">
                  <div className="size-7 rounded-md bg-[#B93821]/10 border border-[#B93821]/20 flex items-center justify-center text-[#B93821] shrink-0 mt-0.5">
                    <Hourglass className="size-3.5" />
                  </div>
                  <div>
                    <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none mb-1">
                      Last Date for Registration
                    </span>
                    <span
                      className={`font-bold text-xs block ${
                        isClosed ? "text-[#6F6B61] line-through" : "text-[#B93821]"
                      }`}
                    >
                      {formatBatchDateIST(formData.lastRegistrationDate)}
                    </span>
                  </div>
                </div>

                {/* Batch Timing */}
                <div className="flex items-start gap-2.5">
                  <div className="size-7 rounded-md bg-[#1E3A5F]/10 border border-[#1E3A5F]/20 flex items-center justify-center text-[#1E3A5F] shrink-0 mt-0.5">
                    <Clock className="size-3.5" />
                  </div>
                  <div>
                    <span className="text-[0.62rem] uppercase tracking-wider font-bold text-[#6F6B61] block leading-none mb-1">
                      Batch Timing (IST)
                    </span>
                    <span className="font-bold text-[#14120E] text-xs block">
                      {formatBatchTimeIST(formData.startTime, formData.endTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Simulation */}
              <div className="pt-2 border-t border-[#444C38]/15 flex items-center gap-2">
                <div className="flex-1 text-center py-2 rounded-md border border-[#444C38]/30 text-[0.72rem] font-bold text-[#444C38]">
                  Learn More
                </div>
                <div
                  className={`flex-1 text-center py-2 rounded-md text-[0.72rem] font-bold ${
                    isClosed
                      ? "bg-[#6F6B61]/15 text-[#6F6B61] cursor-not-allowed"
                      : "btn-studio shadow-xs"
                  }`}
                >
                  {isClosed ? "Registration Closed" : "Enrol Now"}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Rules Card */}
          <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 text-xs text-[#6F6B61] space-y-2">
            <span className="font-bold text-[#292923] block text-xs">
              📌 Atelier Validation Rules
            </span>
            <ul className="list-disc list-inside space-y-1 text-[0.72rem]">
              <li>The registration deadline must not be earlier than the batch start date.</li>
              <li>Times are formatted with the official India timezone (Asia/Kolkata).</li>
              <li>When status is set to closed or deadline expires, new bookings are automatically locked.</li>
              <li>Existing confirmed bookings, payments, and credit redemptions remain unaffected.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
