import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  uploadGalleryImageBuffer,
  deleteGalleryImageByPublicId,
  getOptimizedCloudinaryUrl,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/cloudinary/service";

export interface GalleryItem {
  id: string;
  publicId: string;
  url: string;
  thumbnailUrl: string;
  optimizedUrl: string;
  title: string;
  altText: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  category: string;
  isPublished: boolean;
  displayOrder: number;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Format a raw database row from media_assets into a standardized GalleryItem.
 */
function formatGalleryItem(row: any): GalleryItem {
  const isPublished =
    row.is_published !== undefined && row.is_published !== null
      ? Boolean(row.is_published)
      : row.category === "gallery";

  const displayOrder =
    typeof row.display_order === "number" ? row.display_order : 0;

  const publicId = row.file_path || "";
  const originalUrl = row.public_url || "";

  // Cloudinary responsive & format-optimized CDN URLs
  const thumbnailUrl = getOptimizedCloudinaryUrl(originalUrl || publicId, {
    width: 600,
    crop: "fill",
    quality: "auto",
  });

  const optimizedUrl = getOptimizedCloudinaryUrl(originalUrl || publicId, {
    width: 1400,
    crop: "limit",
    quality: "auto",
  });

  return {
    id: row.id,
    publicId,
    url: originalUrl,
    thumbnailUrl,
    optimizedUrl,
    title: row.alt_text || row.file_name || "Watercolor Artwork",
    altText: row.alt_text || "Renuka Art Studio Watercolor Piece",
    fileName: row.file_name || "artwork.jpg",
    fileSizeBytes: Number(row.file_size_bytes) || 0,
    mimeType: row.mime_type || "image/jpeg",
    category: row.category || "gallery",
    isPublished,
    displayOrder,
    metadata: row.metadata || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Server-side loader for publicly visible gallery images on the landing page.
 * Strictly returns published artwork sorted by display_order ASC, created_at DESC.
 */
export async function getPublicGalleryImages(): Promise<GalleryItem[]> {
  try {
    const supabase = createAdminClient();

    // Query media_assets for gallery category items
    const { data: rows, error } = await supabase
      .from("media_assets")
      .select("*")
      .in("category", ["gallery", "gallery_published"])
      .order("created_at", { ascending: false });

    if (error || !rows) {
      console.warn("getPublicGalleryImages query warning:", error?.message);
      return [];
    }

    const items = rows
      .map(formatGalleryItem)
      .filter((item) => item.isPublished)
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return items;
  } catch (err: any) {
    console.error("getPublicGalleryImages error:", err);
    return [];
  }
}

/**
 * Retrieve all gallery media assets for the Admin Gallery/Media panel.
 * Includes both published and draft artwork, plus read-only views of other asset categories.
 */
export async function getAdminGalleryImages(): Promise<GalleryItem[]> {
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !rows) {
    console.error("getAdminGalleryImages error:", error);
    return [];
  }

  // Filter for gallery items (both published and draft)
  const items = rows
    .filter((r) => r.category && r.category.startsWith("gallery"))
    .map(formatGalleryItem)
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return items;
}

/**
 * Upload a new gallery image via Cloudinary and persist the record in Supabase.
 */
export async function uploadGalleryImage(
  file: File,
  options: {
    title?: string;
    altText?: string;
    isPublished?: boolean;
    displayOrder?: number;
  },
  adminId?: string
): Promise<GalleryItem> {
  // 1. Validation
  const fileType = (file.type || "").toLowerCase();
  const ext = (file.name || "").split(".").pop()?.toLowerCase() || "";
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(fileType);
  const isAllowedExt = ["jpg", "jpeg", "png", "webp", "avif"].includes(ext);

  if (!isAllowedMime && !isAllowedExt) {
    throw new Error(
      `Unsupported file type: ${file.type || ext}. Allowed formats: JPEG, PNG, WebP, AVIF.`
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB maximum limit.`
    );
  }

  // 2. Buffer conversion and Cloudinary upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const cloudinaryResult = await uploadGalleryImageBuffer(buffer, file.name, file.type);

  // 3. Persist to Supabase media_assets
  const supabase = createAdminClient();
  const isPublished = options.isPublished ?? true;
  const displayOrder = options.displayOrder ?? 0;
  const title = options.title?.trim() || file.name.replace(/\.[^/.]+$/, "");
  const altText = options.altText?.trim() || title;

  // Resilient insert: include is_published and display_order if supported,
  // with category fallback ("gallery" vs "gallery_draft")
  const insertPayload: Record<string, any> = {
    bucket: "cloudinary",
    file_path: cloudinaryResult.publicId,
    public_url: cloudinaryResult.secureUrl,
    file_name: file.name,
    mime_type: file.type,
    file_size_bytes: cloudinaryResult.bytes,
    alt_text: altText,
    category: isPublished ? "gallery" : "gallery_draft",
    created_by: adminId || null,
  };

  // Attempt to write optional columns if schema migration is applied
  insertPayload.is_published = isPublished;
  insertPayload.display_order = displayOrder;
  insertPayload.metadata = {
    width: cloudinaryResult.width,
    height: cloudinaryResult.height,
    format: cloudinaryResult.format,
    title,
  };

  let { data: inserted, error } = await supabase
    .from("media_assets")
    .insert(insertPayload as any)
    .select()
    .single();

  // If column doesn't exist yet (pre-migration fallback), retry without newly added columns
  if (error && (error.message?.includes("is_published") || error.message?.includes("display_order"))) {
    delete insertPayload.is_published;
    delete insertPayload.display_order;
    delete insertPayload.metadata;

    const retry = await supabase
      .from("media_assets")
      .insert(insertPayload as any)
      .select()
      .single();

    if (retry.error) {
      // Clean up uploaded Cloudinary image if DB insert fails
      await deleteGalleryImageByPublicId(cloudinaryResult.publicId);
      throw new Error(`Failed to save image record in database: ${retry.error.message}`);
    }
    inserted = retry.data;
  } else if (error) {
    // Clean up uploaded Cloudinary image if DB insert fails
    await deleteGalleryImageByPublicId(cloudinaryResult.publicId);
    throw new Error(`Failed to save image record in database: ${error.message}`);
  }

  // 4. Invalidate caches
  try {
    revalidatePath("/");
    revalidatePath("/admin/media");
  } catch {}

  return formatGalleryItem(inserted);
}

/**
 * Update an existing gallery item's title, alt text, publication status, or display order.
 */
export async function updateGalleryImage(
  id: string,
  updates: {
    title?: string;
    altText?: string;
    isPublished?: boolean;
    displayOrder?: number;
  }
): Promise<GalleryItem> {
  const supabase = createAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (findError || !existing) {
    throw new Error("Gallery image not found.");
  }

  // Prevent modifying system instructor or video assets
  if (!existing.category || !existing.category.startsWith("gallery")) {
    throw new Error("Cannot modify system instructor or video assets.");
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.altText !== undefined) {
    updatePayload.alt_text = updates.altText;
  } else if (updates.title !== undefined) {
    updatePayload.alt_text = updates.title;
  }

  if (updates.isPublished !== undefined) {
    updatePayload.is_published = updates.isPublished;
    updatePayload.category = updates.isPublished ? "gallery" : "gallery_draft";
  }

  if (updates.displayOrder !== undefined) {
    updatePayload.display_order = updates.displayOrder;
  }

  let { data: updated, error } = await supabase
    .from("media_assets")
    .update(updatePayload as any)
    .eq("id", id)
    .select()
    .single();

  // Pre-migration fallback if optional columns don't exist yet
  if (error && (error.message?.includes("is_published") || error.message?.includes("display_order"))) {
    delete updatePayload.is_published;
    delete updatePayload.display_order;

    const retry = await supabase
      .from("media_assets")
      .update(updatePayload as any)
      .eq("id", id)
      .select()
      .single();

    if (retry.error) {
      throw new Error(`Failed to update gallery image: ${retry.error.message}`);
    }
    updated = retry.data;
  } else if (error) {
    throw new Error(`Failed to update gallery image: ${error.message}`);
  }

  // Invalidate caches
  try {
    revalidatePath("/");
    revalidatePath("/admin/media");
  } catch {}

  return formatGalleryItem(updated);
}

/**
 * Replace an existing gallery image with a new file.
 * Uploads the replacement to Cloudinary, updates DB record, and deletes the old Cloudinary asset.
 */
export async function replaceGalleryImage(
  id: string,
  newFile: File
): Promise<GalleryItem> {
  // 1. Validation
  const fileType = (newFile.type || "").toLowerCase();
  const ext = (newFile.name || "").split(".").pop()?.toLowerCase() || "";
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(fileType);
  const isAllowedExt = ["jpg", "jpeg", "png", "webp", "avif"].includes(ext);

  if (!isAllowedMime && !isAllowedExt) {
    throw new Error(
      `Unsupported file type: ${newFile.type || ext}. Allowed formats: JPEG, PNG, WebP, AVIF.`
    );
  }

  if (newFile.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(newFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds 10 MB maximum limit.`
    );
  }

  const supabase = createAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (findError || !existing) {
    throw new Error("Gallery image not found.");
  }

  // Safety check: protect non-gallery assets
  if (!existing.category || !existing.category.startsWith("gallery")) {
    throw new Error("Cannot replace system instructor or video assets.");
  }

  const oldPublicId = existing.file_path;

  // 2. Upload replacement to Cloudinary
  const arrayBuffer = await newFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const cloudinaryResult = await uploadGalleryImageBuffer(buffer, newFile.name, newFile.type);

  // 3. Update DB record
  const { data: updated, error: updateError } = await supabase
    .from("media_assets")
    .update({
      file_path: cloudinaryResult.publicId,
      public_url: cloudinaryResult.secureUrl,
      file_name: newFile.name,
      mime_type: newFile.type,
      file_size_bytes: cloudinaryResult.bytes,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updated) {
    // Clean up newly uploaded replacement if DB update fails
    await deleteGalleryImageByPublicId(cloudinaryResult.publicId);
    throw new Error(`Failed to update database for replacement image: ${updateError?.message}`);
  }

  // 4. Safely delete old asset from Cloudinary
  if (oldPublicId && oldPublicId !== cloudinaryResult.publicId) {
    await deleteGalleryImageByPublicId(oldPublicId);
  }

  // Invalidate caches
  try {
    revalidatePath("/");
    revalidatePath("/admin/media");
  } catch {}

  return formatGalleryItem(updated);
}

/**
 * Permanently delete a gallery image from Cloudinary and Supabase.
 * Strictly forbidden for instructor and video assets.
 */
export async function deleteGalleryImage(id: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: existing, error: findError } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (findError || !existing) {
    throw new Error("Gallery image not found.");
  }

  // Safety check: protect non-gallery assets
  if (!existing.category || !existing.category.startsWith("gallery")) {
    throw new Error("Cannot delete system instructor or video assets.");
  }

  const publicId = existing.file_path;

  // 1. Delete from Cloudinary if stored in Cloudinary
  if (publicId && existing.bucket === "cloudinary") {
    await deleteGalleryImageByPublicId(publicId);
  }

  // 2. Delete from database
  const { error: deleteError } = await supabase
    .from("media_assets")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw new Error(`Failed to delete image record: ${deleteError.message}`);
  }

  // 3. Invalidate caches
  try {
    revalidatePath("/");
    revalidatePath("/admin/media");
  } catch {}

  return true;
}
