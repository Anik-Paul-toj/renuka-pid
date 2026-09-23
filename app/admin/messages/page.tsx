import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { Mail, MessageSquare, Send } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
          <Mail className="size-3" />
          <span>Communications</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#292923]">Message Templates</h1>
        <p className="text-xs text-[#6F6B61] mt-1">
          Configure email and WhatsApp transactional notification templates (Booking confirmation, reminders, materials).
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-[#292923]">booking_confirmation</span>
              <span className="text-[0.7rem] text-[#6F6B61]">Channels: Email & WhatsApp • Automated upon payment</span>
            </div>
            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-[#68705A] text-[#FAF8F2]">Active</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-[#292923]">workshop_reminder_24h</span>
              <span className="text-[0.7rem] text-[#6F6B61]">Channels: Email & WhatsApp • Includes Zoom link & checklist</span>
            </div>
            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-[#68705A] text-[#FAF8F2]">Active</span>
          </div>
        </div>

        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          📌 <strong>Phase 5 Shell Active:</strong> Dynamic template editor, variable tags, and test message triggers will be wired in future phases.
        </div>
      </div>
    </div>
  );
}
