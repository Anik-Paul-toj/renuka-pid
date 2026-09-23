import React from "react";
import { getAdminSession } from "@/lib/auth/admin";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // If no admin session (such as when rendering /admin/login), render children without shell
  if (!session) {
    return <>{children}</>;
  }

  return (
    <AdminLayoutClient
      adminProfile={session.adminProfile}
      user={session.user}
    >
      {children}
    </AdminLayoutClient>
  );
}
