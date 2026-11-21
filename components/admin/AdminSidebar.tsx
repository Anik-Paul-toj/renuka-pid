"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  Image as ImageIcon,
  Video,
  Users,
  Ticket,
  CreditCard,
  Mail,
  Radio,
  Bell,
  Settings,
  ExternalLink,
  X,
  ShieldCheck,
  KeyRound,
  MessageSquareText,
} from "lucide-react";
import { AdminProfile } from "@/lib/auth/admin";
import { StudioLogo } from "@/components/ui/StudioLogo";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: "super_admin" | "admin" | "editor";
  badge?: string;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { name: "Course / Workshop", href: "/admin/courses", icon: GraduationCap },
      { name: "Batches / Schedule", href: "/admin/batches", icon: Calendar },
      { name: "Gallery / Media", href: "/admin/media", icon: ImageIcon },
      { name: "Testimonials", href: "/admin/testimonials", icon: Video },
      { name: "YT Video", href: "/admin/yt-video", icon: Video },
    ],
  },
  {
    label: "Sales",
    items: [
      { name: "Students", href: "/admin/students", icon: Users },
      { name: "Bookings", href: "/admin/bookings", icon: Ticket },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Messages", href: "/admin/messages", icon: Mail },
      { name: "Broadcast", href: "/admin/broadcast", icon: Radio },
      { name: "Message Templates", href: "/admin/message-templates", icon: MessageSquareText },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", href: "/admin/settings", icon: Settings }],
  },
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
      <div className="p-4 border-b border-[#464137]/10 flex items-center justify-between">
        <Link
          href="/admin"
          className="flex items-center gap-2 min-w-0"
          aria-label="Renuka Art Studio Admin Portal"
        >
          {/* Black logo on the light sidebar background */}
          <StudioLogo variant="black" height={36} />
          <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#68705A] shrink-0">
            Admin
          </span>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-md text-[#6F6B61] hover:bg-[#F7F4EC] hover:text-[#292923]"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Admin navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#6F6B61]/80">
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              if (item.minRole === "super_admin" && adminProfile.role !== "super_admin") {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[0.82rem] transition-all ${
                    isActive
                      ? "bg-[#68705A]/12 text-[#292923] font-semibold"
                      : "text-[#464137] font-medium hover:bg-[#EEE9DE]/70 hover:text-[#292923]"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#68705A]" />
                  )}
                  <span
                    className={`grid size-7 place-items-center rounded-md transition-colors ${
                      isActive
                        ? "bg-[#68705A] text-[#FAF8F2] shadow-sm"
                        : "bg-[#EEE9DE]/60 text-[#6F6B61] group-hover:bg-[#C8D1C7]/50 group-hover:text-[#444C38]"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto text-[0.65rem] px-1.5 py-0.5 rounded bg-[#C8D1C7]/40 text-[#464137]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

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

        <div className="px-1 pt-1">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#68705A] text-[#FAF8F2] text-xs font-bold">
              {(adminProfile.full_name || adminProfile.email || "A").trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
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
      {/* Slide-out drawer (all screen sizes) */}
      <div
        className={`fixed inset-0 z-50 ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onCloseMobile}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#FAF8F2] shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {navContent}
        </aside>
      </div>
    </>
  );
}
