import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { Ticket, CheckCircle2, Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
          <Ticket className="size-3" />
          <span>Seat Management</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#292923]">Seat Bookings</h1>
        <p className="text-xs text-[#6F6B61] mt-1">
          Monitor seat reservations, atomic seat hold statuses, booking confirmations, and cancellations.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 flex items-center gap-3">
            <CheckCircle2 className="size-5 text-[#68705A]" />
            <div>
              <span className="block text-xs font-bold text-[#292923]">Confirmed</span>
              <span className="text-[0.7rem] text-[#6F6B61]">Paid & verified seats</span>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 flex items-center gap-3">
            <Clock className="size-5 text-[#6F6B61]" />
            <div>
              <span className="block text-xs font-bold text-[#292923]">Pending</span>
              <span className="text-[0.7rem] text-[#6F6B61]">15-min atomic holds</span>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 flex items-center gap-3">
            <XCircle className="size-5 text-[#A24B4B]" />
            <div>
              <span className="block text-xs font-bold text-[#292923]">Cancelled / Expired</span>
              <span className="text-[0.7rem] text-[#6F6B61]">Released back to pool</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          📌 <strong>Phase 5 Shell Active:</strong> Live booking table, atomic release triggers, and manual booking overrides will be connected in future phases.
        </div>
      </div>
    </div>
  );
}
