"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { AdminProfile } from "@/lib/auth/admin";
import { useRouter } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  "/admin": "Dashboard Overview",
  "/admin/landing-page": "Landing Page CMS",
  "/admin/courses": "Course & Workshop",
  "/admin/batches": "Batches & Schedule",
  "/admin/media": "Gallery & Media",
  "/admin/students": "Student Directory",
  "/admin/bookings": "Seat Bookings",
  "/admin/payments": "Payments & Orders",
  "/admin/messages": "Message Templates",
  "/admin/broadcast": "Broadcast Announcements",
  "/admin/notifications": "Notifications & Logs",
  "/admin/settings": "Admin & Studio Settings",
};

export function AdminHeader({
  adminProfile,
  user,
  onOpenMobile,
}: {
  adminProfile: AdminProfile;
  user: { id: string; email: string };
  onOpenMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const currentLabel = ROUTE_LABELS[pathname] || "Admin Portal";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/admin/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 bg-[#FAF8F2] border-b border-[#464137]/15 shadow-xs">
      {/* Left: Mobile Toggle & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 -ml-2 rounded-md text-[#464137] hover:bg-[#F7F4EC] hover:text-[#292923]"
          aria-label="Open sidebar navigation"
        >
          <Menu className="size-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <Link
            href="/admin"
            className="font-medium text-[#6F6B61] hover:text-[#292923] transition-colors"
          >
            Admin
          </Link>
          {pathname !== "/admin" && (
            <>
              <ChevronRight className="size-3 text-[#6F6B61]/60" />
              <span className="font-semibold text-[#292923] truncate max-w-[160px] sm:max-w-xs">
                {currentLabel}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Actions, Badges & Logout */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#464137]/15 text-xs font-medium text-[#464137] bg-[#F7F4EC] hover:border-[#68705A] hover:text-[#292923] transition-all"
        >
          <span>Live Site</span>
          <ExternalLink className="size-3 text-[#68705A]" />
        </Link>

        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#464137]/10">
          <div className="size-2 rounded-full bg-[#68705A] animate-pulse" />
          <span className="text-[0.7rem] font-semibold text-[#68705A] uppercase tracking-wider">
            {adminProfile.role.replace("_", " ")}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F2] border border-[#A24B4B]/25 text-xs font-semibold text-[#A24B4B] hover:bg-[#A24B4B]/10 hover:border-[#A24B4B]/40 transition-all cursor-pointer"
          title="Sign out of admin session"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
