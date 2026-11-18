import React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { validatePaymentLinkToken } from "@/lib/payment-links/service";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PayLandingClient } from "./PayLandingClient";

export const dynamic = "force-dynamic";

interface PayPageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PayPageProps) {
  const { token } = await params;
  const validation = await validatePaymentLinkToken(token);

  if (!validation.valid || !validation.paymentLink) {
    return {
      title: "Direct Payment | Renuka Art Studio",
      description: "Direct course reservation and checkout link.",
    };
  }

  return {
    title: `Reserve Your Seat — ${validation.paymentLink.courseTitle || "Course"} | Renuka Art Studio`,
    description: `Complete your course enrollment for ${validation.paymentLink.courseTitle || "Renuka Art Studio"}.`,
  };
}

export default async function PayPage({ params }: PayPageProps) {
  const { token } = await params;
  const validation = await validatePaymentLinkToken(token);

  if (!validation.valid || !validation.paymentLink) {
    return (
      <div className="relative min-h-screen bg-[#F7F4EC] text-[#14120E] flex flex-col justify-between">
        <Navbar />

        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="paper-card w-full max-w-lg rounded-2xl bg-[#FAF8F2] p-8 text-center border border-[#464137]/15 shadow-xl space-y-4">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#B93821]/15 text-[#B93821]">
              <AlertCircle className="size-8" />
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#14120E]">
              Payment Link Unavailable
            </h1>

            <p className="text-xs sm:text-sm text-[#3E3A32] font-medium leading-relaxed">
              {validation.error ||
                "This direct payment link is invalid, expired, or has been revoked."}
            </p>

            <div className="rounded-xl bg-[#EEE9DE]/80 p-4 border border-[#464137]/10 text-xs text-[#6F6B61] text-left space-y-1.5">
              <p className="font-semibold text-[#14120E]">Need a new link?</p>
              <p>
                Please contact Renuka Art Studio support directly at{" "}
                <a
                  href="mailto:renuka.art.studio25@gmail.com"
                  className="font-bold underline text-[#444C38]"
                >
                  renuka.art.studio25@gmail.com
                </a>{" "}
                or WhatsApp{" "}
                <a
                  href="https://wa.me/919599109200"
                  className="font-bold underline text-[#444C38]"
                >
                  +91 9599109200
                </a>
                .
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Link href="/course" className="btn-studio px-6 py-2.5 text-xs inline-flex items-center gap-2">
                <ArrowLeft className="size-3.5" />
                <span>Explore Available Courses</span>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const pLink = validation.paymentLink;

  return (
    <div className="relative min-h-screen bg-[#F7F4EC] text-[#14120E] flex flex-col justify-between">
      {/* Background artwork */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/background/ChatGPT Image Sep 25, 2026, 07_06_12 PM.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover object-top opacity-25 mix-blend-multiply select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F4EC]/60 via-transparent to-[#F7F4EC]/90" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="paper-card w-full max-w-xl rounded-2xl bg-[#FAF8F2] p-8 text-center border border-[#464137]/15 shadow-xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#C8D1C7]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#444C38]">
            <ShieldCheck className="size-4" />
            <span>Authorized Payment Link</span>
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#14120E]">
              {pLink.courseTitle || "Direct Course Reservation"}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#444C38] font-semibold">
              {pLink.batchName || "Upcoming Live Cohort"}
            </p>
          </div>

          <div className="rounded-xl bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#3E3A32] space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-[#464137]/10">
              <span className="text-[#6F6B61] font-semibold">Payable Course Fee:</span>
              <span className="font-price font-bold text-base text-[#14120E]">
                ₹{(pLink.amountPaise / 100).toLocaleString("en-IN")}
              </span>
            </div>
            {pLink.studentEmail && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#6F6B61]">Reserved for:</span>
                <span className="font-bold text-[#14120E]">{pLink.studentEmail}</span>
              </div>
            )}
          </div>

          <PayLandingClient paymentLink={pLink} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
