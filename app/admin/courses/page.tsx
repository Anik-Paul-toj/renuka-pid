import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { GraduationCap, Tag, Clock, IndianRupee } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
          <GraduationCap className="size-3" />
          <span>Course Management</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#292923]">Courses & Workshops</h1>
        <p className="text-xs text-[#6F6B61] mt-1">
          Configure workshop titles, descriptions, pricing rules (stored in integer paise), and duration.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-[#68705A] text-[#FAF8F2]">
              Active Course
            </span>
            <h3 className="font-bold text-sm text-[#292923]">The Art of Watercolors Masterclass</h3>
            <p className="text-xs text-[#6F6B61]">Slug: <code className="font-mono">watercolor-masterclass</code> • Duration: 150 mins</p>
          </div>
          <div className="text-right sm:text-left">
            <span className="block text-xs font-semibold text-[#6F6B61]">Pricing</span>
            <span className="text-sm font-bold text-[#292923]">₹199 <span className="line-through text-xs text-[#6F6B61]">₹599</span></span>
          </div>
        </div>

        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          📌 <strong>Note:</strong> Course curriculum and pricing rules are synchronized with active cohort batches.
        </div>
      </div>
    </div>
  );
}
