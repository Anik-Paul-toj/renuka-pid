import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth/admin";
import { getDashboardMetrics } from "@/lib/dashboard/service";
import {
  Users,
  Calendar,
  Ticket,
  CreditCard,
  PanelTop,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Send,
  MessageSquare,
  Settings,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatPaiseToINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { adminProfile } = session;
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8 pb-12">
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
            Real-time workshop enrollments, payment revenue, and delivery health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/landing-page"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#68705A] text-[#FAF8F2] text-xs font-semibold hover:bg-[#58604C] transition-all shadow-xs"
          >
            <PanelTop className="size-4" />
            <span>Landing CMS</span>
          </Link>
          <Link
            href="/admin/broadcast"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#464137]/20 text-[#292923] text-xs font-semibold hover:bg-[#FAF8F2] transition-all shadow-xs"
          >
            <Send className="size-3.5 text-[#68705A]" />
            <span>Send Broadcast</span>
          </Link>
        </div>
      </div>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Students */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6F6B61]">
              Total Students
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-[#C8D1C7]/30 text-[#68705A]">
              <Users className="size-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#292923]">
              {metrics.totalStudents.toLocaleString()}
            </div>
            <p className="text-[0.7rem] text-[#6F6B61] mt-0.5">
              Verified attendee customer profiles
            </p>
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6F6B61]">
              Confirmed Bookings
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-[#68705A]/15 text-[#68705A]">
              <Ticket className="size-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#292923]">
              {metrics.confirmedBookings.toLocaleString()}
            </div>
            <p className="text-[0.7rem] text-[#6F6B61] mt-0.5">
              {metrics.pendingBookings} pending reservation{metrics.pendingBookings === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Captured Revenue */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6F6B61]">
              Captured Revenue
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-[#C8D1C7]/40 text-[#292923]">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#292923]">
              {formatPaiseToINR(metrics.totalCapturedRevenuePaise)}
            </div>
            <p className="text-[0.7rem] text-[#6F6B61] mt-0.5">
              Strict integer paise Razorpay reconciliation
            </p>
          </div>
        </div>

        {/* Upcoming Workshop Batch */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6F6B61]">
              Upcoming Batch
            </span>
            <div className="grid size-8 place-items-center rounded-lg bg-[#EEE9DE] text-[#464137]">
              <Calendar className="size-4" />
            </div>
          </div>
          <div>
            <div className="font-serif text-base sm:text-lg font-bold text-[#292923] truncate">
              {metrics.upcomingBatch ? metrics.upcomingBatch.batchName : "No Open Batches"}
            </div>
            <p className="text-[0.7rem] text-[#6F6B61] mt-0.5">
              {metrics.upcomingBatch ? (
                <>
                  <span className="font-bold text-[#68705A]">{metrics.upcomingBatch.seatsRemaining}</span> seats remaining of {metrics.upcomingBatch.totalSeats}
                </>
              ) : (
                "Configure new batch in Batches"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Failed Notifications Alert Banner (if any) */}
      {metrics.failedNotificationsCount > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-[#FBEAE5] border border-[#C25443]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-[#C25443] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#8C2C1D]">
                {metrics.failedNotificationsCount} Failed Notification Delivery Attempt{metrics.failedNotificationsCount === 1 ? "" : "s"}
              </h4>
              <p className="text-[0.75rem] text-[#8C2C1D]/90 mt-0.5">
                Some confirmation or reminder emails encountered transmission errors and may require retry.
              </p>
            </div>
          </div>
          <Link
            href="/admin/notifications?status=failed"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C25443] hover:bg-[#A84435] text-white text-xs font-bold transition-colors shrink-0"
          >
            <span>Review &amp; Retry Logs</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Real Recent Activity: Bookings & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#464137]/10 pb-3">
            <div className="flex items-center gap-2">
              <Ticket className="size-4 text-[#68705A]" />
              <h3 className="font-serif text-base font-bold text-[#292923]">Recent Bookings</h3>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-[#68705A] hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>

          {metrics.recentBookings.length === 0 ? (
            <p className="text-xs text-[#6F6B61] py-4 text-center">No bookings recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-lg bg-white border border-[#464137]/10 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono font-bold text-[#292923]">{b.bookingReference}</div>
                    <div className="text-[0.7rem] text-[#6F6B61]">{b.customerName} ({b.customerEmail})</div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold text-[#292923]">{formatPaiseToINR(b.amountPaise)}</div>
                    <span
                      className={`inline-block text-[0.65rem] font-bold px-2 py-0.5 rounded capitalize ${
                        b.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : b.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#464137]/10 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-[#68705A]" />
              <h3 className="font-serif text-base font-bold text-[#292923]">Recent Payments</h3>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs font-bold text-[#68705A] hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>

          {metrics.recentPayments.length === 0 ? (
            <p className="text-xs text-[#6F6B61] py-4 text-center">No payment transactions recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg bg-white border border-[#464137]/10 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono font-bold text-[#292923] truncate max-w-[180px]">
                      {p.razorpayPaymentId || "Processing"}
                    </div>
                    <div className="text-[0.7rem] text-[#6F6B61]">Ref: {p.bookingReference}</div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold text-[#292923]">{formatPaiseToINR(p.amountPaise)}</div>
                    <span
                      className={`inline-block text-[0.65rem] font-bold px-2 py-0.5 rounded capitalize ${
                        p.status === "captured"
                          ? "bg-green-100 text-green-800"
                          : p.status === "created"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Directory Grid to All Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/students"
          className="group p-5 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 hover:border-[#68705A] transition-all shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <Users className="size-5 text-[#68705A]" />
            <ArrowUpRight className="size-4 text-[#6F6B61] group-hover:text-[#68705A] transition-colors" />
          </div>
          <h4 className="font-bold text-xs text-[#292923] group-hover:text-[#68705A] transition-colors">
            Student Directory
          </h4>
          <p className="text-[0.7rem] text-[#6F6B61]">
            Attendee histories, contacts &amp; notes
          </p>
        </Link>

        <Link
          href="/admin/batches"
          className="group p-5 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 hover:border-[#68705A] transition-all shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <Calendar className="size-5 text-[#68705A]" />
            <ArrowUpRight className="size-4 text-[#6F6B61] group-hover:text-[#68705A] transition-colors" />
          </div>
          <h4 className="font-bold text-xs text-[#292923] group-hover:text-[#68705A] transition-colors">
            Batches &amp; Seats
          </h4>
          <p className="text-[0.7rem] text-[#6F6B61]">
            Capacity, Zoom links &amp; schedules
          </p>
        </Link>

        <Link
          href="/admin/messages"
          className="group p-5 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 hover:border-[#68705A] transition-all shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <MessageSquare className="size-5 text-[#68705A]" />
            <ArrowUpRight className="size-4 text-[#6F6B61] group-hover:text-[#68705A] transition-colors" />
          </div>
          <h4 className="font-bold text-xs text-[#292923] group-hover:text-[#68705A] transition-colors">
            Message Templates
          </h4>
          <p className="text-[0.7rem] text-[#6F6B61]">
            Confirmations &amp; workshop reminders
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="group p-5 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 hover:border-[#68705A] transition-all shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <Settings className="size-5 text-[#68705A]" />
            <ArrowUpRight className="size-4 text-[#6F6B61] group-hover:text-[#68705A] transition-colors" />
          </div>
          <h4 className="font-bold text-xs text-[#292923] group-hover:text-[#68705A] transition-colors">
            Studio Settings
          </h4>
          <p className="text-[0.7rem] text-[#6F6B61]">
            Metadata, contact info &amp; reply-to
          </p>
        </Link>
      </div>

      {/* Production Architecture & Security Certification Card */}
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#68705A] uppercase tracking-wider">
          <ShieldCheck className="size-4" />
          <span>Production Security &amp; Data Integrity</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#6F6B61]">
          <div className="p-3.5 rounded-lg bg-[#F7F4EC] border border-[#464137]/10">
            <span className="block font-semibold text-[#292923] mb-1">Encapsulated Secrets</span>
            <span>Razorpay secrets, Resend API keys, and Supabase service tokens remain strictly server-side.</span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F7F4EC] border border-[#464137]/10">
            <span className="block font-semibold text-[#292923] mb-1">Row-Level Security</span>
            <span>All administrative tables enforce authenticated Supabase RLS policies with active session guards.</span>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F7F4EC] border border-[#464137]/10">
            <span className="block font-semibold text-[#292923] mb-1">Concurrency &amp; Idempotency</span>
            <span>Atomic seat locking prevents over-enrollment; webhooks and notifications guarantee idempotent execution.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
