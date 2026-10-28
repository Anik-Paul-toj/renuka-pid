import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { CheckCircle2, AlertCircle, Calendar, Clock, ArrowRight, ShieldCheck, User, Mail, Hash } from "lucide-react";
import { getBookingByReference } from "@/lib/booking/service";
import {
  resolveWhatsAppGroupUrl,
  isWhatsAppGroupEligibleCourse,
} from "@/lib/whatsapp/group";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookingReference: string }>;
}): Promise<Metadata> {
  const { bookingReference } = await params;
  return {
    title: `Booking Confirmation • ${bookingReference} | Renuka Art Studio`,
    description: "Official booking confirmation and course access details.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ bookingReference: string }>;
}) {
  const { bookingReference } = await params;
  const result = await getBookingByReference(bookingReference);

  // Scenario A: Invalid or Non-Existent Booking Reference
  if (!result.success || !result.data) {
    return (
      <main className="min-h-screen bg-[#F7F4EC] flex items-center justify-center p-4 sm:p-6">
        <div className="paper-card w-full max-w-lg rounded-2xl bg-[#FAF8F2] p-6 sm:p-8 text-center border border-[#464137]/15 shadow-xl">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#B93821]/15 text-[#B93821]">
            <AlertCircle className="size-8" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-[#14120E]">
            Booking Not Found
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#6F6B61]">
            We could not locate any reservation with reference{" "}
            <span className="font-mono font-bold text-[#14120E]">{bookingReference}</span>.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/" className="btn-studio px-6 py-3 text-xs">
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const booking = result.data;
  const isConfirmed = booking.status === "confirmed";
  const showWhatsAppInvitation =
    isConfirmed &&
    isWhatsAppGroupEligibleCourse({
      courseSlug: booking.courseSlug,
      courseId: booking.courseId,
    });
  const whatsappUrl = resolveWhatsAppGroupUrl({
    courseSlug: booking.courseSlug,
  });

  // Scenario B: Booking exists but is NOT confirmed (pending, failed, expired, cancelled)
  if (!isConfirmed) {
    return (
      <main className="min-h-screen bg-[#F7F4EC] flex items-center justify-center p-4 sm:p-6">
        <div className="paper-card w-full max-w-lg rounded-2xl bg-[#FAF8F2] p-6 sm:p-8 text-center border border-[#464137]/15 shadow-xl">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#E5A83B]/20 text-[#B87A1E]">
            <AlertCircle className="size-8" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-[#14120E]">
            Payment Pending or Unverified
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#2C2A24] font-medium">
            Your booking reference{" "}
            <span className="font-mono font-bold text-[#14120E]">{booking.bookingReference}</span>{" "}
            is currently marked as <strong className="uppercase">{booking.status}</strong>.
          </p>
          <div className="mt-4 rounded-lg bg-[#EEE9DE] p-3.5 text-xs text-[#6F6B61] text-left">
            <p>
              WhatsApp group invitations and live class materials are accessible exclusively for confirmed, verified enrollments. If you have recently made a payment, please allow a moment for confirmation or contact our support team.
            </p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="btn-studio px-6 py-3 text-xs w-full sm:w-auto">
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Scenario C: Confirmed & Verified Payment — Show Official Confirmation & WhatsApp Invitation
  return (
    <main className="min-h-screen bg-[#F7F4EC] py-10 sm:py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="paper-card w-full max-w-xl rounded-2xl bg-[#FAF8F2] p-6 sm:p-10 border border-[#464137]/15 shadow-2xl">
        {/* Success Icon */}
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#C8D1C7]/50 text-[#444C38]">
          <CheckCircle2 className="size-10" />
        </div>

        {/* Heading & Subheading */}
        <div className="mt-5 text-center">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#14120E]">
            Payment Successful!
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-medium text-[#2C2A24] max-w-md mx-auto">
            Thank you for enrolling with Renuka Art Studio. Your booking has been confirmed.
          </p>
        </div>

        {/* Official Reference Badge */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EEE9DE] px-3.5 py-1.5 border border-[#464137]/15 text-xs font-mono font-bold text-[#14120E]">
            <Hash className="size-3 text-[#444C38]" />
            Ref: {booking.bookingReference}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#C8D1C7]/40 px-3.5 py-1.5 border border-[#444C38]/25 text-xs font-bold text-[#444C38]">
            <ShieldCheck className="size-3" />
            Verified &amp; Confirmed
          </span>
        </div>

        {/* Primary WhatsApp Group Invitation Section - Only for eligible courses */}
        {showWhatsAppInvitation && (
          <section
            aria-label="WhatsApp Group Invitation"
            className="mt-6 rounded-xl bg-[#25D366]/10 border border-[#25D366]/35 p-5 text-center shadow-xs"
          >
            <p className="text-xs sm:text-sm font-semibold text-[#14120E] leading-relaxed">
              Join our WhatsApp group to receive course updates and important announcements.
            </p>

            <div className="mt-3.5 flex justify-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp w-full sm:w-auto text-xs sm:text-sm"
                aria-label="Join our official WhatsApp group for course updates (opens in a new tab)"
              >
                <WhatsAppIcon className="size-5 shrink-0" />
                <span>JOIN WHATSAPP GROUP</span>
              </a>
            </div>

            <p className="mt-2.5 text-[0.7rem] text-[#464137]/80 font-medium">
              Tap above to join our private atelier group on WhatsApp
            </p>
          </section>
        )}

        {/* Course & Session Snapshot */}
        <div className="mt-6 rounded-xl bg-[#F7F4EC] p-4.5 border border-[#464137]/15 text-xs space-y-2.5">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#464137]/10">
            <div>
              <p className="font-bold text-sm text-[#14120E]">{booking.courseTitle}</p>
              <p className="text-[11px] text-[#444C38] font-semibold">{booking.batchName}</p>
            </div>
            <span className="font-price font-bold text-sm text-[#444C38] tabular-nums">
              ₹{(booking.amountPaise / 100).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#3E3A32] pt-0.5">
            {booking.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-[#444C38] shrink-0" />
                <span>Date: <strong>{booking.startDate}</strong></span>
              </div>
            )}
            {booking.startTime && (
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-[#444C38] shrink-0" />
                <span>Time: <strong>{booking.startTime} IST</strong></span>
              </div>
            )}
            {booking.customer?.fullName && (
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-[#444C38] shrink-0" />
                <span>Student: <strong>{booking.customer.fullName}</strong></span>
              </div>
            )}
            {booking.customer?.email && (
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-[#444C38] shrink-0" />
                <span className="truncate">Email: <strong>{booking.customer.email}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Helpful Notes */}
        <div className="mt-5 text-center text-xs text-[#6F6B61] space-y-1">
          <p>
            A confirmation receipt and calendar invitation have been dispatched to your email.
          </p>
          <p className="text-[11px]">
            Need assistance? Reach us at{" "}
            <a href="mailto:renuka.art.studio25@gmail.com" className="underline font-semibold text-[#444C38]">
              renuka.art.studio25@gmail.com
            </a>{" "}
            or{" "}
            <a href="tel:+919599109200" className="underline font-semibold text-[#444C38]">
              +91 9599109200
            </a>
            .
          </p>
        </div>

        {/* Return to website */}
        <div className="mt-6 flex justify-center">
          <Link href="/" className="btn-studio px-6 py-2.5 text-xs inline-flex items-center gap-1.5">
            <span>Explore More Courses</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
