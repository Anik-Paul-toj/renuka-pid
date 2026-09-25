"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PanelTop,
  GraduationCap,
  Calendar,
  Image as ImageIcon,
  Users,
  Ticket,
  CreditCard,
  Mail,
  Radio,
  Bell,
  Settings,
  Sparkles,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { AdminProfile } from "@/lib/auth/admin";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: "super_admin" | "admin" | "editor";
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Landing Page", href: "/admin/landing-page", icon: PanelTop },
  { name: "Course / Workshop", href: "/admin/courses", icon: GraduationCap },
  { name: "Batches / Schedule", href: "/admin/batches", icon: Calendar },
  { name: "Gallery / Media", href: "/admin/media", icon: ImageIcon },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Bookings", href: "/admin/bookings", icon: Ticket },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Messages", href: "/admin/messages", icon: Mail },
  { name: "Broadcast", href: "/admin/broadcast", icon: Radio },
  { name: "Notifications / Logs", href: "/admin/notifications", icon: Bell },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({
  adminProfile,
  mobileOpen,
  onCloseMobile,
}: {
  adminProfile: AdminProfile;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  const roleBadgeColors: Record<string, string> = {
    super_admin: "bg-[#68705A] text-[#F7F4EC]",
    admin: "bg-[#C8D1C7] text-[#292923]",
    editor: "bg-[#E6DFD3] text-[#464137]",
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#FAF8F2] border-r border-[#464137]/15">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#464137]/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-[#68705A] text-[#FAF8F2] shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <div>
            <span className="block font-serif text-sm font-bold tracking-tight text-[#292923]">
              Renuka Art Studio
            </span>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#68705A]">
              Admin Portal
            </span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-[#6F6B61] hover:bg-[#F7F4EC] hover:text-[#292923]"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#6F6B61]">
          Management Sections
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          // Role-aware visibility
          if (item.minRole === "super_admin" && adminProfile.role !== "super_admin") {
            return null;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#68705A] text-[#FAF8F2] shadow-sm font-semibold"
                  : "text-[#464137] hover:bg-[#F7F4EC] hover:text-[#292923]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`size-4 shrink-0 ${
                    isActive ? "text-[#FAF8F2]" : "text-[#6F6B61]"
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-[#C8D1C7]/40 text-[#464137]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Admin Profile & Public Site Footer */}
      <div className="p-4 border-t border-[#464137]/10 bg-[#F7F4EC]/70 space-y-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-md bg-[#FAF8F2] border border-[#464137]/10 text-xs font-medium text-[#464137] hover:border-[#68705A] hover:text-[#292923] transition-all"
        >
          <span className="inline-flex items-center gap-1.5">
            <ExternalLink className="size-3.5 text-[#68705A]" />
            View Public Site
          </span>
          <span className="text-[0.65rem] text-[#6F6B61]">Live ↗</span>
        </Link>

        <div className="px-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#292923] truncate">
                {adminProfile.full_name || "Administrator"}
              </p>
              <p className="text-[0.68rem] text-[#6F6B61] truncate">
                {adminProfile.email}
              </p>
            </div>
            <span
              className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${
                roleBadgeColors[adminProfile.role] || "bg-gray-200 text-gray-800"
              }`}
            >
              {adminProfile.role.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-out Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FAF8F2] z-10 shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
