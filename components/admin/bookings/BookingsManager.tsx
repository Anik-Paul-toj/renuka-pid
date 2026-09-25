"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Ticket,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  CreditCard,
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
  Ban,
} from "lucide-react";
import {
  AdminBookingListItem,
  AdminBookingsListResult,
  AdminBookingDetail,
} from "@/lib/bookings-admin/service";

interface BookingsManagerProps {
  initialData: AdminBookingsListResult;
}

export function BookingsManager({ initialData }: BookingsManagerProps) {
  const [bookings, setBookings] = useState<AdminBookingListItem[]>(initialData.bookings);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [availableBatches] = useState(initialData.availableBatches);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [batchId, setBatchId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detail Modal state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<AdminBookingDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch bookings list from API
  const fetchBookings = useCallback(
    async (pageToFetch: number = 1) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({
          page: pageToFetch.toString(),
          limit: "20",
          search: debouncedSearch.trim(),
          status,
          paymentStatus,
          batchId,
        });

        const res = await fetch(`/api/admin/bookings?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMessage(data?.error?.message || "Failed to load bookings directory.");
          setIsLoading(false);
          return;
        }

        setBookings(data.data.bookings);
        setPagination(data.data.pagination);
      } catch {
        setErrorMessage("Network error loading bookings directory.");
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, status, paymentStatus, batchId]
  );

  // Re-fetch on filter/search change
  useEffect(() => {
    fetchBookings(1);
  }, [debouncedSearch, status, paymentStatus, batchId, fetchBookings]);

  // Open detail view
  const handleOpenDetail = async (id: string) => {
    setSelectedBookingId(id);
    setBookingDetail(null);
    setIsDetailLoading(true);
    setDetailError(null);
    setCancelFeedback(null);

    try {
      const res = await fetch(`/api/admin/bookings/${id}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setDetailError(data?.error?.message || "Failed to load booking details.");
        setIsDetailLoading(false);
        return;
      }

      setBookingDetail(data.data);
    } catch {
      setDetailError("Network error loading booking details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedBookingId(null);
    setBookingDetail(null);
    setDetailError(null);
    setCancelFeedback(null);
  };

  // Safe Cancel Action
  const handleCancelBooking = async () => {
    if (!bookingDetail) return;
    const confirmAction = window.confirm(
      `Are you sure you want to cancel booking ${bookingDetail.bookingReference}? This will atomically release the seat hold.`
    );
    if (!confirmAction) return;

    setIsCancelling(true);
    setCancelFeedback(null);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingDetail.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "admin_cancelled" }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCancelFeedback({
          success: false,
          message: data?.error?.message || "Failed to cancel booking.",
        });
        setIsCancelling(false);
        return;
      }

      setCancelFeedback({
        success: true,
        message: data.data.message || "Booking cancelled and seat released.",
      });

      // Update local detail state
      setBookingDetail((prev) =>
        prev
          ? {
              ...prev,
              bookingStatus: "cancelled",
              seatReleased: true,
            }
          : null
      );

      // Refresh directory list in background
      fetchBookings(pagination.page);
    } catch {
      setCancelFeedback({
        success: false,
        message: "Network error attempting cancellation.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedBookingId) {
        handleCloseDetail();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBookingId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
              <Ticket className="size-3" />
              <span>Seat & Reservation Ledger</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#292923]">Seat Bookings</h1>
            <p className="text-xs text-[#6F6B61] mt-1">
              Monitor customer reservations, atomic seat hold statuses, booking confirmations, and cancellations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-lg bg-[#EEE9DE] border border-[#464137]/10 text-xs font-semibold text-[#292923]">
              Total Bookings: {pagination.totalCount}
            </span>
            <button
              onClick={() => fetchBookings(pagination.page)}
              disabled={isLoading}
              className="p-2 rounded-lg bg-[#FAF8F2] border border-[#464137]/15 text-[#68705A] hover:bg-[#EEE9DE] transition-colors disabled:opacity-50"
              title="Refresh list"
            >
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6F6B61]" />
            <input
              type="text"
              placeholder="Search by reference (REF-...), student name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#464137]/15 bg-[#F7F4EC] text-xs text-[#292923] outline-none transition-all placeholder:text-[#6F6B61]/60 focus:border-[#68705A] focus:ring-1 focus:ring-[#68705A]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6F6B61] hover:text-[#292923]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Booking Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-[#464137]/15 bg-[#F7F4EC] px-3 py-2.5 text-xs text-[#292923] outline-none focus:border-[#68705A]"
            >
              <option value="all">All Booking Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full rounded-lg border border-[#464137]/15 bg-[#F7F4EC] px-3 py-2.5 text-xs text-[#292923] outline-none focus:border-[#68705A]"
            >
              <option value="all">All Payment Statuses</option>
              <option value="captured">Paid / Captured</option>
              <option value="created">Order Created</option>
              <option value="failed">Payment Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Batch Filter Row */}
        {availableBatches.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#464137]/10 text-xs">
            <span className="text-[#68705A] font-semibold text-[0.7rem] uppercase tracking-wider shrink-0">
              Filter by Batch:
            </span>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="rounded-lg border border-[#464137]/15 bg-[#F7F4EC] px-3 py-1.5 text-xs text-[#292923] outline-none focus:border-[#68705A] max-w-md"
            >
              <option value="all">All Cohort Batches</option>
              {availableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchName} ({b.startDate})
                </option>
              ))}
            </select>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Bookings Table */}
      <div className="rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#6F6B61] flex flex-col items-center justify-center gap-2">
            <RefreshCw className="size-6 animate-spin text-[#68705A]" />
            <span>Loading bookings directory...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-[#6F6B61] space-y-2">
            <Ticket className="size-8 mx-auto text-[#68705A]/50" />
            <p className="text-sm font-semibold text-[#292923]">No bookings found</p>
            <p className="text-xs">
              {search || status !== "all" || paymentStatus !== "all" || batchId !== "all"
                ? "Try adjusting your search query or filter options."
                : "No customer bookings have been recorded yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEE9DE]/60 text-[0.68rem] uppercase tracking-wider text-[#68705A] border-b border-[#464137]/10">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Booking Ref</th>
                  <th className="px-5 py-3.5 font-semibold">Student</th>
                  <th className="px-5 py-3.5 font-semibold">Workshop & Batch</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Amount</th>
                  <th className="px-5 py-3.5 font-semibold">Payment</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#464137]/10">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => handleOpenDetail(booking.id)}
                    className="hover:bg-[#F7F4EC] transition-colors cursor-pointer"
                  >
                    {/* Booking Reference */}
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-xs text-[#292923] bg-[#EEE9DE] px-2.5 py-1 rounded border border-[#464137]/10">
                        {booking.bookingReference}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4 space-y-0.5">
                      <div className="font-bold text-[#292923] text-sm">{booking.customerName}</div>
                      <div className="text-[0.68rem] text-[#6F6B61]">{booking.customerEmail}</div>
                      {booking.customerPhone && (
                        <div className="text-[0.68rem] text-[#68705A]">{booking.customerPhone}</div>
                      )}
                    </td>

                    {/* Course & Batch */}
                    <td className="px-5 py-4 space-y-0.5 max-w-[200px]">
                      <div className="font-semibold text-[#292923] truncate">{booking.courseTitle}</div>
                      <div className="text-[0.68rem] text-[#6F6B61] truncate">{booking.batchName}</div>
                      <div className="text-[0.65rem] text-[#68705A] font-medium">{booking.startDate}</div>
                    </td>

                    {/* Booking Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
                          booking.bookingStatus === "confirmed"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : booking.bookingStatus === "pending"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : booking.bookingStatus === "cancelled"
                            ? "bg-zinc-100 text-zinc-700 border border-zinc-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 font-bold text-[#292923]">
                      {booking.amountPaise === 0
                        ? "Complimentary"
                        : `₹${(booking.amountPaise / 100).toFixed(0)}`}
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-4 space-y-0.5">
                      {booking.paymentStatus ? (
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[0.62rem] font-bold uppercase tracking-wider ${
                              booking.paymentStatus === "captured"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : booking.paymentStatus === "failed"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {booking.paymentStatus}
                          </span>
                          {booking.razorpayPaymentId && (
                            <div className="font-mono text-[0.65rem] text-[#68705A] truncate max-w-[120px]">
                              {booking.razorpayPaymentId}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#6F6B61] text-[0.7rem]">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-[0.68rem] text-[#6F6B61] whitespace-nowrap">
                      {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(booking.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEE9DE] hover:bg-[#E3DCCB] text-[#292923] text-xs font-semibold transition-colors"
                      >
                        <Eye className="size-3.5 text-[#68705A]" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#F7F4EC] border-t border-[#464137]/10 flex items-center justify-between text-xs text-[#6F6B61]">
            <div>
              Showing{" "}
              <span className="font-semibold text-[#292923]">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#292923]">
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
              </span>{" "}
              of <span className="font-semibold text-[#292923]">{pagination.totalCount}</span>{" "}
              bookings
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchBookings(pagination.page - 1)}
                disabled={!pagination.hasPrevious || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF8F2] border border-[#464137]/15 text-[#292923] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EEE9DE] transition-colors"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-2 text-[#292923] font-semibold">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => fetchBookings(pagination.page + 1)}
                disabled={!pagination.hasNext || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF8F2] border border-[#464137]/15 text-[#292923] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EEE9DE] transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBookingId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            onClick={handleCloseDetail}
            className="fixed inset-0 bg-[#292923]/50 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#FAF8F2] p-6 shadow-2xl border border-[#464137]/15 z-10 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#464137]/10 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#68705A]">
                  Reservation Audit Record
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#292923] mt-1 font-mono">
                  {bookingDetail?.bookingReference || "Booking Details"}
                </h2>
                <p className="text-xs text-[#6F6B61]">
                  Created {bookingDetail ? new Date(bookingDetail.createdAt).toLocaleString("en-IN") : ""}
                </p>
              </div>

              <button
                onClick={handleCloseDetail}
                className="grid size-8 place-items-center rounded-full bg-[#EEE9DE] text-[#6F6B61] hover:text-[#292923] transition-colors"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Cancel Feedback Banner */}
            {cancelFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  cancelFeedback.success
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {cancelFeedback.success ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                )}
                <span>{cancelFeedback.message}</span>
              </div>
            )}

            {/* Loading / Error States */}
            {isDetailLoading ? (
              <div className="py-16 text-center text-xs text-[#6F6B61] flex flex-col items-center justify-center gap-2">
                <RefreshCw className="size-6 animate-spin text-[#68705A]" />
                <span>Loading booking records...</span>
              </div>
            ) : detailError ? (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {detailError}
              </div>
            ) : bookingDetail ? (
              <div className="space-y-6">
                {/* 1. Customer Information Card */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#68705A] mb-2.5">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F7F4EC] p-4 rounded-lg border border-[#464137]/10">
                    <div>
                      <span className="block text-[#6F6B61] text-[0.7rem]">Full Name</span>
                      <span className="font-semibold text-[#292923]">{bookingDetail.customer.fullName}</span>
                    </div>
                    <div>
                      <span className="block text-[#6F6B61] text-[0.7rem]">Email</span>
                      <span className="font-semibold text-[#292923]">{bookingDetail.customer.email}</span>
                    </div>
                    <div>
                      <span className="block text-[#6F6B61] text-[0.7rem]">Phone</span>
                      <span className="font-semibold text-[#292923]">
                        {bookingDetail.customer.phone || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[#6F6B61] text-[0.7rem]">WhatsApp Number</span>
                      <span className="font-semibold text-[#292923]">
                        {bookingDetail.customer.whatsappPhone || bookingDetail.customer.phone || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Booking Information Card */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#68705A] mb-2.5">
                    Reservation Details
                  </h3>
                  <div className="rounded-lg bg-[#FFFFFF] p-4 border border-[#464137]/15 shadow-xs space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#464137]/10 pb-2.5">
                      <div>
                        <span className="block text-[#6F6B61] text-[0.7rem]">Workshop Title</span>
                        <span className="font-bold text-sm text-[#292923]">{bookingDetail.course.title}</span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="block text-[#6F6B61] text-[0.7rem]">Amount</span>
                        <span className="font-bold text-sm text-[#292923]">
                          {bookingDetail.amountPaise === 0
                            ? "Complimentary"
                            : `₹${(bookingDetail.amountPaise / 100).toFixed(0)}`}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-[#FAF8F2] p-3 rounded border border-[#464137]/10">
                      <div>
                        <span className="block text-[#6F6B61] text-[0.68rem]">Cohort Batch:</span>
                        <span className="font-semibold text-[#292923]">{bookingDetail.batch.batchName}</span>
                      </div>
                      <div>
                        <span className="block text-[#6F6B61] text-[0.68rem]">Schedule:</span>
                        <span className="font-semibold text-[#292923]">
                          {bookingDetail.batch.startDate} ({bookingDetail.batch.startTime} – {bookingDetail.batch.endTime})
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#6F6B61] text-[0.68rem]">Booking Status:</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[0.62rem] font-bold uppercase tracking-wider ${
                            bookingDetail.bookingStatus === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : bookingDetail.bookingStatus === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {bookingDetail.bookingStatus}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#6F6B61] text-[0.68rem]">Seat Hold Status:</span>
                        <span className="font-semibold text-[#292923]">
                          {bookingDetail.seatReleased ? "Released / Inactive" : "Active Hold"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Associated Payments Card */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#68705A] mb-2.5">
                    Payment History ({bookingDetail.payments.length})
                  </h3>
                  {bookingDetail.payments.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#6F6B61] bg-[#F7F4EC] rounded-lg border border-[#464137]/10">
                      No payment records associated with this reservation.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookingDetail.payments.map((pmt) => (
                        <div
                          key={pmt.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#FFFFFF] border border-[#464137]/15 shadow-xs text-xs gap-2"
                        >
                          <div className="space-y-1">
                            <div className="font-mono text-[0.72rem] text-[#292923]">
                              Razorpay Order: <strong>{pmt.razorpayOrderId}</strong>
                            </div>
                            {pmt.razorpayPaymentId && (
                              <div className="font-mono text-[0.72rem] font-bold text-[#68705A]">
                                Payment ID: {pmt.razorpayPaymentId}
                              </div>
                            )}
                            <div className="text-[0.65rem] text-[#6F6B61]">
                              Date: {new Date(pmt.createdAt).toLocaleString("en-IN")}
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[0.62rem] font-bold uppercase tracking-wider ${
                                pmt.status === "captured"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : pmt.status === "failed"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {pmt.status}
                            </span>
                            <span className="font-bold text-sm text-[#292923]">
                              ₹{(pmt.amountPaise / 100).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Safe Cancellation Control */}
                {!bookingDetail.seatReleased && bookingDetail.bookingStatus !== "cancelled" && (
                  <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="size-4 text-amber-700" />
                        <span>Administrative Seat Release</span>
                      </div>
                      <p className="text-[0.7rem] text-amber-800">
                        Cancelling this reservation will execute an atomic seat release, decrementing booked seats back to the batch pool.
                      </p>
                    </div>

                    <button
                      onClick={handleCancelBooking}
                      disabled={isCancelling}
                      className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isCancelling ? "Releasing..." : "Cancel & Release Seat"}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Footer */}
            <div className="border-t border-[#464137]/10 pt-4 flex justify-end">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg bg-[#EEE9DE] hover:bg-[#E3DCCB] text-[#292923] text-xs font-semibold transition-colors"
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
