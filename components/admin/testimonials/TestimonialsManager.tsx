"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Video,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Play,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowUpDown,
  GraduationCap,
} from "lucide-react";
import { VideoTestimonial } from "@/lib/testimonials/service";
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from "@/lib/testimonials/youtube";

interface TestimonialsManagerProps {
  initialTestimonials: VideoTestimonial[];
  courseOptions: string[];
  migrationPending?: boolean;
  userRole: "super_admin" | "admin" | "editor";
}

interface TestimonialFormData {
  studentName: string;
  description: string;
  youtubeUrl: string;
  courseName: string;
  displayOrder: number;
  isPublished: boolean;
}

export function TestimonialsManager({
  initialTestimonials,
  courseOptions,
  migrationPending = false,
  userRole,
}: TestimonialsManagerProps) {
  const isReadOnly = userRole === "editor";

  const [testimonials, setTestimonials] = useState<VideoTestimonial[]>(initialTestimonials);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoTestimonial | null>(null);
  const [deletingItem, setDeletingItem] = useState<VideoTestimonial | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoTestimonial | null>(null);

  // Form State
  const [formData, setFormData] = useState<TestimonialFormData>({
    studentName: "",
    description: "",
    youtubeUrl: "",
    courseName: "",
    displayOrder: 0,
    isPublished: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Live YouTube validation in form
  const extractedVideoId = useMemo(() => {
    return extractYouTubeVideoId(formData.youtubeUrl);
  }, [formData.youtubeUrl]);

  // Derived filtered items
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((item) => {
      const matchesSearch =
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.courseName && item.courseName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && item.isPublished) ||
        (statusFilter === "draft" && !item.isPublished);

      return matchesSearch && matchesStatus;
    });
  }, [testimonials, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = testimonials.length;
    const published = testimonials.filter((t) => t.isPublished).length;
    const drafts = total - published;
    return { total, published, drafts };
  }, [testimonials]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      studentName: "",
      description: "",
      youtubeUrl: "",
      courseName: courseOptions[0] || "",
      displayOrder: testimonials.length,
      isPublished: true,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: VideoTestimonial) => {
    setEditingItem(item);
    setFormData({
      studentName: item.studentName,
      description: item.description,
      youtubeUrl: item.youtubeUrl,
      courseName: item.courseName || "",
      displayOrder: item.displayOrder,
      isPublished: item.isPublished,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Form Submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    // Validate
    const errors: Record<string, string> = {};
    if (!formData.studentName.trim()) {
      errors.studentName = "Student name is required.";
    }
    if (!formData.description.trim()) {
      errors.description = "Testimonial quote/description is required.";
    }
    if (!formData.youtubeUrl.trim()) {
      errors.youtubeUrl = "YouTube video URL is required.";
    } else if (!extractedVideoId) {
      errors.youtubeUrl = "Please provide a valid YouTube URL (e.g., https://youtu.be/... or https://youtube.com/watch?v=...)";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      if (editingItem) {
        // PATCH
        const res = await fetch(`/api/admin/testimonials/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update testimonial.");

        setTestimonials((prev) =>
          prev.map((t) => (t.id === editingItem.id ? data.testimonial : t))
        );
        setFeedbackMessage({ type: "success", text: "Testimonial updated successfully!" });
      } else {
        // POST
        const res = await fetch("/api/admin/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create testimonial.");

        setTestimonials((prev) => [data.testimonial, ...prev]);
        setFeedbackMessage({ type: "success", text: "New video testimonial added successfully!" });
      }

      setIsFormOpen(false);
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Publication
  const handleTogglePublish = async (item: VideoTestimonial) => {
    if (isReadOnly) return;
    try {
      const newStatus = !item.isPublished;
      const res = await fetch(`/api/admin/testimonials/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle status.");

      setTestimonials((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, isPublished: newStatus } : t))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingItem || isReadOnly) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/testimonials/${deletingItem.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete testimonial.");

      setTestimonials((prev) => prev.filter((t) => t.id !== deletingItem.id));
      setDeletingItem(null);
      setFeedbackMessage({ type: "success", text: "Testimonial permanently deleted." });
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#464137]/15">
        <div>
          <div className="flex items-center gap-2">
            <Video className="size-5 text-[#68705A]" />
            <h1 className="font-serif text-2xl font-bold text-[#292923]">
              Student Video Testimonials
            </h1>
          </div>
          <p className="text-xs text-[#6F6B61] mt-1">
            Curate and publish YouTube video reflections, cohort transformations, and student reviews on the landing page.
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#68705A] hover:bg-[#525946] text-[#FAF8F2] text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Add Testimonial</span>
          </button>
        )}
      </div>

      {/* Migration Notice Banner if Pending */}
      {migrationPending && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Testimonials Storage Notice</p>
            <p className="text-amber-800">
              Testimonials are currently using sample preview data. Please contact your administrator to enable permanent testimonial storage.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs ${
            feedbackMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-900"
              : "bg-red-50 border border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="size-4 text-green-600" />
            ) : (
              <AlertCircle className="size-4 text-red-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="p-1 text-current opacity-60 hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Overview Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#6F6B61]">
            Total Testimonials
          </span>
          <div className="text-2xl font-serif font-bold text-[#292923] mt-1">
            {stats.total}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#6F6B61]">
            Published (Live on Website)
          </span>
          <div className="text-2xl font-serif font-bold text-green-700 mt-1">
            {stats.published}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#6F6B61]">
            Drafts / Hidden
          </span>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1">
            {stats.drafts}
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-[#6F6B61]/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or course..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#464137]/20 bg-white text-xs text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#6F6B61] whitespace-nowrap">Filter Status:</span>
          <div className="inline-flex rounded-lg border border-[#464137]/20 bg-white p-0.5 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === "all" ? "bg-[#68705A] text-[#FAF8F2]" : "text-[#6F6B61] hover:text-[#292923]"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === "published" ? "bg-green-700 text-white" : "text-[#6F6B61] hover:text-[#292923]"
              }`}
            >
              Published ({stats.published})
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === "draft" ? "bg-amber-700 text-white" : "text-[#6F6B61] hover:text-[#292923]"
              }`}
            >
              Drafts ({stats.drafts})
            </button>
          </div>
        </div>
      </div>

      {/* Testimonials List */}
      {filteredTestimonials.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#FAF8F2] border border-[#464137]/15 space-y-3">
          <div className="size-12 rounded-full bg-[#68705A]/10 text-[#68705A] flex items-center justify-center mx-auto">
            <Video className="size-6" />
          </div>
          <h3 className="font-serif text-base font-bold text-[#292923]">
            {testimonials.length === 0 ? "No video testimonials yet" : "No testimonials match your filters"}
          </h3>
          <p className="text-xs text-[#6F6B61] max-w-sm mx-auto">
            {testimonials.length === 0
              ? "Add your first student video story by providing their name, review quote, and YouTube video link."
              : "Try adjusting your search terms or filter selection above."}
          </p>
          {testimonials.length === 0 && !isReadOnly && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#68705A] text-[#FAF8F2] text-xs font-bold hover:bg-[#525946] transition-colors"
            >
              <Plus className="size-4" />
              <span>Add First Testimonial</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTestimonials.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl bg-[#FAF8F2] border transition-all duration-300 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
                item.isPublished ? "border-[#464137]/15" : "border-amber-400/40 opacity-90"
              }`}
            >
              {/* 16:9 Video Thumbnail Preview */}
              <div
                onClick={() => setPreviewVideo(item)}
                className="relative aspect-video w-full bg-black/80 overflow-hidden cursor-pointer group"
              >
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.studentName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white/50 text-xs">
                    No Thumbnail
                  </div>
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Play Button Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-11 rounded-full bg-white/90 group-hover:bg-white text-[#292923] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="size-5 fill-[#292923] translate-x-0.5" />
                  </div>
                </div>

                {/* Publication Status Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[0.62rem] font-bold uppercase tracking-wider backdrop-blur-xs shadow-xs ${
                      item.isPublished
                        ? "bg-green-800/85 text-green-100 border border-green-400/30"
                        : "bg-amber-800/85 text-amber-100 border border-amber-400/30"
                    }`}
                  >
                    {item.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                {/* Order Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[0.62rem] font-bold bg-black/60 text-white/90 border border-white/20">
                    Order: #{item.displayOrder}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-sm font-bold text-[#292923] truncate">
                      {item.studentName}
                    </h3>
                    {item.courseName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.62rem] font-semibold bg-[#68705A]/10 text-[#68705A] border border-[#68705A]/20 shrink-0 max-w-[140px] truncate">
                        <GraduationCap className="size-3 shrink-0" />
                        <span className="truncate">{item.courseName}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#6F6B61] line-clamp-3 italic leading-relaxed">
                    &ldquo;{item.description}&rdquo;
                  </p>
                </div>

                {/* Card Actions & Footer */}
                <div className="pt-3 border-t border-[#464137]/10 flex items-center justify-between">
                  <a
                    href={item.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[0.68rem] text-[#68705A] hover:underline"
                    title="Open on YouTube"
                  >
                    <span>ID: {item.youtubeVideoId}</span>
                    <ExternalLink className="size-3" />
                  </a>

                  <div className="flex items-center gap-1">
                    {!isReadOnly && (
                      <>
                        <button
                          onClick={() => handleTogglePublish(item)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            item.isPublished
                              ? "text-green-700 hover:bg-green-50"
                              : "text-amber-700 hover:bg-amber-50"
                          }`}
                          title={item.isPublished ? "Unpublish Testimonial" : "Publish Testimonial"}
                        >
                          {item.isPublished ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-md text-[#6F6B61] hover:bg-[#EEE9DE] hover:text-[#292923] transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="size-4" />
                        </button>

                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Permanently"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Testimonial Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F2] border border-[#464137]/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#464137]/10">
              <div className="flex items-center gap-2">
                <Video className="size-5 text-[#68705A]" />
                <h2 className="font-serif text-lg font-bold text-[#292923]">
                  {editingItem ? "Edit Video Testimonial" : "Add Student Video Testimonial"}
                </h2>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-md text-[#6F6B61] hover:bg-[#EEE9DE] hover:text-[#292923]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-[#292923] mb-1">
                  Student Name or Display Name *
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="e.g. Priya Sharma, Bengaluru"
                  className={`w-full px-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                    formErrors.studentName ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                  }`}
                />
                {formErrors.studentName && (
                  <p className="text-[0.7rem] text-red-600 mt-1">{formErrors.studentName}</p>
                )}
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-xs font-bold text-[#292923] mb-1">
                  YouTube Video URL or Link *
                </label>
                <input
                  type="text"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                  className={`w-full px-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                    formErrors.youtubeUrl ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                  }`}
                />
                {formErrors.youtubeUrl && (
                  <p className="text-[0.7rem] text-red-600 mt-1">{formErrors.youtubeUrl}</p>
                )}

                {/* Live Extraction Preview */}
                {extractedVideoId ? (
                  <div className="mt-2.5 p-3 rounded-xl bg-[#F7F4EC] border border-[#68705A]/30 flex items-center gap-3">
                    <div className="relative aspect-video w-24 rounded-lg overflow-hidden bg-black shrink-0">
                      <img
                        src={getYouTubeThumbnailUrl(extractedVideoId, "hq")}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[0.7rem] text-[#292923] space-y-0.5">
                      <div className="flex items-center gap-1 text-green-700 font-bold">
                        <CheckCircle2 className="size-3.5" />
                        <span>Valid YouTube Video Detected</span>
                      </div>
                      <p className="text-[#6F6B61]">Video ID: <span className="font-mono font-semibold">{extractedVideoId}</span></p>
                    </div>
                  </div>
                ) : formData.youtubeUrl.trim() ? (
                  <p className="text-[0.7rem] text-amber-700 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    <span>Unsupported URL. Supported: watch URLs, youtu.be links, and YouTube Shorts.</span>
                  </p>
                ) : null}
              </div>

              {/* Testimonial Quote / Description */}
              <div>
                <label className="block text-xs font-bold text-[#292923] mb-1">
                  Testimonial Quote / Reflection *
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What was their takeaway, emotional journey, or creative breakthrough?"
                  className={`w-full px-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                    formErrors.description ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                  }`}
                />
                {formErrors.description && (
                  <p className="text-[0.7rem] text-red-600 mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* Course Attribution & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#292923] mb-1">
                    Attributed Course (Optional)
                  </label>
                  <input
                    type="text"
                    list="course-list-options"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    placeholder="Select or enter course..."
                    className="w-full px-3 py-2 rounded-lg border border-[#464137]/20 text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A]"
                  />
                  <datalist id="course-list-options">
                    {courseOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292923] mb-1">
                    Display Order (Ascending)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-[#464137]/20 text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A]"
                  />
                  <span className="text-[0.65rem] text-[#6F6B61] mt-0.5 block">Lower numbers appear first.</span>
                </div>
              </div>

              {/* Publication Status Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded border-[#464137]/20 text-[#68705A] focus:ring-[#68705A]"
                  />
                  <span className="text-xs font-semibold text-[#292923]">
                    Publish immediately on landing page
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#464137]/10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#464137]/20 text-xs font-semibold text-[#464137] hover:bg-[#EEE9DE] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#68705A] hover:bg-[#525946] text-[#FAF8F2] text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingItem
                    ? "Update Testimonial"
                    : "Add Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F2] border border-red-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-full bg-red-100">
                <Trash2 className="size-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#292923]">
                Delete Testimonial?
              </h3>
            </div>

            <p className="text-xs text-[#6F6B61] leading-relaxed">
              Are you sure you want to permanently delete the video testimonial from{" "}
              <strong className="text-[#292923]">{deletingItem.studentName}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#464137]/20 text-xs font-semibold text-[#464137] hover:bg-[#EEE9DE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          onClick={() => setPreviewVideo(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <button
            onClick={() => setPreviewVideo(null)}
            className="absolute top-5 right-5 z-20 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Preview"
          >
            <X className="size-5" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full flex flex-col items-center space-y-3"
          >
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
              <iframe
                src={getYouTubeEmbedUrl(previewVideo.youtubeVideoId, { autoplay: true })}
                title={`${previewVideo.studentName} Video Testimonial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            <div className="text-center text-white space-y-1">
              <h3 className="font-serif text-base font-bold">
                {previewVideo.studentName}
              </h3>
              <p className="text-xs text-white/70 italic max-w-lg">
                &ldquo;{previewVideo.description}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
