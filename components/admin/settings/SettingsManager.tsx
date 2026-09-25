"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  User,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Radio,
  Server,
} from "lucide-react";
import { SettingsData, SystemStatusData } from "@/lib/settings/service";

interface SettingsManagerProps {
  initialSettings: SettingsData;
  systemStatus: SystemStatusData;
  userRole: "super_admin" | "admin" | "editor";
}

export function SettingsManager({
  initialSettings,
  systemStatus,
  userRole,
}: SettingsManagerProps) {
  const isReadOnly = userRole === "editor";

  const [formData, setFormData] = useState({
    studioName: initialSettings.studioName || "",
    instructorName: initialSettings.instructorName || "",
    websiteUrl: initialSettings.websiteUrl || "",
    contactEmail: initialSettings.contactEmail || "",
    contactPhone: initialSettings.contactPhone || "",
    supportWhatsapp: initialSettings.supportWhatsapp || "",
    defaultSenderName: initialSettings.defaultSenderName || "",
    replyToEmail: initialSettings.replyToEmail || "",
  });

  const [lastSaved, setLastSaved] = useState<string>(initialSettings.updatedAt);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>(initialSettings.updatedBy);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (isReadOnly) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage(null);
    setErrorMessage(null);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setErrorMessage(data.error || "Failed to save settings. Please review errors.");
        return;
      }

      setSuccessMessage("Settings saved successfully.");
      if (data.settings) {
        setLastSaved(data.settings.updatedAt);
        setLastUpdatedBy(data.settings.updatedBy);
      }
    } catch (err: any) {
      setErrorMessage("Network error occurred while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#68705A] px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#FAF8F2] mb-2">
              <Settings className="size-3" />
              <span>Studio Administration</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#292923]">Settings</h1>
            <p className="text-xs text-[#6F6B61] mt-1">
              Configure studio metadata, contact details, and notification defaults.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] px-2.5 py-1 rounded bg-[#E4EAD4] text-[#3D442F] font-bold">
              Role: {userRole}
            </span>
          </div>
        </div>

        {isReadOnly && (
          <div className="mt-4 p-3 rounded-lg bg-[#EFE9DF] border border-[#464137]/20 flex items-center gap-2 text-xs text-[#464137]">
            <Lock className="size-4 shrink-0 text-[#68705A]" />
            <span>
              <strong>Read-Only Mode:</strong> You are signed in as an Editor. Only Super Admins and Admins can update studio settings.
            </span>
          </div>
        )}
      </div>

      {/* Status Feedback Banners */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-[#E4EAD4] border border-[#68705A]/30 text-xs font-semibold text-[#3D442F] flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[#68705A]" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FBEAE5] border border-[#C25443]/30 text-xs font-semibold text-[#8C2C1D] flex items-center gap-2">
          <AlertCircle className="size-4 text-[#C25443]" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General & Studio */}
        <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#464137]/10">
            <Building2 className="size-4 text-[#68705A]" />
            <h2 className="font-serif text-base font-bold text-[#292923]">General &amp; Studio</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#292923] mb-1">
                Studio Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 size-4 text-[#6F6B61]/60" />
                <input
                  type="text"
                  value={formData.studioName}
                  disabled={isReadOnly}
                  onChange={(e) => handleInputChange("studioName", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                    fieldErrors.studioName ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                  } ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="Renuka Art Studio"
                />
              </div>
              {fieldErrors.studioName && (
                <p className="text-[0.7rem] text-red-600 mt-1">{fieldErrors.studioName[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292923] mb-1">
                Instructor / Founder Display Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-[#6F6B61]/60" />
                <input
                  type="text"
                  value={formData.instructorName}
                  disabled={isReadOnly}
                  onChange={(e) => handleInputChange("instructorName", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                    fieldErrors.instructorName ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                  } ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="Renuka Aggarwal"
                />
              </div>
              {fieldErrors.instructorName && (
                <p className="text-[0.7rem] text-red-600 mt-1">{fieldErrors.instructorName[0]}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#292923] mb-1">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 size-4 text-[#6F6B61]/60" />
                <input
                  type="text"
                  value={formData.websiteUrl}
                  disabled={isReadOnly}
                  onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                    fieldErrors.websiteUrl ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                  } ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="https://renukaartstudio.com"
                />
              </div>
              {fieldErrors.websiteUrl && (
                <p className="text-[0.7rem] text-red-600 mt-1">{fieldErrors.websiteUrl[0]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#464137]/10">
            <Mail className="size-4 text-[#68705A]" />
            <h2 className="font-serif text-base font-bold text-[#292923]">Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#292923] mb-1">
                Official Contact Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-[#6F6B61]/60" />
                <input
                  type="email"
                  value={formData.contactEmail}
                  disabled={isReadOnly}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                    fieldErrors.contactEmail ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                  } ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="contact@renukaartstudio.com"
                />
              </div>
              {fieldErrors.contactEmail && (
                <p className="text-[0.7rem] text-red-600 mt-1">{fieldErrors.contactEmail[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292923] mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 size-4 text-[#6F6B61]/60" />
                <input
                  type="text"
                  value={formData.contactPhone}
                  disabled={isReadOnly}
                  onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                    fieldErrors.contactPhone ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                  } ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="+91 98765 43210"
                />
              </div>
              {fieldErrors.contactPhone && (
                <p className="text-[0.7rem] text-red-600 mt-1">{fieldErrors.contactPhone[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292923] mb-1">
                WhatsApp Support Number
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-2.5 size-4 text-[#6F6B61]/60" />
                <input
                  type="text"
                  value={formData.supportWhatsapp}
                  disabled={isReadOnly}
                  onChange={(e) => handleInputChange("supportWhatsapp", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                    fieldErrors.supportWhatsapp ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                  } ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="+91 98765 43210"
                />
              </div>
              {fieldErrors.supportWhatsapp && (
                <p className="text-[0.7rem] text-red-600 mt-1">{fieldErrors.supportWhatsapp[0]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Notification Defaults */}
        <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#464137]/10">
            <Radio className="size-4 text-[#68705A]" />
            <h2 className="font-serif text-base font-bold text-[#292923]">Notification Defaults</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#292923] mb-1">
                Default Sender Display Name *
              </label>
              <input
                type="text"
                value={formData.defaultSenderName}
                disabled={isReadOnly}
                onChange={(e) => handleInputChange("defaultSenderName", e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                  fieldErrors.defaultSenderName ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                } ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder="Renuka Art Studio"
              />
              {fieldErrors.defaultSenderName && (
                <p className="text-[0.7rem] text-red-600 mt-1">{fieldErrors.defaultSenderName[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292923] mb-1">
                Reply-To Email Address *
              </label>
              <input
                type="email"
                value={formData.replyToEmail}
                disabled={isReadOnly}
                onChange={(e) => handleInputChange("replyToEmail", e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-xs bg-white text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] ${
                  fieldErrors.replyToEmail ? "border-red-400 bg-red-50/20" : "border-[#464137]/20"
                } ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                placeholder="contact@renukaartstudio.com"
              />
              {fieldErrors.replyToEmail && (
                <p className="text-[0.7rem] text-red-600 mt-1">{fieldErrors.replyToEmail[0]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: System Integrations & Security (Read-Only Status) */}
        <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#464137]/10">
            <Server className="size-4 text-[#68705A]" />
            <h2 className="font-serif text-base font-bold text-[#292923]">System Integrations &amp; Security</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Razorpay Gateway */}
            <div className="p-3 rounded-lg bg-[#F7F4EC] border border-[#464137]/10">
              <span className="text-[0.68rem] uppercase font-bold text-[#6F6B61] tracking-wider block mb-1">
                Payment Gateway
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#292923]">Razorpay</span>
                {systemStatus.paymentGateway.isConfigured ? (
                  <span className={`text-[0.68rem] px-2 py-0.5 rounded font-bold ${
                    systemStatus.paymentGateway.mode === "live"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {systemStatus.paymentGateway.mode === "live" ? "Live Mode" : "Test Mode"}
                  </span>
                ) : (
                  <span className="text-[0.68rem] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">
                    Not Configured
                  </span>
                )}
              </div>
            </div>

            {/* Resend Email Transport */}
            <div className="p-3 rounded-lg bg-[#F7F4EC] border border-[#464137]/10">
              <span className="text-[0.68rem] uppercase font-bold text-[#6F6B61] tracking-wider block mb-1">
                Email Transport
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#292923]">Resend</span>
                {systemStatus.emailService.isConfigured ? (
                  <span className="text-[0.68rem] px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold">
                    Configured
                  </span>
                ) : (
                  <span className="text-[0.68rem] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    Mock / Dev
                  </span>
                )}
              </div>
            </div>

            {/* Supabase Database & Auth */}
            <div className="p-3 rounded-lg bg-[#F7F4EC] border border-[#464137]/10">
              <span className="text-[0.68rem] uppercase font-bold text-[#6F6B61] tracking-wider block mb-1">
                Auth &amp; Database
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#292923]">Supabase RLS</span>
                <span className="text-[0.68rem] px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-[#EEE9DE]/60 p-4 border border-[#464137]/10 text-xs text-[#6F6B61] flex items-start gap-2">
            <ShieldCheck className="size-4 shrink-0 text-[#68705A] mt-0.5" />
            <div>
              <strong>Strict Security Guarantee:</strong> Payment secrets (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`), Resend API tokens, and Supabase service-role keys are securely encapsulated in server environment variables and are never transmitted to or editable via client browsers.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-[0.7rem] text-[#6F6B61]">
            Last updated: <span className="font-semibold">{new Date(lastSaved).toLocaleString()}</span>
            {lastUpdatedBy && <span> by <span className="font-semibold">{lastUpdatedBy}</span></span>}
          </div>

          {!isReadOnly && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#68705A] hover:bg-[#525946] text-[#FAF8F2] text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="size-3.5" />
              <span>{isSaving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
