"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  Ticket,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  StudentListItem,
  StudentListResult,
  StudentDetail,
} from "@/lib/students/service";

interface StudentsManagerProps {
  initialData: StudentListResult;
}

export function StudentsManager({ initialData }: StudentsManagerProps) {
  const [students, setStudents] = useState<StudentListItem[]>(initialData.students);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detail Modal state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch students from API
  const fetchStudents = useCallback(
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
        });

        const res = await fetch(`/api/admin/students?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMessage(data?.error?.message || "Failed to load students.");
          setIsLoading(false);
          return;
        }

        setStudents(data.data.students);
        setPagination(data.data.pagination);
      } catch (err: any) {
        setErrorMessage("Network error while loading students list.");
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, status, paymentStatus]
  );

  // Trigger fetch when search or filters change (reset to page 1)
  useEffect(() => {
    fetchStudents(1);
  }, [debouncedSearch, status, paymentStatus, fetchStudents]);

  // Open detail view for a student
  const handleOpenDetail = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setStudentDetail(null);
    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const res = await fetch(`/api/admin/students/${studentId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setDetailError(data?.error?.message || "Failed to load student details.");
        setIsDetailLoading(false);
        return;
      }

      setStudentDetail(data.data);
    } catch {
      setDetailError("Network error loading student details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedStudentId(null);
    setStudentDetail(null);
    setDetailError(null);
  };

  // Keyboard escape listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedStudentId) {
        handleCloseDetail();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStudentId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] mb-2">
              <Users className="size-3" />
              <span>Customer Directory</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#292923]">Registered Students</h1>
            <p className="text-xs text-[#6F6B61] mt-1">
              Search and view student profiles, contact details (email, WhatsApp), and real-time enrollment histories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-lg bg-[#EEE9DE] border border-[#464137]/10 text-xs font-semibold text-[#292923]">
              Total Students: {pagination.totalCount}
            </span>
            <button
              onClick={() => fetchStudents(pagination.page)}
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
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6F6B61]" />
            <input
              type="text"
              placeholder="Search by student name, email, or phone number..."
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
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-[#464137]/15 bg-[#F7F4EC] px-3 py-2.5 text-xs text-[#292923] outline-none focus:border-[#68705A]"
            >
              <option value="all">All Booking Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="rounded-lg border border-[#464137]/15 bg-[#F7F4EC] px-3 py-2.5 text-xs text-[#292923] outline-none focus:border-[#68705A]"
            >
              <option value="all">All Payment Statuses</option>
              <option value="captured">Paid / Captured</option>
              <option value="created">Payment Created</option>
              <option value="failed">Payment Failed</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#6F6B61] flex flex-col items-center justify-center gap-2">
            <RefreshCw className="size-6 animate-spin text-[#68705A]" />
            <span>Loading student directory...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-[#6F6B61] space-y-2">
            <Users className="size-8 mx-auto text-[#68705A]/50" />
            <p className="text-sm font-semibold text-[#292923]">No students found</p>
            <p className="text-xs">
              {search || status !== "all" || paymentStatus !== "all"
                ? "Try adjusting your search criteria or filters."
                : "No customer registrations exist in the directory yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEE9DE]/60 text-[0.68rem] uppercase tracking-wider text-[#68705A] border-b border-[#464137]/10">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Student Name</th>
                  <th className="px-5 py-3.5 font-semibold">Contact Info</th>
                  <th className="px-5 py-3.5 font-semibold">Bookings</th>
                  <th className="px-5 py-3.5 font-semibold">Latest Enrollment</th>
                  <th className="px-5 py-3.5 font-semibold">Latest Payment</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#464137]/10">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => handleOpenDetail(student.id)}
                    className="hover:bg-[#F7F4EC] transition-colors cursor-pointer"
                  >
                    {/* Student Info */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#292923] text-sm">{student.fullName}</div>
                      <div className="text-[0.68rem] text-[#6F6B61] mt-0.5">
                        Joined {new Date(student.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#292923]">
                        <Mail className="size-3 text-[#68705A]" />
                        <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-1.5 text-[#6F6B61]">
                          <Phone className="size-3 text-[#68705A]" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      {student.whatsappPhone && student.whatsappPhone !== student.phone && (
                        <div className="flex items-center gap-1.5 text-[#68705A] font-medium">
                          <MessageSquare className="size-3 text-[#68705A]" />
                          <span>WA: {student.whatsappPhone}</span>
                        </div>
                      )}
                    </td>

                    {/* Bookings */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#292923]">{student.totalBookings} total</span>
                        {student.confirmedBookings > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#C8D1C7]/50 px-2 py-0.5 text-[0.65rem] font-bold text-[#68705A]">
                            <CheckCircle2 className="size-2.5" />
                            {student.confirmedBookings} confirmed
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Latest Booking */}
                    <td className="px-5 py-4">
                      {student.latestBookingStatus ? (
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
                              student.latestBookingStatus === "confirmed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : student.latestBookingStatus === "pending"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                            }`}
                          >
                            {student.latestBookingStatus}
                          </span>
                          {student.latestBookingDate && (
                            <div className="text-[0.68rem] text-[#6F6B61]">
                              {new Date(student.latestBookingDate).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#6F6B61] text-[0.7rem]">—</span>
                      )}
                    </td>

                    {/* Latest Payment */}
                    <td className="px-5 py-4">
                      {student.latestPaymentStatus ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
                            student.latestPaymentStatus === "captured"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : student.latestPaymentStatus === "failed"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {student.latestPaymentStatus}
                        </span>
                      ) : (
                        <span className="text-[#6F6B61] text-[0.7rem]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(student.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEE9DE] hover:bg-[#E3DCCB] text-[#292923] text-xs font-semibold transition-colors"
                      >
                        <Eye className="size-3.5 text-[#68705A]" />
                        <span>View</span>
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
              students
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchStudents(pagination.page - 1)}
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
                onClick={() => fetchStudents(pagination.page + 1)}
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

      {/* Student Detail Modal */}
      {selectedStudentId && (
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

          {/* Modal Card */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#FAF8F2] p-6 shadow-2xl border border-[#464137]/15 z-10 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#464137]/10 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/40 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#68705A]">
                  Student Profile
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#292923] mt-1">
                  {studentDetail?.fullName || "Student Details"}
                </h2>
                <p className="text-xs text-[#6F6B61]">{studentDetail?.email}</p>
              </div>

              <button
                onClick={handleCloseDetail}
                className="grid size-8 place-items-center rounded-full bg-[#EEE9DE] text-[#6F6B61] hover:text-[#292923] transition-colors"
                aria-label="Close details"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            {isDetailLoading ? (
              <div className="py-16 text-center text-xs text-[#6F6B61] flex flex-col items-center justify-center gap-2">
                <RefreshCw className="size-6 animate-spin text-[#68705A]" />
                <span>Loading student records...</span>
              </div>
            ) : detailError ? (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {detailError}
              </div>
            ) : studentDetail ? (
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#68705A] mb-3">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F7F4EC] p-4 rounded-lg border border-[#464137]/10">
                    <div>
                      <span className="block text-[#6F6B61] text-[0.7rem]">Full Name</span>
                      <span className="font-semibold text-[#292923]">{studentDetail.fullName}</span>
                    </div>
                    <div>
                      <span className="block text-[#6F6B61] text-[0.7rem]">Email Address</span>
                      <span className="font-semibold text-[#292923]">{studentDetail.email}</span>
                    </div>
                    <div>
                      <span className="block text-[#6F6B61] text-[0.7rem]">Phone</span>
                      <span className="font-semibold text-[#292923]">{studentDetail.phone || "Not provided"}</span>
                    </div>
                    <div>
                      <span className="block text-[#6F6B61] text-[0.7rem]">WhatsApp Number</span>
                      <span className="font-semibold text-[#292923]">
                        {studentDetail.whatsappPhone || studentDetail.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-[#464137]/10">
                      <span className="block text-[#6F6B61] text-[0.7rem]">Account Created</span>
                      <span className="text-[#292923]">
                        {new Date(studentDetail.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enrollment & Booking History */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#68705A]">
                      Enrollment & Booking History ({studentDetail.bookings.length})
                    </h3>
                    <span className="text-[0.7rem] font-semibold text-[#68705A]">
                      {studentDetail.confirmedBookings} Confirmed
                    </span>
                  </div>

                  {studentDetail.bookings.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#6F6B61] bg-[#F7F4EC] rounded-lg border border-[#464137]/10">
                      No bookings recorded for this student.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studentDetail.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="rounded-lg bg-[#FFFFFF] p-4 border border-[#464137]/15 shadow-xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#464137]/10 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#292923] bg-[#EEE9DE] px-2 py-0.5 rounded">
                                  {booking.bookingReference}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
                                    booking.status === "confirmed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : booking.status === "pending"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-zinc-100 text-zinc-700"
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-[#292923] mt-1.5">{booking.courseTitle}</h4>
                              <p className="text-xs text-[#6F6B61]">{booking.batchName}</p>
                            </div>

                            <div className="text-left sm:text-right">
                              <span className="block text-sm font-bold text-[#292923]">
                                {booking.amountPaise === 0
                                  ? "Complimentary"
                                  : `₹${(booking.amountPaise / 100).toFixed(0)}`}
                              </span>
                              <span className="text-[0.68rem] text-[#6F6B61]">
                                {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Session Schedule Details */}
                          <div className="text-xs text-[#6F6B61] grid grid-cols-2 gap-2 bg-[#FAF8F2] p-2.5 rounded border border-[#464137]/10">
                            <div>
                              <span className="block text-[0.68rem] font-medium text-[#68705A]">Session Date:</span>
                              <span className="text-[#292923]">{booking.startDate}</span>
                            </div>
                            <div>
                              <span className="block text-[0.68rem] font-medium text-[#68705A]">Time:</span>
                              <span className="text-[#292923]">
                                {booking.startTime} – {booking.endTime} ({booking.timezone})
                              </span>
                            </div>
                          </div>

                          {/* Associated Payments */}
                          <div>
                            <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-[#68705A] mb-1.5">
                              Payment Records ({booking.payments.length})
                            </span>
                            {booking.payments.length === 0 ? (
                              <div className="text-[0.72rem] text-[#6F6B61] italic">
                                No payment attempts recorded for this booking.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {booking.payments.map((pmt) => (
                                  <div
                                    key={pmt.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-[#F7F4EC] border border-[#464137]/10 text-xs gap-1"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-mono text-[0.72rem] text-[#292923]">
                                        Order: {pmt.razorpayOrderId}
                                      </div>
                                      {pmt.razorpayPaymentId && (
                                        <div className="font-mono text-[0.72rem] font-bold text-[#68705A]">
                                          Payment: {pmt.razorpayPaymentId}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-3">
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
                                      <span className="font-bold text-[#292923]">
                                        ₹{(pmt.amountPaise / 100).toFixed(0)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Modal Footer */}
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
