import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getBookingsList } from "@/lib/bookings-admin/service";
import { BookingsManager } from "@/components/admin/bookings/BookingsManager";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Pre-fetch initial bookings directory page
  const initialResult = await getBookingsList({
    page: 1,
    limit: 20,
    search: "",
    status: "all",
    paymentStatus: "all",
    batchId: "all",
  });

  const initialData = initialResult.success
    ? initialResult.data
    : {
        bookings: [],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
        availableBatches: [],
      };

  return <BookingsManager initialData={initialData} />;
}
