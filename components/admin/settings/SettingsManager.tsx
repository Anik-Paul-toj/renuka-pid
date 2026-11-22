"use client";

import React from "react";
import { Settings, Lock } from "lucide-react";
import { SettingsData, SystemStatusData } from "@/lib/settings/service";
import { HeroImageCard } from "./HeroImageCard";
import { FooterContactCard } from "./FooterContactCard";

interface SettingsManagerProps {
  initialSettings?: SettingsData;
  systemStatus?: SystemStatusData;
  userRole: "super_admin" | "admin" | "editor";
}

export function SettingsManager({ userRole }: SettingsManagerProps) {
  const isReadOnly = userRole === "editor";

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#68705A] px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#FAF8F2] mb-2">
              <Settings className="size-3" />
              <span>Studio Administration</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#292923]">Settings</h1>
            <p className="text-xs text-[#6F6B61] mt-1">
              Update the hero profile image and the footer contact details of the landing page.
            </p>
          </div>
          <span className="text-[0.7rem] px-2.5 py-1 rounded bg-[#E4EAD4] text-[#3D442F] font-bold self-start sm:self-auto">
            Role: {userRole}
          </span>
        </div>

        {isReadOnly && (
          <div className="mt-4 p-3 rounded-lg bg-[#EFE9DF] border border-[#464137]/20 flex items-center gap-2 text-xs text-[#464137]">
            <Lock className="size-4 shrink-0 text-[#68705A]" />
            <span>
              <strong>Read-Only Mode:</strong> You are signed in as an Editor. Only Super Admins and Admins can update these.
            </span>
          </div>
        )}
      </div>

      <HeroImageCard canPublish={!isReadOnly} />
      <FooterContactCard canPublish={!isReadOnly} />
    </div>
  );
}
