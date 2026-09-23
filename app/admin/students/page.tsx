import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { Users, Mail, Phone, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
          <Users className="size-3" />
          <span>Customer Directory</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#292923]">Registered Students</h1>
        <p className="text-xs text-[#6F6B61] mt-1">
          Search and view student profiles, contact details (email, WhatsApp), and enrollment histories.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 text-xs text-[#6F6B61]">
          <Search className="size-4" />
          <span>Search directory by student name, email, or phone number...</span>
        </div>

        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          📌 <strong>Phase 5 Shell Active:</strong> Real-time student query list, pagination, CSV exports, and attendee profile views will be connected in future phases.
        </div>
      </div>
    </div>
  );
}
