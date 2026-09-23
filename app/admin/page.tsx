import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { LogoutButton } from "./LogoutButton";
import { ShieldCheck, UserCheck, KeyRound, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPortalPage() {
  const session = await getAdminSession();

  // Strict server-side enforcement: If not an active admin, redirect to login
  if (!session) {
    redirect("/admin/login");
  }

  const { adminProfile, user } = session;

  return (
    <div className="min-h-screen bg-[#F7F4EC] p-6 sm:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#464137]/10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#68705A]">
              <ShieldCheck className="size-3.5" />
              <span>Phase 4: Admin Authentication Active</span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#292923]">
              Admin Portal
            </h1>
          </div>

          <div>
            <LogoutButton />
          </div>
        </div>

        {/* Authenticated Profile Card */}
        <div className="paper-card p-6 sm:p-8 bg-[#FAF8F2] border border-[#464137]/15 rounded-xl shadow-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-[#C8D1C7]/50 text-[#68705A]">
              <UserCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#292923]">
                {adminProfile.full_name || "Administrator"}
              </h2>
              <p className="text-xs text-[#6F6B61]">{user.email}</p>
            </div>
          </div>

          {/* Session Attributes Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#464137]/10 text-xs">
            <div className="p-3.5 rounded-md bg-[#F7F4EC] border border-[#464137]/10">
              <span className="block text-[#6F6B61] uppercase tracking-wider text-[0.65rem] font-semibold mb-1">
                Assigned Role
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold uppercase tracking-wider bg-[#68705A] text-[#F7F4EC]">
                <KeyRound className="size-3" />
                {adminProfile.role}
              </span>
            </div>

            <div className="p-3.5 rounded-md bg-[#F7F4EC] border border-[#464137]/10">
              <span className="block text-[#6F6B61] uppercase tracking-wider text-[0.65rem] font-semibold mb-1">
                Account Status
              </span>
              <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-[#68705A]">
                <CheckCircle2 className="size-3.5" />
                Active Administrator
              </span>
            </div>

            <div className="p-3.5 rounded-md bg-[#F7F4EC] border border-[#464137]/10">
              <span className="block text-[#6F6B61] uppercase tracking-wider text-[0.65rem] font-semibold mb-1">
                Supabase User ID
              </span>
              <span className="font-mono text-[0.7rem] text-[#292923] truncate block" title={user.id}>
                {user.id}
              </span>
            </div>
          </div>

          <div className="rounded-md bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61] space-y-1.5">
            <p className="font-semibold text-[#292923]">Phase 4 Security Verification Checklist:</p>
            <p>✔ Session is validated against Supabase Auth HTTP-only cookies.</p>
            <p>✔ Role and active status are verified server-side against <code className="text-[#68705A] font-mono">public.admin_users</code>.</p>
            <p>✔ Unauthenticated requests to <code className="text-[#68705A] font-mono">/admin/*</code> are redirected to <code className="text-[#68705A] font-mono">/admin/login</code>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
