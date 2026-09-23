import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { Image as ImageIcon, UploadCloud, Folder } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
          <ImageIcon className="size-3" />
          <span>Asset Library</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#292923]">Gallery & Media</h1>
        <p className="text-xs text-[#6F6B61] mt-1">
          Upload and manage artwork imagery, instructor photos, student project showcases, and brand assets.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 text-center space-y-2">
            <Folder className="size-6 text-[#68705A] mx-auto" />
            <h4 className="font-bold text-xs text-[#292923]">Artwork Gallery</h4>
            <p className="text-[0.7rem] text-[#6F6B61]">Student & demonstration paintings</p>
          </div>
          <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 text-center space-y-2">
            <Folder className="size-6 text-[#68705A] mx-auto" />
            <h4 className="font-bold text-xs text-[#292923]">Instructor Media</h4>
            <p className="text-[0.7rem] text-[#6F6B61]">Portraits and studio photography</p>
          </div>
          <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 text-center space-y-2">
            <Folder className="size-6 text-[#68705A] mx-auto" />
            <h4 className="font-bold text-xs text-[#292923]">Bonus Assets</h4>
            <p className="text-[0.7rem] text-[#6F6B61]">PDF guides and material cheat sheets</p>
          </div>
        </div>

        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          📌 <strong>Phase 5 Shell Active:</strong> Supabase Storage bucket integration, drag-and-drop file uploads, and CDN URL generation will be wired in future phases.
        </div>
      </div>
    </div>
  );
}
