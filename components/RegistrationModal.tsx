"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Calendar, Clock, Sparkles, ArrowRight } from "lucide-react";
import { masterclassData } from "@/data/content";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
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

    // Simulate instant secure confirmation
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-card p-6 shadow-2xl ring-1 ring-border sm:p-8 z-10 transition-all">
        {/* Close button */}
        <button
          onClick={handleReset}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-surface text-muted-foreground transition-colors hover:bg-border/30 hover:text-foreground"
          aria-label="Close registration modal"
        >
          <X className="size-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-icon/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-icon">
                <Sparkles className="size-3 text-icon" />
                Complimentary Masterclass
              </span>
            </div>

            <h3
              id="modal-title"
              className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl"
            >
              Reserve Your Free Seat
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Enter your details below to receive your private stream link, calendar invitation, and complimentary prep materials.
            </p>

            {/* Quick Session Details */}
            <div className="mt-4 rounded-xl bg-surface/70 p-3.5 ring-1 ring-border/50 text-xs text-foreground flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="size-3.5 text-icon shrink-0" />
                <span>{masterclassData.hero.date}</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Clock className="size-3.5 text-icon shrink-0" />
                <span>{masterclassData.hero.time} ({masterclassData.hero.duration})</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-subheading mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-cta focus:ring-2 focus:ring-cta/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-subheading mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-cta focus:ring-2 focus:ring-cta/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-subheading mb-1.5">
                  WhatsApp Number (Optional for SMS reminders)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-cta focus:ring-2 focus:ring-cta/20"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cta py-4 text-sm font-semibold text-cta-foreground shadow-sm transition-all hover:bg-cta/90 hover:shadow-[0_14px_30px_-14px_rgba(198,83,40,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/50 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Reserving Your Seat...</span>
                ) : (
                  <>
                    <span>Confirm Free Reservation</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <p className="text-center text-[0.75rem] text-muted-foreground mt-3">
                🔒 We respect your privacy. No spam ever. One-click unsubscribe at any time.
              </p>
            </form>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-icon/15 text-icon">
              <CheckCircle2 className="size-9" />
            </div>

            <h3 className="mt-4 font-display text-2xl font-bold text-primary">
              Your Seat Is Confirmed, {name}!
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We have sent the private access link and calendar invitations to:
            </p>
            <p className="mt-1 font-semibold text-icon">{email}</p>

            <div className="mt-6 rounded-2xl bg-surface/80 p-4 text-left ring-1 ring-border/50 text-xs space-y-2">
              <p className="font-semibold text-subheading">Important Next Steps:</p>
              <p className="text-muted-foreground">
                1. Check your inbox for the calendar invite so you don’t miss the live stream.
              </p>
              <p className="text-muted-foreground">
                2. Live attendee bonuses (E-books & video replay) unlock during the broadcast.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-cta px-6 py-3.5 text-sm font-semibold text-cta-foreground shadow-sm hover:bg-cta/90 transition-all"
            >
              Back to Masterclass Overview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
