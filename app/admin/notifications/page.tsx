import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getNotificationLogsList } from "@/lib/notifications-admin/service";
import { NotificationsManager } from "@/components/admin/notifications/NotificationsManager";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  // Pre-fetch initial notification logs list server-side
  const initialResult = await getNotificationLogsList({
    page: 1,
    limit: 20,
    search: "",
    status: "all",
    channel: "all",
    type: "all",
  });

  const initialData = initialResult.success
    ? initialResult.data
    : {
        logs: [],
        summary: {
          totalNotifications: 0,
          successfulSends: 0,
          failedSends: 0,
        },
        pagination: {
          totalCount: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };

  return (
    <NotificationsManager
      initialData={initialData}
      userRole={session.adminProfile.role}
    />
  );
}
