import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { CreditCard, IndianRupee, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
          <CreditCard className="size-3" />
          <span>Transactions & Billing</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#292923]">Payments & Orders</h1>
        <p className="text-xs text-[#6F6B61] mt-1">
          Review Razorpay transaction receipts, order IDs, capture statuses, and payment snapshots.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-[#292923]">Razorpay Payment Gateway</span>
            <span className="text-[0.7rem] text-[#6F6B61]">Webhook & signature verification backend active</span>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#C8D1C7]/50 text-[#68705A]">
            Active Gateway
          </span>
        </div>

        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          📌 <strong>Phase 5 Shell Active:</strong> Live transaction log, refund processing, and financial summaries will be wired in future phases.
        </div>
      </div>
    </div>
  );
}
