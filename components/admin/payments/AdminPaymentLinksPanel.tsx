"use client";

import React, { useState, useEffect } from "react";
import {
  Link as LinkIcon,
  Copy,
  Check,
  Ban,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { PaymentLinkRecord } from "@/lib/payment-links/service";

interface AdminPaymentLinksPanelProps {
  availableCourses?: Array<{ id: string; title: string; slug?: string; offerPrice?: number }>;
  availableBatches?: Array<{
    id: string;
    courseId?: string;
    batchName: string;
    startDate: string;
    startTime?: string;
  }>;
}

export function AdminPaymentLinksPanel({
  availableCourses = [],
  availableBatches = [],
}: AdminPaymentLinksPanelProps) {
  const [links, setLinks] = useState<PaymentLinkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form State
  const [selectedCourseId, setSelectedCourseId] = useState(availableCourses[0]?.id || "");
  const [selectedBatchId, setSelectedBatchId] = useState(availableBatches[0]?.id || "");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [customAmountRupees, setCustomAmountRupees] = useState("");
  const [expiresInHours, setExpiresInHours] = useState("48");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [generatedLinkUrl, setGeneratedLinkUrl] = useState<string | null>(null);

  // Filter batches for selected course (or show all if courseId not linked in batch record)
  const filteredBatches = availableBatches.filter(
    (b) => !b.courseId || b.courseId === selectedCourseId
  );

  useEffect(() => {
    if (filteredBatches.length > 0 && !filteredBatches.some((b) => b.id === selectedBatchId)) {
      setSelectedBatchId(filteredBatches[0].id);
    }
  }, [selectedCourseId, filteredBatches, selectedBatchId]);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/payment-links");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.paymentLinks)) {
        setLinks(data.paymentLinks);
      }
    } catch (err) {
      console.error("Failed to load payment links:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const getFullLinkUrl = (token: string, fallbackUrl: string) => {
    if (typeof window !== "undefined" && window.location.origin) {
      return `${window.location.origin}/pay/${token}`;
    }
    return fallbackUrl;
  };

  const handleCopy = (url: string, token: string) => {
    const finalUrl = getFullLinkUrl(token, url);
    navigator.clipboard.writeText(finalUrl);
    setCopiedToken(token);
    setTimeout(() => {
      setCopiedToken((prev) => (prev === token ? null : prev));
    }, 2500);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedBatchId) {
      setFormError("Please select both a course and a batch.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setGeneratedLinkUrl(null);

    try {
      const res = await fetch("/api/admin/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          batchId: selectedBatchId,
          studentName: studentName.trim() || undefined,
          studentEmail: studentEmail.trim() || undefined,
          studentPhone: studentPhone.trim() || undefined,
          customAmountPaise: customAmountRupees.trim()
            ? Math.round(parseFloat(customAmountRupees) * 100)
            : undefined,
          expiresInHours: parseInt(expiresInHours, 10) || 48,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data?.error || "Failed to generate payment link.");
        setIsSubmitting(false);
        return;
      }

      const dynamicUrl =
        typeof window !== "undefined" && window.location.origin
          ? `${window.location.origin}/pay/${data.paymentLink.token}`
          : data.paymentLink.url;
      setGeneratedLinkUrl(dynamicUrl);
      fetchLinks();
    } catch {
      setFormError("Network error generating payment link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this payment link? The student will no longer be able to use it.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/payment-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      if (res.ok) {
        fetchLinks();
      }
    } catch (err) {
      console.error("Failed to revoke link:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#14120E] flex items-center gap-2">
            <LinkIcon className="size-4 text-[#444C38]" />
            <span>Shareable Direct Payment Links</span>
          </h2>
          <p className="text-xs text-[#6F6B61] mt-0.5">
            Generate tamper-proof, student-specific or batch-specific direct links to the course reservation box.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLinks}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#464137]/20 bg-white/70 hover:bg-white text-xs font-semibold text-[#464137] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              setGeneratedLinkUrl(null);
              setFormError(null);
            }}
            className="btn-studio px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Generate Payment Link</span>
          </button>
        </div>
      </div>

      {/* Payment Links Table */}
      <div className="overflow-x-auto rounded-xl border border-[#464137]/15 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#464137]/15 bg-[#FAF8F2] text-[#444C38] font-bold uppercase tracking-wider text-[0.68rem]">
              <th className="py-3 px-4">Student Details</th>
              <th className="py-3 px-4">Course &amp; Batch</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Expires</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#464137]/10 text-[#2C2A24]">
            {links.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#6F6B61]">
                  {isLoading ? "Loading payment links..." : "No payment links generated yet."}
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                  <td className="py-3 px-4">
                    {link.studentName ? (
                      <span className="font-bold text-[#14120E] block">{link.studentName}</span>
                    ) : null}
                    <span className="font-mono text-[11px] text-[#6F6B61] block">
                      {link.studentEmail || "General (Any student)"}
                    </span>
                    {link.studentPhone && (
                      <span className="text-[11px] text-[#6F6B61] block">{link.studentPhone}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#14120E] block">{link.courseTitle || "Course"}</span>
                    <span className="text-[11px] text-[#444C38] block">{link.batchName || "Batch"}</span>
                  </td>
                  <td className="py-3 px-4 font-price font-bold tabular-nums">
                    ₹{(link.amountPaise / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4">
                    {link.status === "paid" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.68rem] font-bold text-emerald-800">
                        <CheckCircle2 className="size-3" />
                        Paid {link.paidBookingReference ? `(${link.paidBookingReference})` : ""}
                      </span>
                    ) : link.status === "revoked" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[0.68rem] font-bold text-rose-800">
                        <Ban className="size-3" />
                        Revoked
                      </span>
                    ) : link.status === "expired" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[0.68rem] font-bold text-stone-600">
                        <Clock className="size-3" />
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[0.68rem] font-bold text-blue-800">
                        <LinkIcon className="size-3" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-[#6F6B61]">
                    {new Date(link.expiresAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(link.url, link.token)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[0.7rem] font-bold transition-colors ${
                          copiedToken === link.token
                            ? "bg-emerald-600 text-white"
                            : "bg-[#444C38]/10 text-[#444C38] hover:bg-[#444C38]/20"
                        }`}
                        title="Copy direct payment link"
                      >
                        {copiedToken === link.token ? (
                          <>
                            <Check className="size-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      {link.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(link.id)}
                          className="p-1 rounded text-stone-400 hover:text-rose-600 transition-colors"
                          title="Revoke payment link"
                        >
                          <Ban className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Payment Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="paper-card w-full max-w-lg rounded-xl bg-[#FAF8F2] p-6 shadow-2xl border border-[#464137]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-[#464137]/15 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#14120E]">
                Generate Direct Payment Link
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#6F6B61] hover:text-[#14120E] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {generatedLinkUrl ? (
              <div className="space-y-4 py-2">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
                  <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center mx-auto">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <h4 className="font-serif font-bold text-[#14120E]">
                    Payment Link Generated Successfully!
                  </h4>
                  <p className="text-xs text-[#3E3A32]">
                    Share this URL directly with the student via WhatsApp, email, or chat. Opening it loads directly into the prefilled reservation box.
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[#464137]/20 bg-white">
                  <input
                    type="text"
                    readOnly
                    value={generatedLinkUrl}
                    className="flex-1 text-xs font-mono text-[#14120E] bg-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedLinkUrl, "modal")}
                    className="btn-studio px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                  >
                    {copiedToken === "modal" ? (
                      <>
                        <Check className="size-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedLinkUrl(null);
                      setStudentName("");
                      setStudentEmail("");
                      setStudentPhone("");
                      setCustomAmountRupees("");
                    }}
                    className="px-4 py-2 rounded-lg border border-[#464137]/20 bg-white text-xs font-bold text-[#444C38] hover:bg-[#FAF8F2]"
                  >
                    Generate Another
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-studio px-5 py-2 text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateLink} className="space-y-3.5 text-xs">
                {formError && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-rose-800 font-semibold">
                    {formError}
                  </div>
                )}

                {/* Course Select */}
                <div>
                  <label className="block font-bold text-[#14120E] mb-1">Select Course *</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-lg border border-[#464137]/20 bg-white p-2 text-xs font-semibold text-[#14120E] focus:outline-none focus:border-[#444C38]"
                    required
                  >
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.offerPrice ? `(₹${c.offerPrice.toLocaleString("en-IN")})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Select */}
                <div>
                  <label className="block font-bold text-[#14120E] mb-1">Select Batch *</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full rounded-lg border border-[#464137]/20 bg-white p-2 text-xs font-semibold text-[#14120E] focus:outline-none focus:border-[#444C38]"
                    required
                  >
                    {filteredBatches.length === 0 ? (
                      <option value="">No batches available for this course</option>
                    ) : (
                      filteredBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batchName} — {b.startDate} {b.startTime ? `(${b.startTime})` : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Student Name */}
                <div>
                  <label className="block font-bold text-[#14120E] mb-1">
                    Student Full Name <span className="text-[#6F6B61] font-normal">(Optional prefill)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maya Sharma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full rounded-lg border border-[#464137]/20 bg-white p-2 text-xs text-[#14120E] focus:outline-none focus:border-[#444C38]"
                  />
                </div>

                {/* Student Email */}
                <div>
                  <label className="block font-bold text-[#14120E] mb-1">
                    Student Email <span className="text-[#6F6B61] font-normal">(Optional prefill / lock)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. maya@example.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#464137]/20 bg-white p-2 text-xs text-[#14120E] focus:outline-none focus:border-[#444C38]"
                  />
                </div>

                {/* Student Phone */}
                <div>
                  <label className="block font-bold text-[#14120E] mb-1">
                    Student WhatsApp Phone <span className="text-[#6F6B61] font-normal">(Optional prefill)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#464137]/20 bg-white p-2 text-xs text-[#14120E] focus:outline-none focus:border-[#444C38]"
                  />
                </div>

                {/* Custom Amount & Expiry */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#14120E] mb-1">
                      Custom Amount (₹) <span className="text-[#6F6B61] font-normal">(Blank = default)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 990"
                      value={customAmountRupees}
                      onChange={(e) => setCustomAmountRupees(e.target.value)}
                      className="w-full rounded-lg border border-[#464137]/20 bg-white p-2 text-xs text-[#14120E] focus:outline-none focus:border-[#444C38]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#14120E] mb-1">Validity (Hours)</label>
                    <select
                      value={expiresInHours}
                      onChange={(e) => setExpiresInHours(e.target.value)}
                      className="w-full rounded-lg border border-[#464137]/20 bg-white p-2 text-xs font-semibold text-[#14120E] focus:outline-none focus:border-[#444C38]"
                    >
                      <option value="24">24 Hours</option>
                      <option value="48">48 Hours (Default)</option>
                      <option value="72">72 Hours</option>
                      <option value="168">7 Days</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#464137]/15">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg border border-[#464137]/20 bg-white text-xs font-bold text-[#444C38] hover:bg-[#FAF8F2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedCourseId || !selectedBatchId}
                    className="btn-studio px-5 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? "Generating..." : "Generate Payment Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
