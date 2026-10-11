import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from "./youtube";

export interface VideoTestimonial {
  id: string;
  studentName: string;
  description: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  courseName: string | null;
  displayOrder: number;
  isPublished: boolean;
  thumbnailUrl: string;
  embedUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestimonialInput {
  studentName: string;
  description: string;
  youtubeUrl: string;
  courseName?: string | null;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface UpdateTestimonialInput {
  studentName?: string;
  description?: string;
  youtubeUrl?: string;
  courseName?: string | null;
  displayOrder?: number;
  isPublished?: boolean;
}

/**
 * Format raw database row into VideoTestimonial domain entity.
 */
function formatVideoTestimonial(row: any): VideoTestimonial {
  const videoId = row.youtube_video_id || extractYouTubeVideoId(row.youtube_url) || "";

  return {
    id: row.id,
    studentName: row.student_name || "Anonymous Student",
    description: row.description || "",
    youtubeUrl: row.youtube_url || "",
    youtubeVideoId: videoId,
    courseName: row.course_name || null,
    displayOrder: typeof row.display_order === "number" ? row.display_order : 0,
    isPublished: Boolean(row.is_published),
    thumbnailUrl: videoId ? getYouTubeThumbnailUrl(videoId, "hq") : "",
    embedUrl: videoId ? getYouTubeEmbedUrl(videoId, { autoplay: true }) : "",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Public loader: Retrieve published video testimonials for the landing page.
 * Returns empty array if table has not been migrated or on errors.
 */
export async function getPublicVideoTestimonials(): Promise<VideoTestimonial[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("video_testimonials")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") {
        console.warn(
          "[Testimonials] Table 'public.video_testimonials' does not exist yet. Run migration 20261011000001_video_testimonials.sql."
        );
        return [];
      }
      console.error("[Testimonials] Public load error:", error);
      return [];
    }

    return (data || []).map(formatVideoTestimonial);
  } catch (err: any) {
    console.error("[Testimonials] Unexpected public fetch error:", err);
    return [];
  }
}

/**
 * Admin loader: Retrieve all video testimonials with migration status check.
 */
export async function getAdminVideoTestimonials(): Promise<{
  testimonials: VideoTestimonial[];
  migrationPending: boolean;
}> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("video_testimonials")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") {
        return { testimonials: [], migrationPending: true };
      }
      throw new Error(`Failed to load testimonials: ${error.message}`);
    }

    return {
      testimonials: (data || []).map(formatVideoTestimonial),
      migrationPending: false,
    };
  } catch (err: any) {
    console.error("[Testimonials] Admin fetch error:", err);
    return { testimonials: [], migrationPending: false };
  }
}

/**
 * Admin action: Create a new video testimonial.
 */
export async function createVideoTestimonial(
  input: CreateTestimonialInput
): Promise<VideoTestimonial> {
  const studentName = input.studentName?.trim();
  if (!studentName) {
    throw new Error("Student name or display name is required.");
  }

  const description = input.description?.trim();
  if (!description) {
    throw new Error("Testimonial description or quote is required.");
  }

  const youtubeUrl = input.youtubeUrl?.trim();
  if (!youtubeUrl) {
    throw new Error("YouTube video URL is required.");
  }

  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error(
      "Invalid YouTube URL. Please provide a standard watch link, youtu.be link, or YouTube Shorts link."
    );
  }

  const displayOrder = typeof input.displayOrder === "number" ? input.displayOrder : 0;
  const isPublished = input.isPublished !== undefined ? Boolean(input.isPublished) : true;
  const courseName = input.courseName?.trim() || null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("video_testimonials")
    .insert({
      student_name: studentName,
      description,
      youtube_url: youtubeUrl,
      youtube_video_id: videoId,
      course_name: courseName,
      display_order: displayOrder,
      is_published: isPublished,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        "Database table 'video_testimonials' has not been created yet. Please execute migration 20261011000001_video_testimonials.sql."
      );
    }
    throw new Error(`Database insert failed: ${error.message}`);
  }

  // Invalidate public and admin caches
  try {
    revalidatePath("/");
    revalidatePath("/admin/testimonials");
  } catch {
    // revalidatePath is a no-op outside request context
  }

  return formatVideoTestimonial(data);
}

/**
 * Admin action: Update an existing video testimonial.
 */
export async function updateVideoTestimonial(
  id: string,
  input: UpdateTestimonialInput
): Promise<VideoTestimonial> {
  if (!id) throw new Error("Testimonial ID is required for update.");

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.studentName !== undefined) {
    const studentName = input.studentName.trim();
    if (!studentName) throw new Error("Student name cannot be empty.");
    updates.student_name = studentName;
  }

  if (input.description !== undefined) {
    const description = input.description.trim();
    if (!description) throw new Error("Description cannot be empty.");
    updates.description = description;
  }

  if (input.youtubeUrl !== undefined) {
    const youtubeUrl = input.youtubeUrl.trim();
    if (!youtubeUrl) throw new Error("YouTube URL cannot be empty.");
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error(
        "Invalid YouTube URL. Please provide a standard watch link, youtu.be link, or YouTube Shorts link."
      );
    }
    updates.youtube_url = youtubeUrl;
    updates.youtube_video_id = videoId;
  }

  if (input.courseName !== undefined) {
    updates.course_name = input.courseName?.trim() || null;
  }

  if (input.displayOrder !== undefined) {
    updates.display_order = Number(input.displayOrder) || 0;
  }

  if (input.isPublished !== undefined) {
    updates.is_published = Boolean(input.isPublished);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("video_testimonials")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Update failed: ${error.message}`);
  }

  try {
    revalidatePath("/");
    revalidatePath("/admin/testimonials");
  } catch {}

  return formatVideoTestimonial(data);
}

/**
 * Admin action: Delete a video testimonial permanently.
 */
export async function deleteVideoTestimonial(id: string): Promise<boolean> {
  if (!id) throw new Error("Testimonial ID is required for deletion.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("video_testimonials")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Deletion failed: ${error.message}`);
  }

  try {
    revalidatePath("/");
    revalidatePath("/admin/testimonials");
  } catch {}

  return true;
}

/**
 * Helper to fetch active courses for the testimonial course selector dropdown.
 */
export async function getAvailableCourseOptions(): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("courses")
      .select("title")
      .order("title", { ascending: true });

    const titles = (data || []).map((c: any) => c.title).filter(Boolean);
    const standardDefaults = [
      "Watercolour Artistry Cohort",
      "Foundations of Watercolour",
      "Botanical Watercolour Masterclass",
    ];

    // Deduplicate
    return Array.from(new Set([...titles, ...standardDefaults]));
  } catch {
    return [
      "Watercolour Artistry Cohort",
      "Foundations of Watercolour",
      "Botanical Watercolour Masterclass",
    ];
  }
}
