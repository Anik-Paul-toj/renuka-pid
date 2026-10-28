"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
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
  hideCourseSwitcher?: boolean;
}

export function AdminBatchScheduleManager({
  initialCourseId,
  userRole = "admin",
  onBatchUpdated,
  hideCourseSwitcher = false,
}: AdminBatchScheduleManagerProps) {
  const isReadOnly = userRole === "editor";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Courses eligible for batch schedule and cover image management
  const COURSES = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      title: "The WATERCOLOUR Roadmap: One-Day Masterclass",
      slug: "the-watercolour",
      defaultTiming: "6:30 PM",
      defaultEndTime: "8:30 PM",
      defaultImage: "",
    },
    {
      id: "e1111111-2222-3333-4444-555555555555",
      title: "WATERCOLOUR FOUNDATION",
      slug: "watercolour-foundation",
      defaultTiming: "6:30 PM",
      defaultEndTime: "8:00 PM",
      defaultImage: "/images/foundation.jpeg",
    },
    {
      id: "e2222222-2222-3333-4444-555555555555",
      title: "WATERCOLOUR ARTISTRY + FOUNDATION COURSE",
      slug: "watercolour-artistry-foundation",
      defaultTiming: "6:30 PM",
      defaultEndTime: "8:00 PM",
      defaultImage: "/images/ARTISTRY.jpeg",
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

  // Cover image management state
  const [coverImageUrl, setCoverImageUrl] = useState<string>(
    activeCourse.defaultImage
  );
  const [coverImagePublicId, setCoverImagePublicId] = useState<string | null>(
    null
  );
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageUploadMessage, setImageUploadMessage] = useState<string | null>(
    null
  );
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(
    null
  );

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
    setImageUploadMessage(null);
    setImageErrorMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch(
        `/api/admin/batches?courseId=${encodeURIComponent(courseId)}`,
        {
          cache: "no-store",
        }
      );
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

        if (b.coverImageUrl) {
          setCoverImageUrl(b.coverImageUrl);
          setCoverImagePublicId(b.coverImagePublicId || null);
        } else {
          setCoverImageUrl(activeCourse.defaultImage);
          setCoverImagePublicId(null);
        }
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
        setCoverImageUrl(activeCourse.defaultImage);
        setCoverImagePublicId(null);
      }
    } catch {
      setErrorMessage("Failed to load batch schedule. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatch(selectedCourseId);
  }, [selectedCourseId]);

  useEffect(() => {
    if (initialCourseId && initialCourseId !== selectedCourseId) {
      setSelectedCourseId(initialCourseId);
    }
  }, [initialCourseId]);

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

  // Image Upload Handler
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || isReadOnly) return;

    setImageErrorMessage(null);
    setImageUploadMessage(null);

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      setImageErrorMessage(
        "Please select a valid image file (JPEG, PNG, WEBP, or AVIF)."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageErrorMessage(
        `Image size exceeds 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB provided).`
      );
      return;
    }

    setIsUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const targetId = formData.id || selectedCourseId;
      const res = await fetch(
        `/api/admin/batches/${encodeURIComponent(targetId)}/image`,
        {
          method: "POST",
          body: uploadFormData,
        }
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to upload image. Please try again.");
      }

      setCoverImageUrl(result.coverImageUrl);
      setCoverImagePublicId(result.coverImagePublicId || null);
      setImageUploadMessage(
        `Cover image for ${activeCourse.title} updated successfully.`
      );
    } catch (err: any) {
      setImageErrorMessage(
        err.message || "Failed to upload cover image. Please try again."
      );
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Reset image back to default artwork
  const handleResetImage = async () => {
    if (isReadOnly || isUploadingImage) return;

    setIsUploadingImage(true);
    setImageErrorMessage(null);
    setImageUploadMessage(null);

    try {
      const targetId = formData.id || selectedCourseId;
      const res = await fetch(
        `/api/admin/batches/${encodeURIComponent(targetId)}/image`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to reset cover image.");
      }

      setCoverImageUrl(result.coverImageUrl || activeCourse.defaultImage);
      setCoverImagePublicId(null);
      setImageUploadMessage(
        `Cover image for ${activeCourse.title} reset to default studio artwork.`
      );
    } catch (err: any) {
      setImageErrorMessage(err.message || "Failed to reset cover image.");
    } finally {
      setIsUploadingImage(false);
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

    // Critical Constraint: The registration deadline must not be after the batch start date.
    if (formData.lastRegistrationDate && formData.startDate) {
      if (formData.lastRegistrationDate > formData.startDate) {
        errors.lastRegistrationDate =
          "The registration deadline must not be after the batch start date.";
      }
    }

    if (formData.endDate && formData.startDate) {
      if (formData.endDate < formData.startDate) {
        errors.endDate = "Batch end date cannot be earlier than start date.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage(
        "Please fix the validation errors before saving the batch schedule."
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch(
        `/api/admin/batches/${encodeURIComponent(formData.id)}`,
        {
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
        }
      );

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

  const isExpired = isRegistrationDeadlineExpired(
    formData.lastRegistrationDate,
    new Date(),
    {
      startDate: formData.startDate,
      startTime: formData.startTime,
    }
  );
  const isClosed =
    formData.status === "closed" ||
    formData.status === "completed" ||
    isExpired;

  const isCloudinaryActive = Boolean(
    coverImageUrl && coverImageUrl.includes("cloudinary.com")
  );

  return (
    <div className="space-y-6">
      {/* Header Banner - Only shown on standalone /admin/batches page */}
      {!hideCourseSwitcher && (
        <div className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
                <Calendar className="size-3" />
                <span>Batch Scheduling</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#292923]">
                Batch & Schedule Management
              </h2>
              <p className="text-xs text-[#6F6B61] mt-1 max-w-2xl">
                Configure workshop start dates, registration deadlines,
                timings, and cover images. Changes update immediately on
                public course cards.
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
      )}

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* ========================================================== */}
          {/* 1. CLOUDINARY COVER IMAGE MANAGEMENT SECTION               */}
          {/* ========================================================== */}
          <div className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-[#464137]/10 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-[#68705A]" />
                <h3 className="font-serif text-base font-bold text-[#292923]">
                  Course Cover Image
                </h3>
              </div>
              <span
                className={`text-[0.62rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isCloudinaryActive
                    ? "bg-[#3E522D]/15 text-[#3E522D] border border-[#3E522D]/30"
                    : coverImageUrl || activeCourse.defaultImage
                    ? "bg-[#464137]/10 text-[#464137] border border-[#464137]/20"
                    : "bg-[#B93821]/10 text-[#B93821] border border-[#B93821]/20"
                }`}
              >
                {isCloudinaryActive
                  ? "Custom Image Active"
                  : coverImageUrl || activeCourse.defaultImage
                  ? "Default Studio Artwork"
                  : "Blank Placeholder (No Image)"}
              </span>
            </div>

            <p className="text-xs text-[#6F6B61]">
              Manage the cover image displayed on the course card for{" "}
              <strong>{activeCourse.title}</strong>.
            </p>

            {/* Image Preview & Upload Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
              <div className="relative w-full sm:w-44 aspect-[16/10] rounded-lg overflow-hidden bg-[#EBE7DC] border border-[#464137]/25 shrink-0 shadow-2xs flex items-center justify-center">
                {coverImageUrl || activeCourse.defaultImage ? (
                  <Image
                    src={coverImageUrl || activeCourse.defaultImage}
                    alt={activeCourse.title}
                    fill
                    sizes="200px"
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-[#EBE7DC] text-[#6F6B61]">
                    <ImageIcon className="size-6 stroke-[1.5] text-[#444C38]/40 mb-1" />
                    <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#444C38]">
                      Blank Placeholder
                    </span>
                    <span className="text-[0.6rem] text-[#6F6B61] mt-0.5">
                      Upload an image for this course
                    </span>
                  </div>
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-[#14120E]/60 flex items-center justify-center text-[#FAF8F2]">
                    <div className="size-5 border-2 border-[#FAF8F2] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2.5 w-full">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleImageFileChange}
                  className="hidden"
                  disabled={isReadOnly || isUploadingImage}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReadOnly || isUploadingImage}
                    className="btn-studio px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Upload className="size-3.5" />
                    <span>
                      {isUploadingImage
                        ? "Uploading image..."
                        : isCloudinaryActive
                        ? "Replace Image"
                        : "Upload New Image"}
                    </span>
                  </button>

                  {isCloudinaryActive && (
                    <button
                      type="button"
                      onClick={handleResetImage}
                      disabled={isReadOnly || isUploadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#B93821]/30 text-xs font-semibold text-[#B93821] hover:bg-[#B93821]/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Reset to Default</span>
                    </button>
                  )}
                </div>

                <span className="text-[0.66rem] text-[#6F6B61] block leading-relaxed">
                  Supported formats: JPEG, PNG, WEBP, AVIF • Max size: 10MB.
                  Replacing this image will only update{" "}
                  <strong>{activeCourse.title}</strong>.
                </span>
              </div>
            </div>

            {/* Image Feedback Alerts */}
            {imageUploadMessage && (
              <div className="p-3 rounded-lg bg-[#3E522D]/10 border border-[#3E522D]/25 flex items-start gap-2 text-xs text-[#3E522D] font-medium">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{imageUploadMessage}</span>
              </div>
            )}

            {imageErrorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800 font-medium">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{imageErrorMessage}</span>
              </div>
            )}
          </div>

          {/* ========================================================== */}
          {/* 2. BATCH SCHEDULE FORM                                      */}
          {/* ========================================================== */}
          <form
            onSubmit={handleSave}
            className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-5"
          >
            {/* Feedback Alerts */}
            {successMessage && (
              <div className="p-3.5 rounded-lg bg-[#3E522D]/10 border border-[#3E522D]/25 flex items-start gap-2 text-xs text-[#3E522D] font-medium">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800 font-medium">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isReadOnly && (
              <div className="p-3 rounded-lg bg-[#EBE7DC] border border-[#464137]/20 flex items-center gap-2 text-xs text-[#6F6B61]">
                <Lock className="size-3.5" />
                <span>
                  You have read-only access. Only administrators can save batch
                  schedules.
                </span>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-[#6F6B61]">
                <div className="size-6 border-2 border-[#68705A] border-t-transparent rounded-full animate-spin" />
                <span>Loading batch schedule for {activeCourse.title}...</span>
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
                    onChange={(e) =>
                      handleInputChange("batchName", e.target.value)
                    }
                    placeholder="e.g. November 2026 Live Cohort"
                    className={`w-full rounded-lg bg-[#F7F4EC] border px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A] ${
                      fieldErrors.batchName
                        ? "border-rose-400 ring-1 ring-rose-400"
                        : "border-[#464137]/20"
                    }`}
                  />
                  {fieldErrors.batchName && (
                    <span className="text-[0.68rem] text-rose-600 mt-0.5 block font-medium">
                      {fieldErrors.batchName}
                    </span>
                  )}
                </div>

                {/* 2. Dates Row: Start Date & Registration Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Batch Start Date */}
                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Batch Start Date (YYYY-MM-DD){" "}
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className={`w-full rounded-lg bg-[#F7F4EC] border px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A] ${
                        fieldErrors.startDate
                          ? "border-rose-400 ring-1 ring-rose-400"
                          : "border-[#464137]/20"
                      }`}
                    />
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5 block">
                      IST Display: {formatBatchDateIST(formData.startDate)}
                    </span>
                    {fieldErrors.startDate && (
                      <span className="text-[0.68rem] text-rose-600 mt-0.5 block font-medium">
                        {fieldErrors.startDate}
                      </span>
                    )}
                  </div>

                  {/* Last Date for Registration */}
                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Last Date for Registration (YYYY-MM-DD){" "}
                      <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.lastRegistrationDate}
                      onChange={(e) =>
                        handleInputChange(
                          "lastRegistrationDate",
                          e.target.value
                        )
                      }
                      className={`w-full rounded-lg bg-[#F7F4EC] border px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A] ${
                        fieldErrors.lastRegistrationDate
                          ? "border-rose-400 ring-1 ring-rose-400"
                          : "border-[#464137]/20"
                      }`}
                    />
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5 block">
                      IST Display:{" "}
                      {formatBatchDateIST(formData.lastRegistrationDate)}
                    </span>
                    {fieldErrors.lastRegistrationDate && (
                      <span className="text-[0.68rem] text-rose-600 mt-0.5 block font-medium">
                        {fieldErrors.lastRegistrationDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Timings Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Batch Start Time <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                      placeholder="e.g. 6:30 PM"
                      className={`w-full rounded-lg bg-[#F7F4EC] border px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A] ${
                        fieldErrors.startTime
                          ? "border-rose-400 ring-1 ring-rose-400"
                          : "border-[#464137]/20"
                      }`}
                    />
                    {fieldErrors.startTime && (
                      <span className="text-[0.68rem] text-rose-600 mt-0.5 block font-medium">
                        {fieldErrors.startTime}
                      </span>
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
                      onChange={(e) =>
                        handleInputChange("endTime", e.target.value)
                      }
                      placeholder="e.g. 8:00 PM"
                      className="w-full rounded-lg bg-[#F7F4EC] border border-[#464137]/20 px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                    />
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5 block">
                      IST Display:{" "}
                      {formatBatchTimeIST(
                        formData.startTime,
                        formData.endTime
                      )}
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
                          e.target.value as
                            | "open"
                            | "closed"
                            | "upcoming"
                            | "completed"
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
                        handleInputChange(
                          "totalSeats",
                          parseInt(e.target.value) || 100
                        )
                      }
                      className="w-full rounded-lg bg-[#F7F4EC] border border-[#464137]/20 px-3 py-2 text-xs text-[#292923] focus:outline-hidden focus:ring-1 focus:ring-[#68705A]"
                    />
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5 block">
                      Booked: {formData.seatsBooked} • Remaining:{" "}
                      {Math.max(
                        0,
                        formData.totalSeats - formData.seatsBooked
                      )}
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
              This is how students will see the card on{" "}
              <strong>/course</strong> and{" "}
              <strong>/course/{activeCourse.slug}</strong>:
            </p>

            {/* Rendered Preview with Dynamic Cover Image */}
            <div className="group/sched relative overflow-hidden rounded-xl bg-[#FAF8F2] border border-[#444C38]/30 p-4 shadow-2xs space-y-3">
              {/* Cover Image in Preview */}
              <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-[#EBE7DC] border border-[#444C38]/20 flex items-center justify-center">
                {coverImageUrl || activeCourse.defaultImage ? (
                  <Image
                    src={coverImageUrl || activeCourse.defaultImage}
                    alt={activeCourse.title}
                    fill
                    sizes="400px"
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#EFECE4] via-[#E8E3D5] to-[#DFD8C6]">
                    <Sparkles className="size-6 stroke-[1.5] text-[#444C38]/50 mb-1" />
                    <span className="text-xs font-bold text-[#444C38]">
                      Blank Placeholder Area
                    </span>
                    <span className="text-[0.66rem] text-[#6F6B61] mt-0.5">
                      Displays subtle atelier canvas until an image is uploaded
                    </span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="rounded bg-[#FAF8F2]/90 backdrop-blur-xs px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[#444C38] border border-[#444C38]/20">
                    {activeCourse.title}
                  </span>
                </div>
              </div>

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
                        isClosed
                          ? "text-[#6F6B61] line-through"
                          : "text-[#B93821]"
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
                      {formatBatchTimeIST(
                        formData.startTime,
                        formData.endTime
                      )}
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
              <li>
                Cover images update immediately on the public course page.
              </li>
              <li>
                The registration deadline must not be after the batch start date.
              </li>
              <li>
                Times are formatted with the official India timezone (Asia/Kolkata).
              </li>
              <li>
                When status is set to closed or deadline expires, new bookings are automatically locked.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
