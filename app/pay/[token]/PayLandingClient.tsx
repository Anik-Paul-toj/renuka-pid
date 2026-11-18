"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { RegistrationModal } from "@/components/RegistrationModal";
import { PaymentLinkRecord } from "@/lib/payment-links/service";

interface PayLandingClientProps {
  paymentLink: PaymentLinkRecord;
}

export function PayLandingClient({ paymentLink }: PayLandingClientProps) {
  // Modal automatically opens on page load as requested by user
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <>
      <div className="pt-2 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-studio px-8 py-3.5 text-sm uppercase tracking-wider font-bold inline-flex items-center gap-2 shadow-md w-full sm:w-auto justify-center"
        >
          <span>Open Reservation Box</span>
          <ArrowRight className="size-4" />
        </button>

        <p className="text-[11px] text-[#6F6B61]">
          Opening will launch the secure reservation box with prefilled batch details.
        </p>
      </div>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batchId={paymentLink.batchId}
        courseSlug={paymentLink.courseSlug}
        courseTitle={paymentLink.courseTitle}
        coursePrice={paymentLink.amountPaise / 100}
        initialName={paymentLink.studentName || undefined}
        initialEmail={paymentLink.studentEmail || undefined}
        initialPhone={paymentLink.studentPhone || undefined}
        paymentLinkToken={paymentLink.token}
        lockedAmountPaise={paymentLink.amountPaise}
      />
    </>
  );
}
