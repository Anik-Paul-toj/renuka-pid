"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Edit2,
  AlertCircle,
  X,
  Search,
} from "lucide-react";
import { GalleryItem } from "@/lib/gallery/service";

interface SystemAsset {
  id: string;
  name: string;
  category: string;
  url: string;
  altText: string;
  sizeBytes: number;
}

interface AdminMediaManagerProps {
  initialGalleryItems: GalleryItem[];
  systemAssets?: SystemAsset[];
}

export function AdminMediaManager({
  initialGalleryItems,
  systemAssets = [],
}: AdminMediaManagerProps) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(initialGalleryItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAltText, setUploadAltText] = useState("");
  const [uploadPublished, setUploadPublished] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Replace state
  const [replacingItem, setReplacingItem] = useState<GalleryItem | null>(null);
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacementPreview, setReplacementPreview] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deletingItem, setDeletingItem] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lightbox preview for admin
  const [previewingItem, setPreviewingItem] = useState<GalleryItem | null>(null);

  // Flash message auto-dismiss
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Refresh items from API
  const refreshItems = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (res.ok && data.success) {
        setGalleryItems(data.items);
      }
    } catch {
      setError("Failed to refresh gallery items.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("Unsupported file format. Please choose a JPEG, PNG, WebP, or AVIF image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds 10 MB limit. Please select an image under 10 MB.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Default title from filename
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  // Submit upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select an image file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadTitle);
      formData.append("altText", uploadAltText || uploadTitle);
      formData.append("displayOrder", "0");
      formData.append("isPublished", uploadPublished.toString());

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setSuccessMessage(`"${uploadTitle || selectedFile.name}" uploaded successfully to Cloudinary!`);
      setIsUploadOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadTitle("");
      setUploadAltText("");
      setUploadPublished(true);
      await refreshItems();
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle publish status
  const handleTogglePublish = async (item: GalleryItem) => {
    try {
      const newStatus = !item.isPublished;
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update publication status.");

      setGalleryItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isPublished: newStatus } : i))
      );
      setSuccessMessage(`Image marked as ${newStatus ? "Published" : "Draft"}.`);
    } catch (err: any) {
      setError(err.message || "Failed to update publication status.");
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      setIsSavingEdit(true);
      const res = await fetch(`/api/admin/media/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          altText: editTitle,
          displayOrder: editingItem.displayOrder,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update image details.");

      setGalleryItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, title: editTitle, altText: editTitle }
            : i
        )
      );
      setSuccessMessage("Artwork details updated successfully.");
      setEditingItem(null);
    } catch (err: any) {
      setError(err.message || "Failed to update image.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle replace file selection
  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("Unsupported format. Choose JPEG, PNG, WebP, or AVIF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds 10 MB limit.");
      return;
    }

    setReplacementFile(file);
    setReplacementPreview(URL.createObjectURL(file));
  };

  // Submit replace
  const handleReplaceSubmit = async () => {
    if (!replacingItem || !replacementFile) return;

    try {
      setIsReplacing(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", replacementFile);

      const res = await fetch(`/api/admin/media/${replacingItem.id}/replace`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Replacement failed.");

      setSuccessMessage("Image replaced successfully on Cloudinary CDN.");
      setReplacingItem(null);
      setReplacementFile(null);
      setReplacementPreview(null);
      await refreshItems();
    } catch (err: any) {
      setError(err.message || "Failed to replace image.");
    } finally {
      setIsReplacing(false);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/media/${deletingItem.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");

      setGalleryItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
      setSuccessMessage("Image deleted from Cloudinary CDN and database.");
      setDeletingItem(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete image.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered gallery items
  const filteredItems = galleryItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.publicId.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "published") return item.isPublished;
    if (statusFilter === "draft") return !item.isPublished;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
            <ImageIcon className="size-3" />
            <span>Cloudinary Asset Library</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#292923]">Gallery & Media Management</h1>
          <p className="text-xs text-[#6F6B61] mt-1 max-w-xl">
            Upload, curate, and optimize watercolor exhibition artworks for the public landing page gallery. Powered by Cloudinary CDN.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshItems}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-medium rounded-xl border border-[#464137]/15 text-[#292923] hover:bg-[#F0EDE6] transition-colors flex items-center gap-1.5"
            title="Refresh assets"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-[#68705A]" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setUploadTitle("");
              setIsUploadOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#68705A] text-white hover:bg-[#575E4B] transition-colors shadow-xs flex items-center gap-2"
          >
            <UploadCloud className="size-4" />
            <span>Upload New Artwork</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="size-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-amber-700 hover:text-amber-900">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Gallery Management */}
      <div className="space-y-4">
          {/* Controls Bar: Search & Status Filters */}
          <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="size-3.5 text-[#6F6B61] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search artwork title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#464137]/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#68705A]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[0.7rem] uppercase font-bold text-[#6F6B61] tracking-wider">Status:</span>
              <div className="inline-flex rounded-lg border border-[#464137]/15 p-0.5 bg-white text-xs">
                {(["all", "published", "draft"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                      statusFilter === filter
                        ? "bg-[#68705A] text-white shadow-xs"
                        : "text-[#6F6B61] hover:text-[#292923]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gallery Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#FAF8F2] border border-dashed border-[#464137]/20 text-center space-y-3">
              <ImageIcon className="size-10 text-[#68705A]/40 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-[#292923]">No gallery artworks found</h3>
              <p className="text-xs text-[#6F6B61] max-w-md mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "No images match your filter criteria. Try clearing search or status filters."
                  : "Start curating your landing page gallery by uploading high-resolution watercolor artwork."}
              </p>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setIsUploadOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#68705A] text-white text-xs font-semibold rounded-xl hover:bg-[#575E4B] transition-colors"
              >
                <UploadCloud className="size-4" />
                <span>Upload First Artwork</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-xl bg-[#FAF8F2] border border-[#464137]/15 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Image Thumbnail with Overlay */}
                  <div className="relative aspect-4/3 bg-[#F0EDE6] overflow-hidden">
                    <Image
                      src={item.thumbnailUrl || item.url}
                      alt={item.altText}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold tracking-wide shadow-xs ${
                          item.isPublished
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {item.isPublished ? (
                          <>
                            <Eye className="size-2.5" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-2.5" />
                            <span>Draft</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Quick Preview Button */}
                    <button
                      onClick={() => setPreviewingItem(item)}
                      className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      title="Inspect artwork"
                    >
                      <Eye className="size-6 drop-shadow-md" />
                    </button>
                  </div>

                  {/* Card Content & Metadata */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#292923] truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-[0.68rem] text-[#6F6B61] truncate mt-0.5 font-mono" title={item.publicId}>
                        {item.publicId.replace("renuka-art-studio/gallery/", "")}
                      </p>
                      <div className="flex items-center gap-2 text-[0.65rem] text-[#8C877C] mt-1.5">
                        <span>{(item.fileSizeBytes / 1024).toFixed(0)} KB</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2.5 border-t border-[#464137]/10 flex items-center justify-between gap-1">
                      {/* Publish Toggle Button */}
                      <button
                        onClick={() => handleTogglePublish(item)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          item.isPublished
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                        title={item.isPublished ? "Unpublish (Move to draft)" : "Publish to public gallery"}
                      >
                        {item.isPublished ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>

                      {/* Edit Details */}
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setEditTitle(item.title);
                        }}
                        className="p-1.5 rounded-lg border border-[#464137]/15 text-[#292923] hover:bg-[#F0EDE6] transition-colors"
                        title="Edit artwork title"
                      >
                        <Edit2 className="size-3.5" />
                      </button>

                      {/* Replace Image */}
                      <button
                        onClick={() => {
                          setReplacingItem(item);
                          setReplacementFile(null);
                          setReplacementPreview(null);
                        }}
                        className="p-1.5 rounded-lg border border-[#464137]/15 text-[#292923] hover:bg-[#F0EDE6] transition-colors"
                        title="Replace image file on Cloudinary"
                      >
                        <RefreshCw className="size-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors ml-auto"
                        title="Delete image permanently"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* MODAL 1: Upload Artwork Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F2] border border-[#464137]/20 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#464137]/10">
              <h3 className="font-serif text-lg font-bold text-[#292923]">Upload Gallery Artwork</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-[#6F6B61] hover:text-[#292923] p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Drop Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#292923] mb-1.5">
                  Image File (Max 10 MB)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#464137]/25 rounded-xl p-8 text-center cursor-pointer hover:border-[#68705A] hover:bg-[#F0EDE6]/50 transition-colors space-y-2"
                  >
                    <UploadCloud className="size-8 text-[#68705A] mx-auto" />
                    <p className="text-xs font-medium text-[#292923]">Click or drag image to upload</p>
                    <p className="text-[0.7rem] text-[#6F6B61]">Supports JPEG, PNG, WebP, AVIF</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-[#464137]/20 overflow-hidden bg-white p-3 flex items-center gap-3">
                    {previewUrl && (
                      <div className="relative size-16 shrink-0 rounded-lg overflow-hidden bg-[#F0EDE6]">
                        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#292923] truncate">{selectedFile.name}</p>
                      <p className="text-[0.7rem] text-[#6F6B61]">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#292923] mb-1">
                  Artwork Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Botanical Peony Study in Rose Madder"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#464137]/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#68705A]"
                />
              </div>

              {/* Publication Status */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadPublished}
                    onChange={(e) => setUploadPublished(e.target.checked)}
                    className="rounded border-[#464137]/30 text-[#68705A] focus:ring-[#68705A]"
                  />
                  <span className="text-xs font-medium text-[#292923]">Publish immediately to website gallery</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#464137]/10">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs rounded-xl border border-[#464137]/15 text-[#292923] hover:bg-[#F0EDE6]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#68705A] text-white hover:bg-[#575E4B] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>Uploading to Cloudinary...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-4" />
                      <span>Upload & Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Artwork Details Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F2] border border-[#464137]/20 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#464137]/10">
              <h3 className="font-serif text-lg font-bold text-[#292923]">Edit Artwork Details</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-[#6F6B61] hover:text-[#292923] p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#292923] mb-1">
                  Title / Caption
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#464137]/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#68705A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#464137]/10">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs rounded-xl border border-[#464137]/15 text-[#292923] hover:bg-[#F0EDE6]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#68705A] text-white hover:bg-[#575E4B] transition-colors"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Replace Image Modal */}
      {replacingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F2] border border-[#464137]/20 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#464137]/10">
              <h3 className="font-serif text-lg font-bold text-[#292923]">Replace Artwork Image</h3>
              <button
                onClick={() => setReplacingItem(null)}
                className="text-[#6F6B61] hover:text-[#292923] p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[#6F6B61]">
              Replace <strong>{replacingItem.title}</strong> with a new image. The previous file will be safely deleted from Cloudinary CDN.
            </p>

            <input
              type="file"
              ref={replaceInputRef}
              onChange={handleReplaceFileChange}
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
            />

            {!replacementFile ? (
              <div
                onClick={() => replaceInputRef.current?.click()}
                className="border-2 border-dashed border-[#464137]/25 rounded-xl p-6 text-center cursor-pointer hover:border-[#68705A] hover:bg-[#F0EDE6]/50 transition-colors space-y-2"
              >
                <RefreshCw className="size-6 text-[#68705A] mx-auto" />
                <p className="text-xs font-medium text-[#292923]">Choose new image file</p>
                <p className="text-[0.7rem] text-[#6F6B61]">JPEG, PNG, WebP, AVIF up to 10 MB</p>
              </div>
            ) : (
              <div className="p-3 bg-white border border-[#464137]/20 rounded-xl flex items-center gap-3">
                {replacementPreview && (
                  <div className="relative size-14 rounded-lg overflow-hidden bg-[#F0EDE6]">
                    <Image src={replacementPreview} alt="New replacement" fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#292923] truncate">{replacementFile.name}</p>
                  <p className="text-[0.7rem] text-[#6F6B61]">
                    {(replacementFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReplacementFile(null);
                    setReplacementPreview(null);
                  }}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#464137]/10">
              <button
                type="button"
                onClick={() => setReplacingItem(null)}
                disabled={isReplacing}
                className="px-4 py-2 text-xs rounded-xl border border-[#464137]/15 text-[#292923] hover:bg-[#F0EDE6]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReplaceSubmit}
                disabled={isReplacing || !replacementFile}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#68705A] text-white hover:bg-[#575E4B] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isReplacing ? "Replacing on CDN..." : "Confirm Replacement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F2] border border-red-200 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 className="size-6 shrink-0" />
              <h3 className="font-serif text-lg font-bold text-[#292923]">Delete Artwork</h3>
            </div>

            <p className="text-xs text-[#6F6B61]">
              Are you sure you want to permanently delete <strong>{deletingItem.title}</strong>? This will remove the image from Cloudinary CDN and the public gallery.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs rounded-xl border border-[#464137]/15 text-[#292923] hover:bg-[#F0EDE6]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Admin Full Size Preview Lightbox */}
      {previewingItem && (
        <div
          onClick={() => setPreviewingItem(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] bg-[#FAF8F2] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="relative flex-1 min-h-[300px] max-h-[70vh] bg-black/5 flex items-center justify-center">
              <img
                src={previewingItem.optimizedUrl || previewingItem.url}
                alt={previewingItem.altText}
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>
            <div className="p-4 bg-[#FAF8F2] border-t border-[#464137]/10 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#292923]">{previewingItem.title}</h3>
                <p className="text-xs text-[#6F6B61] font-mono">{previewingItem.publicId}</p>
              </div>
              <button
                onClick={() => setPreviewingItem(null)}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[#68705A] text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
