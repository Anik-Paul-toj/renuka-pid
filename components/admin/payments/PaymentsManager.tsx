"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Eye,
  AlertTriangle,
  IndianRupee,
  ShieldCheck,
  RotateCcw,
  Layers,
  GraduationCap,
} from "lucide-react";
import type {
  AdminPaymentListItem,
  AdminPaymentsListResult,
  AdminPaymentDetail,
} from "@/lib/payments-admin/service";

function formatPaiseToInr(amountPaise: number): string {
  const integerPart = Math.floor(amountPaise / 100);
  const fractionalPart = (amountPaise % 100).toString().padStart(2, "0");
  const formattedInteger = integerPart.toLocaleString("en-IN");
  return `₹${formattedInteger}.${fractionalPart}`;
}

function formatDateTimeIST(isoStr: string): { date: string; time: string } {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return { date: isoStr, time: "" };
    const date = d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  } catch {
    return { date: isoStr, time: "" };
  }
}

interface PaymentsManagerProps {
  initialData: AdminPaymentsListResult;
}

export function PaymentsManager({ initialData }: PaymentsManagerProps) {
  const [payments, setPayments] = useState<AdminPaymentListItem[]>(initialData.payments);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [summary, setSummary] = useState(initialData.summary);
  const [availableCourses] = useState(initialData.availableCourses);
  const [availableBatches] = useState(initialData.availableBatches);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [courseId, setCourseId] = useState<string>("all");
  const [batchId, setBatchId] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detail Modal state
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<AdminPaymentDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch payments from API
  const fetchPayments = useCallback(
    async (pageToFetch: number = 1) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({
          page: pageToFetch.toString(),
          limit: "20",
          search: debouncedSearch.trim(),
          status,
          courseId,
          batchId,
          from: from.trim(),
          to: to.trim(),
        });

        const res = await fetch(`/api/admin/payments?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMessage(data?.error?.message || "Failed to load payments directory.");
          setIsLoading(false);
          return;
        }

        setPayments(data.data.payments);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
      } catch {
        setErrorMessage("Network error loading payments directory.");
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, status, courseId, batchId, from, to]
  );

  // Re-fetch on filter or search changes
  useEffect(() => {
    fetchPayments(1);
  }, [debouncedSearch, status, courseId, batchId, from, to, fetchPayments]);

  // Open detail view
  const handleOpenDetail = async (id: string) => {
    setSelectedPaymentId(id);
    setPaymentDetail(null);
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const res = await fetch(`/api/admin/payments/${id}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setDetailError(data?.error?.message || "Failed to load payment details.");
        setIsDetailLoading(false);
        return;
      }

      setPaymentDetail(data.data);
    } catch {
      setDetailError("Network error loading payment details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedPaymentId(null);
    setPaymentDetail(null);
    setDetailError(null);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setCourseId("all");
    setBatchId("all");
    setFrom("");
    setTo("");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    courseId !== "all" ||
    batchId !== "all" ||
    from !== "" ||
    to !== "";

  // Render Status Badge
  const renderStatusBadge = (st: string) => {
    switch (st) {
      case "captured":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 border border-emerald-300/40 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-800">
            <CheckCircle2 className="size-3 text-emerald-600" />
            Captured
          </span>
        );
      case "created":
      case "authorized":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/70 border border-amber-300/40 px-2 py-0.5 text-[0.7rem] font-semibold text-amber-800">
            <Clock className="size-3 text-amber-600" />
            {st.charAt(0).toUpperCase() + st.slice(1)}
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/70 border border-rose-300/40 px-2 py-0.5 text-[0.7rem] font-semibold text-rose-800">
            <XCircle className="size-3 text-rose-600" />
            Failed
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100/70 border border-purple-300/40 px-2 py-0.5 text-[0.7rem] font-semibold text-purple-800">
            <RotateCcw className="size-3 text-purple-600" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2 py-0.5 text-[0.7rem] font-medium text-stone-600">
            {st}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
              <CreditCard className="size-3" />
              <span>Financial Audit & Reconciliation</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#292923]">
              Payments & Orders
            </h1>
            <p className="text-xs text-[#6F6B61] mt-1">
              Read-only transaction ledger, Razorpay verification audit, capture reconciliation, and state consistency checks.
            </p>
          </div>
          <button
            onClick={() => fetchPayments(pagination.page)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 self-start md:self-auto px-3 py-1.5 rounded-lg border border-[#464137]/20 bg-white/70 hover:bg-white text-xs font-medium text-[#464137] transition-colors disabled:opacity-50"
            title="Refresh payments list"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Reconciliation Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Captured Revenue */}
        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#68705A]">
            <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Captured Revenue</span>
            <IndianRupee className="size-4" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-[#292923]">
              {formatPaiseToInr(summary.totalCapturedAmountPaise)}
            </span>
            <span className="block text-[0.65rem] text-[#6F6B61] mt-0.5">Authoritative captured sum</span>
          </div>
        </div>

        {/* Captured Count */}
        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Captured</span>
            <CheckCircle2 className="size-4" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-[#292923]">{summary.capturedCount}</span>
            <span className="block text-[0.65rem] text-[#6F6B61] mt-0.5">Successful transactions</span>
          </div>
        </div>

        {/* Total Records */}
        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#464137]">
            <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Total Records</span>
            <Layers className="size-4" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-[#292923]">{summary.totalCount}</span>
            <span className="block text-[0.65rem] text-[#6F6B61] mt-0.5">All payment intents</span>
          </div>
        </div>

        {/* Failed Count */}
        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Failed</span>
            <XCircle className="size-4" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-[#292923]">{summary.failedCount}</span>
            <span className="block text-[0.65rem] text-[#6F6B61] mt-0.5">Declined or aborted</span>
          </div>
        </div>

        {/* Pending / Created Count */}
        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="size-4" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-[#292923]">{summary.pendingCount}</span>
            <span className="block text-[0.65rem] text-[#6F6B61] mt-0.5">Created or authorized</span>
          </div>
        </div>

        {/* Discrepancies */}
        <div
          className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between ${
            summary.discrepancyCount > 0
              ? "bg-amber-50/80 border-amber-300"
              : "bg-[#FAF8F2] border-[#464137]/15"
          }`}
        >
          <div
            className={`flex items-center justify-between ${
              summary.discrepancyCount > 0 ? "text-amber-800" : "text-[#68705A]"
            }`}
          >
            <span className="text-[0.68rem] font-semibold uppercase tracking-wider">Audit Flags</span>
            {summary.discrepancyCount > 0 ? (
              <AlertTriangle className="size-4 text-amber-600 animate-pulse" />
            ) : (
              <ShieldCheck className="size-4 text-emerald-600" />
            )}
          </div>
          <div className="mt-2">
            <span
              className={`text-xl font-bold ${
                summary.discrepancyCount > 0 ? "text-amber-900" : "text-[#292923]"
              }`}
            >
              {summary.discrepancyCount}
            </span>
            <span className="block text-[0.65rem] text-[#6F6B61] mt-0.5">
              {summary.discrepancyCount > 0 ? "State mismatches detected" : "All records consistent"}
            </span>
          </div>
        </div>
      </div>

      {/* Discrepancy Notice Banner */}
      {summary.discrepancyCount > 0 && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300/80 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="size-4 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Reconciliation Notice:</span>{" "}
            {summary.discrepancyCount} payment record(s) currently show state or amount discrepancies with their linked bookings.
            Review the tagged rows below for details. (Note: Payment management is read-only; no records are automatically mutated).
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6F6B61]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Payment ID, Order ID, Booking Ref, Customer..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-[#464137]/20 bg-white placeholder-[#6F6B61]/60 focus:outline-none focus:ring-2 focus:ring-[#68705A]/30 focus:border-[#68705A]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F6B61] hover:text-[#292923]"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="size-3.5 text-[#6F6B61]" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs rounded-lg border border-[#464137]/20 bg-white px-2.5 py-2 text-[#292923] focus:outline-none focus:ring-2 focus:ring-[#68705A]/30"
            >
              <option value="all">All Statuses</option>
              <option value="captured">Captured</option>
              <option value="created">Created</option>
              <option value="authorized">Authorized</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Batch Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="size-3.5 text-[#6F6B61]" />
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="text-xs rounded-lg border border-[#464137]/20 bg-white px-2.5 py-2 text-[#292923] focus:outline-none focus:ring-2 focus:ring-[#68705A]/30 max-w-[180px] truncate"
            >
              <option value="all">All Batches</option>
              {availableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchName} ({b.startDate})
                </option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <GraduationCap className="size-3.5 text-[#6F6B61]" />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="text-xs rounded-lg border border-[#464137]/20 bg-white px-2.5 py-2 text-[#292923] focus:outline-none focus:ring-2 focus:ring-[#68705A]/30 max-w-[160px] truncate"
            >
              <option value="all">All Courses</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range & Clear Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#464137]/10 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#6F6B61] text-[0.7rem] font-medium uppercase tracking-wider">Date Range:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-xs rounded-lg border border-[#464137]/20 bg-white px-2 py-1 text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A]"
              title="From date"
            />
            <span className="text-[#6F6B61]">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-xs rounded-lg border border-[#464137]/20 bg-white px-2 py-1 text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A]"
              title="To date"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-[0.72rem] text-[#6F6B61] hover:text-[#292923] font-medium transition-colors"
            >
              <RotateCcw className="size-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Payments Table */}
      <div className="rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#464137]/15 bg-[#F4EFE6]/60 text-[#464137] uppercase tracking-wider text-[0.68rem] font-semibold">
                <th className="py-3 px-4">Payment ID / Order ID</th>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Course & Batch</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audit</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#464137]/10 text-[#292923]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#6F6B61]">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="size-5 animate-spin text-[#68705A]" />
                      <span>Loading payments directory...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#6F6B61]">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="size-8 text-[#6F6B61]/40" />
                      <span className="font-medium text-sm text-[#464137]">No payment records found</span>
                      <span className="text-xs text-[#6F6B61]">
                        {hasActiveFilters
                          ? "Try adjusting your search criteria or resetting filters."
                          : "No transactions currently logged in the ledger."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/60 transition-colors">
                    {/* Payment & Order IDs */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-[#292923]">
                        {p.razorpayPaymentId || (
                          <span className="text-[#6F6B61] italic text-[0.7rem]">—</span>
                        )}
                      </div>
                      <div className="font-mono text-[0.68rem] text-[#6F6B61]">
                        {p.razorpayOrderId}
                      </div>
                    </td>

                    {/* Booking Reference */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-[#464137] bg-white/70 px-1.5 py-0.5 rounded border border-[#464137]/10">
                        {p.bookingReference}
                      </span>
                      <span className="block text-[0.65rem] text-[#6F6B61] mt-0.5">
                        Booking: {p.bookingStatus}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#292923]">{p.customerName}</div>
                      <div className="text-[0.68rem] text-[#6F6B61] flex items-center gap-1">
                        <Mail className="size-2.5" />
                        <span>{p.customerEmail}</span>
                      </div>
                    </td>

                    {/* Course & Batch */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#292923] truncate max-w-[160px]">
                        {p.courseTitle}
                      </div>
                      <div className="text-[0.68rem] text-[#6F6B61] truncate max-w-[160px]">
                        {p.batchName}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#292923]">
                        {formatPaiseToInr(p.amountPaise)}
                      </span>
                      <span className="block text-[0.65rem] text-[#6F6B61]">
                        {p.amountPaise} paise
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderStatusBadge(p.status)}
                    </td>

                    {/* Discrepancy indicator */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.hasDiscrepancy ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.65rem] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                          title={p.discrepancyReasons.join("; ")}
                        >
                          <AlertTriangle className="size-2.5 text-amber-700" />
                          Discrepancy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[0.65rem] text-emerald-700 font-medium">
                          <CheckCircle2 className="size-2.5 text-emerald-600" />
                          Consistent
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td
                      suppressHydrationWarning
                      className="py-3 px-4 whitespace-nowrap text-[#6F6B61] text-[0.72rem]"
                    >
                      <div suppressHydrationWarning>
                        {formatDateTimeIST(p.createdAt).date}
                      </div>
                      <div
                        suppressHydrationWarning
                        className="text-[0.65rem] text-[#6F6B61]/80"
                      >
                        {formatDateTimeIST(p.createdAt).time}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(p.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#464137]/20 bg-white/70 hover:bg-white text-xs font-medium text-[#464137] transition-colors"
                        title="View audit details"
                      >
                        <Eye className="size-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-[#464137]/15 bg-[#F7F4EC]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6F6B61]">
          <div>
            Showing{" "}
            <span className="font-semibold text-[#292923]">
              {pagination.totalCount === 0
                ? 0
                : (pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-[#292923]">
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#292923]">
              {pagination.totalCount}
            </span>{" "}
            transactions (Page {pagination.page} of {pagination.totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPayments(pagination.page - 1)}
              disabled={!pagination.hasPrevious || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#464137]/20 bg-white/80 hover:bg-white text-xs font-medium text-[#464137] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => fetchPayments(pagination.page + 1)}
              disabled={!pagination.hasNext || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#464137]/20 bg-white/80 hover:bg-white text-xs font-medium text-[#464137] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Payment Detail Slide-over / Modal */}
      {selectedPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#FAF8F2] border border-[#464137]/20 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#464137]/15 flex items-center justify-between bg-[#F4EFE6]/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#C8D1C7]/50 text-[#68705A]">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#292923]">
                    Payment Audit Inspection
                  </h3>
                  <p className="text-[0.7rem] text-[#6F6B61]">
                    Transaction ID: <span className="font-mono">{selectedPaymentId}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-1.5 rounded-lg text-[#6F6B61] hover:text-[#292923] hover:bg-[#464137]/10 transition-colors"
                title="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {isDetailLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#6F6B61]">
                  <RefreshCw className="size-6 animate-spin text-[#68705A]" />
                  <span>Loading payment audit trail...</span>
                </div>
              ) : detailError ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  <span>{detailError}</span>
                </div>
              ) : paymentDetail ? (
                <>
                  {/* Discrepancy Warnings in Detail */}
                  {paymentDetail.reconciliation.hasDiscrepancy && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-xs text-amber-950">
                        <AlertTriangle className="size-4 text-amber-700" />
                        <span>State Discrepancy Flagged</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-xs">
                        {paymentDetail.reconciliation.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                      <p className="text-[0.68rem] text-amber-800/80 pt-1">
                        Notice: This is a diagnostic flag for administrator review. No records have been modified.
                      </p>
                    </div>
                  )}

                  {/* Section 1: Financial & Gateway Identifiers */}
                  <div className="p-4 rounded-xl bg-white/70 border border-[#464137]/10 space-y-3">
                    <div className="text-[0.68rem] font-bold uppercase tracking-wider text-[#68705A] flex items-center gap-1.5">
                      <IndianRupee className="size-3.5" />
                      <span>Financial & Gateway Identifiers</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Razorpay Payment ID</span>
                        <span className="font-mono font-semibold text-[#292923]">
                          {paymentDetail.razorpayPaymentId || "None (Not captured)"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Razorpay Order ID</span>
                        <span className="font-mono font-semibold text-[#292923]">
                          {paymentDetail.razorpayOrderId}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Payment Status</span>
                        <div className="mt-0.5">{renderStatusBadge(paymentDetail.status)}</div>
                      </div>
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Amount</span>
                        <span className="text-sm font-bold text-[#292923]">
                          {formatPaiseToInr(paymentDetail.amountPaise)}
                        </span>
                        <span className="text-[0.65rem] text-[#6F6B61] ml-1">
                          ({paymentDetail.amountPaise} {paymentDetail.currency})
                        </span>
                      </div>
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Created At</span>
                        <span className="text-[#292923]">
                          {formatDateTimeIST(paymentDetail.createdAt).date}{" "}
                          {formatDateTimeIST(paymentDetail.createdAt).time}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Updated At</span>
                        <span className="text-[#292923]">
                          {formatDateTimeIST(paymentDetail.updatedAt).date}{" "}
                          {formatDateTimeIST(paymentDetail.updatedAt).time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Diagnostics & Sanitized Provider Details */}
                  <div className="p-4 rounded-xl bg-white/70 border border-[#464137]/10 space-y-3">
                    <div className="text-[0.68rem] font-bold uppercase tracking-wider text-[#68705A] flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5" />
                      <span>Diagnostics & Acquirer Data</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Payment Method</span>
                        <span className="font-medium text-[#292923] capitalize">
                          {paymentDetail.providerPaymentMethod || "Standard Gateway"}
                        </span>
                      </div>

                      {paymentDetail.acquirerData?.rrn && (
                        <div>
                          <span className="block text-[0.68rem] text-[#6F6B61]">Bank RRN / UTR</span>
                          <span className="font-mono text-[#292923]">
                            {paymentDetail.acquirerData.rrn}
                          </span>
                        </div>
                      )}

                      {paymentDetail.acquirerData?.bankTransactionId && (
                        <div>
                          <span className="block text-[0.68rem] text-[#6F6B61]">Bank Transaction ID</span>
                          <span className="font-mono text-[#292923]">
                            {paymentDetail.acquirerData.bankTransactionId}
                          </span>
                        </div>
                      )}

                      {paymentDetail.failureReason && (
                        <div className="col-span-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                          <span className="block font-semibold text-[0.68rem]">Failure Diagnostic:</span>
                          <span className="text-xs">{paymentDetail.failureReason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Customer Information */}
                  <div className="p-4 rounded-xl bg-white/70 border border-[#464137]/10 space-y-3">
                    <div className="text-[0.68rem] font-bold uppercase tracking-wider text-[#68705A] flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      <span>Customer Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Full Name</span>
                        <span className="font-medium text-[#292923]">{paymentDetail.customer.fullName}</span>
                      </div>
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Email</span>
                        <span className="text-[#292923]">{paymentDetail.customer.email}</span>
                      </div>
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Phone</span>
                        <span className="text-[#292923]">
                          {paymentDetail.customer.phone || paymentDetail.customer.whatsappPhone || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Associated Booking & Cohort */}
                  <div className="p-4 rounded-xl bg-white/70 border border-[#464137]/10 space-y-3">
                    <div className="text-[0.68rem] font-bold uppercase tracking-wider text-[#68705A] flex items-center gap-1.5">
                      <GraduationCap className="size-3.5" />
                      <span>Linked Registration</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Booking Reference</span>
                        <span className="font-mono font-semibold text-[#292923]">
                          {paymentDetail.booking.bookingReference}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Booking Status</span>
                        <span className="font-semibold capitalize text-[#292923]">
                          {paymentDetail.booking.status}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[0.68rem] text-[#6F6B61]">Course</span>
                        <span className="text-[#292923]">{paymentDetail.course.title}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[0.68rem] text-[#6F6B61]">Cohort Batch</span>
                        <span className="text-[#292923]">
                          {paymentDetail.batch.batchName} ({paymentDetail.batch.startDate})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Read-Only Audit Footnote */}
                  <div className="p-3 rounded-lg bg-[#EEE9DE]/60 border border-[#464137]/10 text-[0.7rem] text-[#6F6B61]">
                    🔒 <strong>Financial Audit Record:</strong> Payment ledger entries are immutable audit records. Direct state manipulation, manual captures, and manual status changes are prohibited to prevent payment gateway drift.
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#464137]/15 bg-[#F4EFE6]/60 flex items-center justify-end">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-1.5 rounded-lg border border-[#464137]/20 bg-white hover:bg-[#FAF8F2] text-xs font-medium text-[#464137] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
