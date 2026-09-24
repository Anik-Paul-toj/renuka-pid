"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Calendar, Clock, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId?: string;
}

interface ActiveBatchInfo {
  id: string;
  batchName: string;
  startDate: string;
  startTime: string;
  endTime: string;
  isEnrollmentOpen: boolean;
  isSoldOut: boolean;
}

interface ConfirmedBookingInfo {
  bookingReference: string;
  status: string;
  batchName: string;
  startDate: string;
  startTime: string;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  batchId: propBatchId,
}) => {
  const { hero } = useLandingContent();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeBatch, setActiveBatch] = useState<ActiveBatchInfo | null>(null);
  const [bookingInfo, setBookingInfo] = useState<ConfirmedBookingInfo | null>(null);

  // Helper to fetch active batch
  const fetchActiveBatch = async (): Promise<ActiveBatchInfo | null> => {
    try {
      const res = await fetch("/api/cohort-batches/active");
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.success && data?.batch?.id) {
        const batchInfo: ActiveBatchInfo = {
          id: data.batch.id,
          batchName: data.batch.batchName,
          startDate: data.batch.startDate,
          startTime: data.batch.startTime,
          endTime: data.batch.endTime,
          isEnrollmentOpen: Boolean(data.batch.isEnrollmentOpen),
          isSoldOut: Boolean(data.batch.isSoldOut),
        };
        setActiveBatch(batchInfo);
        return batchInfo;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Fetch active cohort batch details immediately on mount and when modal opens
  useEffect(() => {
    fetchActiveBatch();
  }, []);

  useEffect(() => {
    if (isOpen && !activeBatch) {
      fetchActiveBatch();
    }
  }, [isOpen, activeBatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Resolve batch ID with on-demand fallback if state is not yet populated
    let currentBatch = activeBatch;
    let resolvedBatchId = propBatchId || currentBatch?.id;

    if (!resolvedBatchId) {
      currentBatch = await fetchActiveBatch();
      resolvedBatchId = propBatchId || currentBatch?.id;
    }

    if (!resolvedBatchId) {
      setErrorMessage("No active cohort batch is available for registration right now.");
      setIsLoading(false);
      return;
    }

    if (currentBatch?.isSoldOut) {
      setErrorMessage("This workshop cohort is completely sold out.");
      setIsLoading(false);
      return;
    }

    if (currentBatch && !currentBatch.isEnrollmentOpen) {
      setErrorMessage("Enrollment is currently closed for this batch.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          batchId: resolvedBatchId,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        const errorMsg =
          result?.error?.message || "Unable to reserve your seat. Please try again.";
        setErrorMessage(errorMsg);
        setIsLoading(false);
        return;
      }

      setBookingInfo({
        bookingReference: result.booking.bookingReference,
        status: result.booking.status,
        batchName: result.booking.batchName,
        startDate: result.booking.startDate,
        startTime: result.booking.startTime,
      });

      setIsLoading(false);
      setIsSubmitted(true);
    } catch {
      setErrorMessage("A network error occurred. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setName("");
    setEmail("");
    setPhone("");
    setErrorMessage(null);
    setBookingInfo(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={handleReset}
        className="fixed inset-0 bg-[#292923]/50 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="paper-card relative w-full max-w-lg overflow-hidden rounded-xl bg-[#FAF8F2] p-6 shadow-2xl border border-[#464137]/15 sm:p-8 z-10">
        {/* Close button */}
        <button
          onClick={handleReset}
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-[#EEE9DE] text-[#6F6B61] transition-colors hover:text-[#292923]"
          aria-label="Close registration modal"
        >
          <X className="size-4" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C8D1C7]/35 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#68705A]">
                <Sparkles className="size-3 text-[#68705A]" />
                Complimentary Masterclass
              </span>
            </div>

            <h3
              id="modal-title"
              className="mt-3 font-serif text-2xl font-bold tracking-tight text-[#292923] sm:text-3xl"
            >
              Reserve Your Free Seat
            </h3>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
              Enter your details below to receive your private stream link, calendar invitation, and complimentary preparation guides.
            </p>

            {/* Quick Session Details */}
            <div className="mt-4 rounded-md bg-[#F7F4EC] p-3.5 border border-[#464137]/10 text-xs text-[#292923] flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="size-3.5 text-[#68705A] shrink-0" />
                <span>{activeBatch?.startDate ? `${activeBatch.batchName} (${activeBatch.startDate})` : hero.date}</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Clock className="size-3.5 text-[#68705A] shrink-0" />
                <span>{activeBatch?.startTime ? `${activeBatch.startTime} – ${activeBatch.endTime} IST` : `${hero.time} (${hero.duration})`}</span>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mt-4 flex items-start gap-2.5 rounded-md border border-rose-300 bg-rose-50/80 p-3 text-xs text-rose-800">
                <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-[#464137]/15 bg-[#F7F4EC] px-4 py-3 text-sm text-[#292923] outline-none transition-all placeholder:text-[#6F6B61]/50 focus:border-[#68705A] focus:ring-1 focus:ring-[#68705A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#68705A] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-[#464137]/15 bg-[#F7F4EC] px-4 py-3 text-sm text-[#292923] outline-none transition-all placeholder:text-[#6F6B61]/50 focus:border-[#68705A] focus:ring-1 focus:ring-[#68705A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#68705A] mb-1.5">
                  WhatsApp Number (Optional for gentle reminders)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-[#464137]/15 bg-[#F7F4EC] px-4 py-3 text-sm text-[#292923] outline-none transition-all placeholder:text-[#6F6B61]/50 focus:border-[#68705A] focus:ring-1 focus:ring-[#68705A]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || activeBatch?.isSoldOut}
                className="btn-studio w-full py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>Reserving Your Seat...</span>
                ) : activeBatch?.isSoldOut ? (
                  <span>Cohort Sold Out</span>
                ) : (
                  <>
                    <span>Confirm Free Reservation</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[0.72rem] text-[#6F6B61] mt-3">
                🔒 We respect your privacy. No spam ever. One-click unsubscribe at any time.
              </p>
            </form>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#C8D1C7]/40 text-[#68705A]">
              <CheckCircle2 className="size-8" />
            </div>

            <h3 className="mt-4 font-serif text-2xl font-bold text-[#292923]">
              Your Seat Is Confirmed, {name}!
            </h3>

            {bookingInfo?.bookingReference && (
              <div className="mt-3 inline-block rounded-md bg-[#EEE9DE] px-3.5 py-1.5 border border-[#464137]/10 text-xs font-mono font-bold text-[#292923]">
                Ref: {bookingInfo.bookingReference}
              </div>
            )}

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
              We have sent the private access link and calendar invitations to:
            </p>
            <p className="mt-1 font-semibold text-[#68705A]">{email}</p>

            <div className="mt-6 rounded-md bg-[#F7F4EC] p-4 text-left border border-[#464137]/10 text-xs space-y-2">
              <p className="font-semibold text-[#68705A]">Important Next Steps:</p>
              <p className="text-[#6F6B61]">
                1. Check your inbox for the calendar invite so you don&apos;t miss the live stream.
              </p>
              <p className="text-[#6F6B61]">
                2. Live attendee bonuses (Guides & demo access) unlock during the broadcast.
              </p>
              <p className="text-[#6F6B61]">
                3. Your booking is registered under reference <span className="font-mono font-medium">{bookingInfo?.bookingReference}</span>.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="btn-studio w-full py-3 mt-6"
            >
              Back to Masterclass Overview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
