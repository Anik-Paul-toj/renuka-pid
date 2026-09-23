"use client";

import React, { useState } from "react";
import { AdminProfile } from "@/lib/auth/admin";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export function AdminLayoutClient({
  adminProfile,
  user,
  children,
}: {
  adminProfile: AdminProfile;
  user: { id: string; email: string };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F4EC] flex text-[#292923]">
      {/* Sidebar with mobile drawer state */}
      <AdminSidebar
        adminProfile={adminProfile}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          adminProfile={adminProfile}
          user={user}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
