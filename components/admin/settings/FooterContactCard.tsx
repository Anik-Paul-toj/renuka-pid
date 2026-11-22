"use client";

import React, { useEffect, useState } from "react";
import { Mail, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { masterclassData } from "@/data/content";

const SECTION_URL = "/api/admin/landing-content/footer";

export function FooterContactCard({ canPublish }: { canPublish: boolean }) {
  const [section, setSection] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState({ email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      let base: any = masterclassData.footer;
      try {
        const res = await fetch(SECTION_URL, { cache: "no-store" });
        const json = await res.json();
        // Base on live (published) content so unrelated drafts never go live.
        base = json?.data?.published ?? base;
      } catch {
        /* fall back to static defaults */
      }
      setSection(base);
      setEmail(base.contactEmail ?? "");
      setPhone(base.contactPhone ?? "");
      setSaved({ email: base.contactEmail ?? "", phone: base.contactPhone ?? "" });
      setLoading(false);
    })();
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const unchanged = email.trim() === saved.email && phone.trim() === saved.phone;

  async function save() {
    if (!emailValid || !section) return;
    setSaving(true);
    setMessage(null);
    const content = { ...section, contactEmail: email.trim(), contactPhone: phone.trim() };
    try {
      const res = await fetch(SECTION_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", content }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error?.message || "Save failed");
      setSection(content);
      setSaved({ email: content.contactEmail, phone: content.contactPhone });
      setMessage({ ok: true, text: "Saved. The landing page footer contact details are updated." });
    } catch (err: any) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full pl-9 pr-3 py-2 rounded-lg border border-[#464137]/20 bg-white text-xs text-[#292923] focus:outline-none focus:ring-1 focus:ring-[#68705A] disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-[#464137]/10">
        <Mail className="size-4 text-[#68705A]" />
        <h2 className="font-serif text-base font-bold text-[#292923]">Footer Contact Details</h2>
      </div>
      <p className="text-xs text-[#6F6B61]">
        Shown in the contact area of the landing page footer. The WhatsApp link uses the phone number.
      </p>

      {loading ? (
        <p className="text-xs text-[#6F6B61]">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#292923] mb-1">Contact Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-[#6F6B61]/60" />
                <input
                  type="email"
                  value={email}
                  disabled={!canPublish}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="renuka.art.studio25@gmail.com"
                />
              </div>
              {email && !emailValid && (
                <p className="text-[0.7rem] text-red-600 mt-1">Enter a valid email address.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#292923] mb-1">Phone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 size-4 text-[#6F6B61]/60" />
                <input
                  type="text"
                  value={phone}
                  disabled={!canPublish}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+91 95991 09200"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!canPublish || saving || !emailValid || unchanged}
              className="rounded-md bg-[#68705A] px-3.5 py-1.5 text-xs font-semibold text-[#FAF8F2] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save & publish"}
            </button>
            {!canPublish && (
              <span className="text-[0.7rem] text-[#6F6B61]">Only administrators can change this.</span>
            )}
            {message && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  message.ok ? "text-[#3D442F]" : "text-[#8C2C1D]"
                }`}
              >
                {message.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                {message.text}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
