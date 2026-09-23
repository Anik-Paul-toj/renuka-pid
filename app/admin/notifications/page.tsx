import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { Bell, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
          <Bell className="size-3" />
          <span>Audit & Delivery Logs</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#292923]">Notifications & Delivery Logs</h1>
        <p className="text-xs text-[#6F6B61] mt-1">
          Audit email and WhatsApp dispatch history, webhook delivery statuses, and provider error traces.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 flex items-center gap-3">
          <FileText className="size-5 text-[#68705A]" />
          <div>
            <h4 className="font-bold text-xs text-[#292923]">Notification Audit Trail</h4>
            <p className="text-[0.7rem] text-[#6F6B61]">Tracks sent, delivered, opened, and failed message events</p>
          </div>
        </div>

        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          📌 <strong>Phase 5 Shell Active:</strong> Live log filter, retry triggers, and webhook inspection tables will be wired in future phases.
        </div>
      </div>
    </div>
  );
}
