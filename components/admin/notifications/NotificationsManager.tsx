"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminNotificationListItem,
  NotificationLogsListResult,
} from "@/lib/notifications-admin/service";
import {
  NotificationStatusFilter,
  NotificationChannelFilter,
} from "@/lib/validations/notification";
import {
  Bell,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  MessageSquare,
  Eye,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

interface NotificationsManagerProps {
  initialData: NotificationLogsListResult;
  userRole?: string;
}

function formatNotificationDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getFriendlyType(type: string): string {
  if (type === "booking-confirmation-email") return "Booking Confirmation";
  if (type === "class-reminder-email") return "Class Reminder";
  if (type === "broadcast") return "Broadcast";
  return type;
}

export function NotificationsManager({
  initialData,
  userRole = "admin",
}: NotificationsManagerProps) {
  const [data, setData] = useState<NotificationLogsListResult>(initialData);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<NotificationStatusFilter>("all");
  const [channel, setChannel] = useState<NotificationChannelFilter>("all");
  const [type, setType] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Detail Modal & Retry
  const [selectedLog, setSelectedLog] = useState<AdminNotificationListItem | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Fetch logs
  const fetchLogs = useCallback(
    async (currentPage = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (status !== "all") params.set("status", status);
        if (channel !== "all") params.set("channel", channel);
        if (type !== "all") params.set("type", type);
        params.set("page", currentPage.toString());
        params.set("limit", "20");

        const res = await fetch(`/api/admin/notifications?${params.toString()}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
          setPage(currentPage);
        }
      } catch (err) {
        console.error("Failed to fetch notification logs:", err);
      } finally {
        setLoading(false);
      }
    },
    [search, status, channel, type, page]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, channel, type]);

  // Handle Retry
  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    setRetryFeedback(null);

    try {
      const res = await fetch(`/api/admin/notifications/${logId}/retry`, {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to retry notification.");
      }

      setRetryFeedback({
        success: true,
        message: "Notification retry dispatched successfully!",
      });

      // Refresh data
      await fetchLogs(page);

      // If in detail modal, update view
      if (selectedLog?.id === logId) {
        const detailRes = await fetch(`/api/admin/notifications/${logId}`);
        const detailResult = await detailRes.json();
        if (detailResult.success) {
          setSelectedLog(detailResult.data);
        }
      }
    } catch (err: any) {
      setRetryFeedback({
        success: false,
        message: err.message || "Retry attempt failed.",
      });
    } finally {
      setRetryingId(null);
    }
  };

  const { logs, summary, pagination } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Notifications &amp; Delivery Logs
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Audit delivery attempts, inspect failure reasons, and safely retry failed notifications.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
            Total Notifications
          </span>
          <span className="text-2xl font-bold text-stone-900">
            {summary.totalNotifications}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Sent (Successful)
          </span>
          <span className="text-2xl font-bold text-emerald-700">
            {summary.successfulSends}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </span>
          <span className="text-2xl font-bold text-rose-700">
            {summary.failedSends}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipient, email, booking reference..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-44">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as NotificationStatusFilter)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent (Successful)</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div className="sm:w-36">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as NotificationChannelFilter)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            >
              <option value="all">All Channels</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="sm:w-48">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            >
              <option value="all">All Types</option>
              <option value="booking-confirmation-email">Booking Confirmation</option>
              <option value="broadcast">Broadcast</option>
              <option value="class-reminder-email">Class Reminder</option>
            </select>
          </div>
        </div>
      </div>

      {/* Retry Feedback Alert */}
      {retryFeedback && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm animate-in fade-in duration-150 ${
            retryFeedback.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {retryFeedback.success ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{retryFeedback.message}</span>
        </div>
      )}

      {/* Notification Logs Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
            <span>Loading delivery logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-sm">
            No notification logs match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Related</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => {
                  const isFailed = log.status === "failed";
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      {/* Recipient */}
                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        <div>{log.recipient.fullName || "Valued Student"}</div>
                        <div className="text-xs text-stone-400 font-normal">
                          {log.recipient.email || "No email"}
                        </div>
                      </td>

                      {/* Notification Type */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                          {getFriendlyType(log.messageType)}
                        </span>
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 text-xs text-stone-600">
                          {log.channel === "email" ? (
                            <>
                              <Mail className="w-3.5 h-3.5 text-amber-600" />
                              <span>Email</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            isFailed
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      {/* Related Booking / Context */}
                      <td className="py-3.5 px-4 text-xs text-stone-600">
                        {log.booking?.bookingReference ? (
                          <Link
                            href={`/admin/bookings?search=${log.booking.bookingReference}`}
                            className="text-amber-700 hover:text-amber-900 font-mono flex items-center gap-1 hover:underline"
                          >
                            <span>{log.booking.bookingReference}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : log.messageType === "broadcast" ? (
                          <span className="text-stone-400">Broadcast</span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>

                      {/* Sent At */}
                      <td className="py-3.5 px-4 text-xs text-stone-500">
                        {formatNotificationDate(log.sentAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                          >
                            View
                          </button>

                          {isFailed && log.canRetry && userRole !== "editor" && (
                            <button
                              type="button"
                              onClick={() => handleRetry(log.id)}
                              disabled={retryingId === log.id}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
                            >
                              <RotateCcw
                                className={`w-3 h-3 ${
                                  retryingId === log.id ? "animate-spin" : ""
                                }`}
                              />
                              <span>
                                {retryingId === log.id ? "Retrying..." : "Retry"}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={!pagination.hasPrevious}
                className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  Notification Details
                </h3>
                <p className="text-xs text-stone-500">
                  Audit trail and delivery status
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              {/* Failure Banner if Failed */}
              {selectedLog.status === "failed" && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Delivery Failure
                    </span>
                    <span className="text-xs text-rose-600 font-medium">
                      Attempts: {selectedLog.retryCount + 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-rose-800 block mb-0.5">
                      Reason:
                    </span>
                    <p className="text-xs text-rose-800 leading-relaxed font-mono bg-white/70 p-2.5 rounded-lg border border-rose-200/60">
                      {selectedLog.errorMessage || "Unknown provider delivery error"}
                    </p>
                  </div>
                </div>
              )}

              {/* Recipient Information */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                  Recipient
                </span>
                <div className="font-semibold text-stone-900">
                  {selectedLog.recipient.fullName || "Valued Student"}
                </div>
                <div className="text-xs text-stone-600">
                  Email: {selectedLog.recipient.email || "N/A"}
                </div>
                {selectedLog.recipient.phone && (
                  <div className="text-xs text-stone-600">
                    Phone: {selectedLog.recipient.phone}
                  </div>
                )}
              </div>

              {/* Delivery Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
                  <span className="font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                    Type
                  </span>
                  <span className="font-medium text-stone-800">
                    {getFriendlyType(selectedLog.messageType)}
                  </span>
                </div>

                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
                  <span className="font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                    Channel
                  </span>
                  <span className="font-medium text-stone-800 capitalize">
                    {selectedLog.channel}
                  </span>
                </div>

                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
                  <span className="font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                    Status
                  </span>
                  <span
                    className={`font-semibold capitalize ${
                      selectedLog.status === "failed"
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {selectedLog.status}
                  </span>
                </div>

                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
                  <span className="font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                    Sent Timestamp
                  </span>
                  <span className="text-stone-800">
                    {formatNotificationDate(selectedLog.sentAt)}
                  </span>
                </div>
              </div>

              {/* Booking Information if Linked */}
              {selectedLog.booking && (
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1.5 text-xs text-stone-600">
                  <span className="font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Related Booking
                  </span>
                  <div>
                    <span className="font-medium text-stone-700">Reference: </span>
                    <Link
                      href={`/admin/bookings?search=${selectedLog.booking.bookingReference}`}
                      className="font-mono text-amber-700 hover:underline inline-flex items-center gap-1"
                    >
                      {selectedLog.booking.bookingReference}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  {selectedLog.booking.courseTitle && (
                    <div>
                      <span className="font-medium text-stone-700">Course: </span>
                      {selectedLog.booking.courseTitle}
                    </div>
                  )}
                  {selectedLog.booking.batchName && (
                    <div>
                      <span className="font-medium text-stone-700">Batch: </span>
                      {selectedLog.booking.batchName}
                    </div>
                  )}
                </div>
              )}

              {/* Provider Identifier if Available */}
              {selectedLog.providerMessageId && (
                <div className="text-xs text-stone-500">
                  <span className="font-medium text-stone-600">Provider Message ID: </span>
                  <span className="font-mono">{selectedLog.providerMessageId}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-stone-50 border-t border-stone-100">
              {selectedLog.status === "failed" && selectedLog.canRetry && userRole !== "editor" ? (
                <button
                  type="button"
                  onClick={() => handleRetry(selectedLog.id)}
                  disabled={retryingId === selectedLog.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <RotateCcw
                    className={`w-3.5 h-3.5 ${
                      retryingId === selectedLog.id ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {retryingId === selectedLog.id ? "Retrying..." : "Retry Notification"}
                  </span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors"
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
