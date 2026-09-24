"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Calendar, Clock, Sparkles, ArrowRight } from "lucide-react";
import { useLandingContent } from "@/components/LandingContentProvider";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { hero } = useLandingContent();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setName("");
    setEmail("");
    setPhone("");
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
                <span>{hero.date}</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Clock className="size-3.5 text-[#68705A] shrink-0" />
                <span>{hero.time} ({hero.duration})</span>
              </div>
            </div>

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
                disabled={isLoading}
                className="btn-studio w-full py-3.5 mt-2"
              >
                {isLoading ? (
                  <span>Reserving Your Seat...</span>
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

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6F6B61]">
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
