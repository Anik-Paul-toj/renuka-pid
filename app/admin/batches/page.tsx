import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { AdminBatchScheduleManager } from "@/components/admin/batches/AdminBatchScheduleManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Batch Scheduling | Renuka Art Studio Admin",
};

export default async function AdminBatchesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <AdminBatchScheduleManager userRole={session.adminProfile.role} />
    </div>
  );
}
