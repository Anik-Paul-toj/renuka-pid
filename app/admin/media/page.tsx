import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminGalleryImages } from "@/lib/gallery/service";
import { AdminMediaManager } from "@/components/admin/media/AdminMediaManager";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  // Fetch gallery items
  const galleryItems = await getAdminGalleryImages();

  // Fetch system assets (read-only)
  const supabase = createAdminClient();
  const { data: rawAssets } = await supabase
    .from("media_assets")
    .select("*")
    .neq("category", "gallery")
    .neq("category", "gallery_draft")
    .order("created_at", { ascending: false });

  const systemAssets = (rawAssets || []).map((a) => ({
    id: a.id,
    name: a.file_name,
    category: a.category,
    url: a.public_url,
    altText: a.alt_text || a.file_name,
    sizeBytes: Number(a.file_size_bytes) || 0,
  }));

  return (
    <AdminMediaManager
      initialGalleryItems={galleryItems}
      systemAssets={systemAssets}
    />
  );
}
