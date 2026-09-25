import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { Calendar, Video, Clock, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBatchesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
          <Calendar className="size-3" />
          <span>Cohort Scheduling</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#292923]">Batches & Schedule</h1>
        <p className="text-xs text-[#6F6B61] mt-1">
          Manage upcoming workshop cohort dates, timings, Zoom integration credentials, and seat limits.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#292923]">Batch 01 — October Live Workshop</h3>
            <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-[#68705A] text-[#FAF8F2]">
              Enrollment Open
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#6F6B61]">
            <div><strong>Timing:</strong> 4:00 PM – 6:30 PM IST</div>
            <div><strong>Seats:</strong> 100 total capacity</div>
            <div><strong>Zoom:</strong> Private (Admin configured)</div>
          </div>
        </div>

        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          📌 <strong>Note:</strong> Batch schedules and seat reservations are linked directly to the live booking engine.
        </div>
      </div>
    </div>
  );
}
