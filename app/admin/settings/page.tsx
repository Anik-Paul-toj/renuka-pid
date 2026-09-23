import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { Settings, ShieldCheck, KeyRound, Lock, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#68705A] px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#FAF8F2] mb-2">
          <KeyRound className="size-3" />
          <span>Studio Administration</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#292923]">Admin & Studio Settings</h1>
        <p className="text-xs text-[#6F6B61] mt-1">
          Manage administrator team members, studio metadata, and system environment configurations.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="p-4 rounded-lg bg-[#F7F4EC] border border-[#464137]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="size-5 text-[#68705A]" />
            <div>
              <h4 className="font-bold text-xs text-[#292923]">Admin Team Roles</h4>
              <p className="text-[0.7rem] text-[#6F6B61]">Manage super_admin, admin, and editor permissions in public.admin_users</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#68705A] text-[#FAF8F2]">
            Protected
          </span>
        </div>

        <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61]">
          🔒 <strong>Security Guarantee:</strong> Supabase service-role keys, Razorpay API secrets, and webhook secrets are strictly protected on the backend server and are never exposed or editable directly through the browser.
        </div>
      </div>
    </div>
  );
}
