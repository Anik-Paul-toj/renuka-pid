import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth/admin";
import {
  Users,
  Calendar,
  Ticket,
  CreditCard,
  PanelTop,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  GraduationCap,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const { adminProfile } = session;

  const stats = [
    {
      label: "Registered Students",
      value: "1,248",
      subtext: "Across all past & current cohorts",
      icon: Users,
      color: "bg-[#C8D1C7]/30 text-[#68705A]",
    },
    {
      label: "Active Workshop",
      value: "Watercolor Masterclass",
      subtext: "Batch 01 • Oct 2026",
      icon: GraduationCap,
      color: "bg-[#EEE9DE] text-[#464137]",
    },
    {
      label: "Seats Reserved",
      value: "84 / 100",
      subtext: "16 seats remaining in batch",
      icon: Ticket,
      color: "bg-[#68705A]/15 text-[#68705A]",
    },
    {
      label: "Collected Revenue",
      value: "₹1,67,160",
      subtext: "Processed via Razorpay",
      icon: CreditCard,
      color: "bg-[#C8D1C7]/40 text-[#292923]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A]">
            <Sparkles className="size-3" />
            <span>Studio Administration</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#292923]">
            Welcome, {adminProfile.full_name || "Administrator"}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F6B61]">
            Manage your masterclass content, monitor student enrollments, and configure workshop batches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/landing-page"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#68705A] text-[#FAF8F2] text-xs font-semibold hover:bg-[#58604C] transition-all shadow-sm"
          >
            <PanelTop className="size-4" />
            <span>Open Landing CMS</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6F6B61]">
                  {stat.label}
                </span>
                <div className={`grid size-8 place-items-center rounded-lg ${stat.color}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-[#292923] truncate">
                  {stat.value}
                </div>
                <p className="text-[0.7rem] text-[#6F6B61] mt-0.5">{stat.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action & Section Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/landing-page"
          className="group p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 hover:border-[#68705A] transition-all shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="grid size-10 place-items-center rounded-lg bg-[#C8D1C7]/30 text-[#68705A] group-hover:bg-[#68705A] group-hover:text-[#FAF8F2] transition-colors">
              <PanelTop className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#6F6B61] group-hover:text-[#68705A] transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#292923] group-hover:text-[#68705A] transition-colors">
              Landing Page CMS
            </h3>
            <p className="text-xs text-[#6F6B61] mt-1">
              Edit all 18 sections of the live workshop page including Hero, FAQ, and Pricing.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/batches"
          className="group p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 hover:border-[#68705A] transition-all shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="grid size-10 place-items-center rounded-lg bg-[#EEE9DE] text-[#464137] group-hover:bg-[#68705A] group-hover:text-[#FAF8F2] transition-colors">
              <Calendar className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#6F6B61] group-hover:text-[#68705A] transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#292923] group-hover:text-[#68705A] transition-colors">
              Batches & Schedule
            </h3>
            <p className="text-xs text-[#6F6B61] mt-1">
              Configure masterclass workshop dates, Zoom credentials, and seat limits.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/bookings"
          className="group p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 hover:border-[#68705A] transition-all shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="grid size-10 place-items-center rounded-lg bg-[#68705A]/15 text-[#68705A] group-hover:bg-[#68705A] group-hover:text-[#FAF8F2] transition-colors">
              <Ticket className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#6F6B61] group-hover:text-[#68705A] transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#292923] group-hover:text-[#68705A] transition-colors">
              Bookings & Students
            </h3>
            <p className="text-xs text-[#6F6B61] mt-1">
              Review real-time attendee registrations, payments, and seat allocations.
            </p>
          </div>
        </Link>
      </div>

      {/* System Status & Architecture Overview Card */}
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#68705A] uppercase tracking-wider">
          <ShieldCheck className="size-4" />
          <span>System & Backend Architecture Overview</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#6F6B61]">
          <div className="p-3.5 rounded-lg bg-[#F7F4EC] border border-[#464137]/10">
            <span className="block font-semibold text-[#292923] mb-1">Database & Storage</span>
            <span>Supabase PostgreSQL with RLS, atomic seat locking, and encrypted secrets.</span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F7F4EC] border border-[#464137]/10">
            <span className="block font-semibold text-[#292923] mb-1">Authoritative Gate</span>
            <span>Server-side verification against <code className="font-mono text-[#68705A]">public.admin_users</code>.</span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F7F4EC] border border-[#464137]/10">
            <span className="block font-semibold text-[#292923] mb-1">Navigation Shell</span>
            <span>12 dedicated management modules structured and ready for implementation.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
