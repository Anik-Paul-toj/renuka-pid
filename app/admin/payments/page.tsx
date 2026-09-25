import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getPaymentsList } from "@/lib/payments-admin/service";
import { PaymentsManager } from "@/components/admin/payments/PaymentsManager";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Pre-fetch initial payment ledger page & reconciliation summary
  const initialResult = await getPaymentsList({
    page: 1,
    limit: 20,
    search: "",
    status: "all",
    courseId: "all",
    batchId: "all",
    from: "",
    to: "",
  });

  const initialData = initialResult.success
    ? initialResult.data
    : {
        payments: [],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
        summary: {
          totalCount: 0,
          capturedCount: 0,
          failedCount: 0,
          pendingCount: 0,
          refundedCount: 0,
          totalCapturedAmountPaise: 0,
          discrepancyCount: 0,
        },
        availableCourses: [],
        availableBatches: [],
      };

  return <PaymentsManager initialData={initialData} />;
}
