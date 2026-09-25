import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getSettings, getSystemStatus } from "@/lib/settings/service";
import { SettingsManager } from "@/components/admin/settings/SettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [settings, systemStatus] = await Promise.all([
    getSettings(),
    Promise.resolve(getSystemStatus()),
  ]);

  return (
    <SettingsManager
      initialSettings={settings}
      systemStatus={systemStatus}
      userRole={session.adminProfile.role}
    />
  );
}
