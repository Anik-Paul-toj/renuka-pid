"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  RefreshCw,
  Send,
  Ticket,
  ExternalLink,
  Plus,
  Users,
} from "lucide-react";
import { CreateTemplateModal } from "@/components/admin/messages/CreateTemplateModal";
import {
  formatBatchDateFullMonthIST,
  formatBatchTimeIST,
} from "@/lib/batches-admin/format";

interface CourseItem {
  id: string;
  title: string;
}
interface BatchItem {
  id: string;
  course_id: string;
  batch_name: string;
  start_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  zoom_join_url: string | null;
}

interface Props {
  courses: CourseItem[];
  batches: BatchItem[];
  userRole: string;
}

type Tab = "confirmation" | "live";

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  REJECTED: "bg-rose-100 text-rose-800",
  DRAFT: "bg-stone-200 text-stone-700",
};

function bodyText(tpl: any): string {
  return tpl?.components?.find((c: any) => c.type === "BODY")?.text || "";
}

function renderTemplate(tpl: any, vars: Record<string, string>) {
  const header = tpl?.components?.find((c: any) => c.type === "HEADER")?.text;
  const footer = tpl?.components?.find((c: any) => c.type === "FOOTER")?.text;
  let body = bodyText(tpl);
  for (const [ph, val] of Object.entries(vars)) body = body.split(ph).join(val);
  return { header, body, footer };
}

function WhatsAppBubble({ tpl, vars }: { tpl: any; vars: Record<string, string> }) {
  const { header, body, footer } = renderTemplate(tpl, vars);
  return (
    <div className="rounded-xl bg-[#E7F7DC] p-3.5 text-xs text-[#111B21] shadow-sm space-y-1.5 whitespace-pre-line max-w-md border border-black/5">
      {header && <p className="font-bold">{header}</p>}
      <p>{body || "No body text."}</p>
      {footer && <p className="text-[0.68rem] text-stone-500">{footer}</p>}
    </div>
  );
}

export function MessagesHub({ courses, batches, userRole }: Props) {
  const isReadOnly = userRole === "editor";
  const [tab, setTab] = useState<Tab>("confirmation");

  return (
    <div className="space-y-6 w-full pb-16">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">Messages</h1>
        <p className="text-sm text-stone-500 mt-1">
          Booking confirmations and &ldquo;course live now&rdquo; announcements, sent to students through WhatsApp (Meta).
        </p>
      </div>

      <div role="tablist" className="flex gap-2 border-b border-stone-200">
        {(
          [
            ["confirmation", "Booking Confirmation", Ticket],
            ["live", "Course Live Now", Megaphone],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === id
                ? "border-[#68705A] text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "confirmation" ? (
        <ConfirmationTab isReadOnly={isReadOnly} courses={courses} />
      ) : (
        <CourseLiveTab isReadOnly={isReadOnly} courses={courses} batches={batches} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 1: Booking confirmation                                         */
/* ------------------------------------------------------------------ */
function ConfirmationTab({
  isReadOnly,
  courses,
}: {
  isReadOnly: boolean;
  courses: CourseItem[];
}) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/message-templates?purpose=confirmation", { cache: "no-store" });
      const data = await res.json();
      setTemplates(data?.success ? data.data : []);
    } catch {
      setMsg({ ok: false, text: "Failed to load confirmation templates." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async () => {
    setBusy("sync");
    setMsg(null);
    try {
      const res = await fetch("/api/admin/message-templates/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Sync failed");
      setMsg({ ok: true, text: `Synced with Meta (${data.data?.syncedCount ?? 0} updated, ${data.data?.importedCount ?? 0} imported).` });
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  };

  const assign = async (id: string, body: { isDefault?: boolean; courseId?: string | null }) => {
    setBusy(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/message-templates/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update template");
      setMsg({ ok: true, text: "Confirmation template updated." });
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  };

  const sampleVars = (tpl: any): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const v of tpl.variableDefinitions || []) out[v.placeholder] = v.sampleValue || v.name;
    return out;
  };

  const createModal = creating ? (
    <CreateTemplateModal
      purpose="confirmation"
      courses={courses}
      onClose={() => setCreating(false)}
      onDone={(text) => {
        setCreating(false);
        setMsg({ ok: true, text });
        load();
      }}
    />
  ) : null;

  const hasApprovedDefault = templates.some((t) => t.metaStatus === "APPROVED" && t.isDefaultConfirmation);

  return (
    <div className="space-y-8">
      {createModal}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900">WhatsApp confirmation (Meta)</h2>
            <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
              Sent automatically to a student right after their booking is confirmed. Only templates
              <strong> approved by Meta</strong> are used. Order: course-specific template, then the default, then
              <code className="mx-1">booking_confirmation</code>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={sync}
              disabled={busy === "sync"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${busy === "sync" ? "animate-spin" : ""}`} />
              Sync with Meta
            </button>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#68705A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#575E4B] cursor-pointer"
              >
                <Plus className="size-3.5" />
                Create template
              </button>
            )}
            <Link
              href="/admin/message-templates"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
            >
              All templates
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>

        {msg && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
              msg.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-rose-300 bg-rose-50 text-rose-900"
            }`}
          >
            {msg.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {!loading && templates.length > 0 && !hasApprovedDefault && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>
              No approved default confirmation template is set. Pick an approved template below and choose
              &ldquo;Use as default&rdquo;, otherwise students may not get a WhatsApp confirmation.
            </span>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-stone-500">Loading templates...</p>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-stone-600">
            No confirmation templates yet. Use &ldquo;Create template&rdquo; above, submit it to Meta, then press
            &ldquo;Sync with Meta&rdquo; once it is approved.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-stone-900 truncate">{t.internalTitle}</h3>
                    <p className="font-mono text-[0.7rem] text-stone-500">{t.metaTemplateName}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase ${
                        STATUS_STYLE[t.metaStatus] || STATUS_STYLE.DRAFT
                      }`}
                    >
                      {t.metaStatus}
                    </span>
                    {t.isDefaultConfirmation && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#68705A] px-2 py-0.5 text-[0.62rem] font-bold uppercase text-white">
                        <BadgeCheck className="size-3" /> Default
                      </span>
                    )}
                  </div>
                </div>

                <WhatsAppBubble tpl={t} vars={sampleVars(t)} />

                {!isReadOnly && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={t.metaStatus !== "APPROVED" || t.isDefaultConfirmation || busy === t.id}
                      onClick={() => assign(t.id, { isDefault: true })}
                      title={t.metaStatus !== "APPROVED" ? "Only Meta-approved templates can be used" : undefined}
                      className="rounded-lg bg-[#68705A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#575E4B] disabled:opacity-40 cursor-pointer"
                    >
                      Use as default
                    </button>
                    <label className="flex items-center gap-1.5 text-xs text-stone-600">
                      Only for course:
                      <select
                        value={t.assignedCourseId || ""}
                        disabled={t.metaStatus !== "APPROVED" || busy === t.id}
                        onChange={(e) => assign(t.id, { courseId: e.target.value || null })}
                        className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs"
                      >
                        <option value="">All courses</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title.length > 38 ? c.title.slice(0, 38) + "..." : c.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
                {t.metaStatus === "REJECTED" && t.metaRejectionReason && (
                  <p className="text-xs text-rose-700">Rejected by Meta: {t.metaRejectionReason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 2: Course live now                                              */
/* ------------------------------------------------------------------ */
type Audience = "all" | "course" | "confirmed";

const AUDIENCES: { id: Audience; label: string; hint: string }[] = [
  { id: "all", label: "All students", hint: "Everyone in your student directory" },
  { id: "course", label: "Students of this course", hint: "Students who booked this course before" },
  { id: "confirmed", label: "Confirmed students", hint: "Students with a confirmed booking" },
];

function CourseLiveTab({
  isReadOnly,
  courses,
  batches,
}: {
  isReadOnly: boolean;
  courses: CourseItem[];
  batches: BatchItem[];
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [batchId, setBatchId] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [vars, setVars] = useState<Record<string, string>>({});
  const [count, setCount] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [zoomLink, setZoomLink] = useState("");

  const course = courses.find((c) => c.id === courseId);
  const courseBatches = useMemo(() => batches.filter((b) => b.course_id === courseId), [batches, courseId]);

  // default to the soonest upcoming batch of the course
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = [...courseBatches]
      .filter((b) => b.start_date >= today && !b.start_date.startsWith("2099"))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
    setBatchId(upcoming?.id || courseBatches[0]?.id || "");
  }, [courseBatches]);

  const batch = courseBatches.find((b) => b.id === batchId);
  const date = batch?.start_date && !batch.start_date.startsWith("2099") ? formatBatchDateFullMonthIST(batch.start_date) : "";
  const time = batch ? formatBatchTimeIST(batch.start_time, batch.end_time) : "";
  const joinLink = zoomLink.trim();

  // pre-fill the Zoom link from the selected batch; the admin can overwrite it
  useEffect(() => {
    setZoomLink(batch?.zoom_join_url || "");
  }, [batch?.id, batch?.zoom_join_url]);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/message-templates/approved?purpose=upcoming_batches", { cache: "no-store" });
      const data = await res.json();
      const list = data?.success ? data.data : [];
      setTemplates(list);
      setTemplateId((prev) => (list.some((t: any) => t.id === prev) ? prev : list[0]?.id || ""));
    } catch {
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const syncTemplates = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/message-templates/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Sync failed");
      await loadTemplates();
      setResult({ ok: true, text: "Synced with Meta. Approved templates are up to date." });
    } catch (e: any) {
      setResult({ ok: false, text: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const template = templates.find((t) => t.id === templateId) || null;

  // Build the variable mapping from the template definition
  useEffect(() => {
    if (!template) {
      setVars({});
      return;
    }
    const map: Record<string, string> = {};
    const defs = template.variableDefinitions || [];
    if (defs.length > 0) {
      for (const v of defs) {
        if (v.sourceField === "student_name") map[v.placeholder] = "[Student Name]";
        else if (v.sourceField === "course_name") map[v.placeholder] = course?.title || "[Course Name]";
        else if (v.sourceField === "batch_name") map[v.placeholder] = batch?.batch_name || "[Batch Name]";
        else if (v.sourceField === "batch_date") map[v.placeholder] = date || "[Date]";
        else if (v.sourceField === "batch_time") map[v.placeholder] = time || "[Time]";
        else if (v.sourceField === "zoom_link") map[v.placeholder] = joinLink || "[Join Link]";
        else map[v.placeholder] = v.sampleValue || "";
      }
    } else {
      for (const m of bodyText(template).match(/\{\{(\d+)\}\}/g) || []) {
        const n = m.replace(/\D/g, "");
        map[m] =
          n === "1" ? "[Student Name]" : n === "2" ? course?.title || "[Course Name]" : n === "3" ? date || "[Date]" : n === "4" ? time || "[Time]" : n === "5" ? joinLink || "[Join Link]" : "";
      }
    }
    setVars(map);
  }, [template, course, batch, date, time, joinLink]);

  const targetFilter = useMemo(
    () => ({
      audience,
      courseId: audience === "course" ? courseId : null,
      courseName: course?.title || null,
      batchId: null,
      batchName: batch?.batch_name || null,
      subject: `${course?.title || "Course"} is live now`,
      date,
      time,
      joinLink: joinLink || undefined,
      confirmedOnly: audience === "confirmed",
      selectedCustomerIds: null,
      templateId: template?.id,
      templateName: template?.metaTemplateName,
      templateLanguage: template?.language || "en_US",
      templateVariables: vars,
    }),
    [audience, courseId, course, batch, date, time, joinLink, template, vars]
  );

  // recipient count
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/broadcast/recipients-count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetFilter),
        });
        const data = await res.json();
        if (!cancelled && data?.success) setCount(data.count);
      } catch {
        if (!cancelled) setCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetFilter]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/broadcast?search=Course%20live%20now&limit=5", { cache: "no-store" });
      const data = await res.json();
      if (data?.success) setHistory(data.data.broadcasts || []);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const previewVars = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [ph, v] of Object.entries(vars)) {
      out[ph] = v
        .replace(/\[Student Name\]/gi, "Aarav")
        .replace(/\[Course Name\]/gi, course?.title || "")
        .replace(/\[Batch Name\]/gi, batch?.batch_name || "")
        .replace(/\[Date\]/gi, date || "to be announced")
        .replace(/\[Time\]/gi, time || "to be announced")
        .replace(/\[Join Link\]|\[Zoom Link\]/gi, joinLink || "(link shared later)");
    }
    return out;
  }, [vars, course, batch, date, time, joinLink]);

  const send = async () => {
    setConfirmOpen(false);
    setSending(true);
    setResult(null);
    try {
      const createRes = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Course live now: ${course?.title || ""}`.slice(0, 120),
          channel: "whatsapp",
          targetFilter,
          content: renderTemplate(template, previewVars).body || `${course?.title} is live now`,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok || !created.success) throw new Error(created?.error?.message || "Failed to prepare message.");

      const sendRes = await fetch(`/api/admin/broadcast/${created.data.id}/send`, { method: "POST" });
      const sent = await sendRes.json();
      if (!sendRes.ok || !sent.success) throw new Error(sent?.error?.message || "Failed to send message.");

      const d = sent.data;
      setResult({
        ok: d.failedSends === 0,
        text: `Sent to ${d.successfulSends} of ${d.totalRecipients} students${d.failedSends ? ` (${d.failedSends} failed, see Notifications)` : ""}.`,
      });
      loadHistory();
    } catch (e: any) {
      setResult({ ok: false, text: e.message || "Failed to send." });
    } finally {
      setSending(false);
    }
  };

  const canSend = !isReadOnly && !!template && !!courseId && (count ?? 0) > 0 && !sending;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {creating && (
        <CreateTemplateModal
          purpose="upcoming_batches"
          courses={courses}
          onClose={() => setCreating(false)}
          onDone={(text) => {
            setCreating(false);
            setResult({ ok: true, text });
            loadTemplates();
          }}
        />
      )}
      <div className="xl:col-span-7 space-y-5">
        <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900">Announce a course going live</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Sends an approved Meta WhatsApp template to students telling them the course or batch is open.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
              Course
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-stone-900"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
              Batch (for date &amp; time in the message)
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-stone-900"
              >
                {courseBatches.length === 0 && <option value="">No batches</option>}
                {courseBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
            Zoom link (goes into the Zoom link variable)
            <input
              type="url"
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              placeholder="https://zoom.us/j/..."
              className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-stone-900"
            />
            <span className="mt-1 block text-[0.7rem] font-normal normal-case tracking-normal text-stone-500">
              Filled from the selected batch when it has one. Change it here to send a different link.
            </span>
          </label>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Meta template</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={syncTemplates}
                  disabled={syncing}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`size-3 ${syncing ? "animate-spin" : ""}`} />
                  Sync with Meta
                </button>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    <Plus className="size-3" />
                    Create template
                  </button>
                )}
              </div>
            </div>
            {templates.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
                No approved &ldquo;course live now&rdquo; template yet. Use &ldquo;Create template&rdquo;, submit it to
                Meta, and press &ldquo;Sync with Meta&rdquo; once it is approved.
              </div>
            ) : (
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-900"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.internalTitle} ({t.metaTemplateName})
                  </option>
                ))}
              </select>
            )}
          </div>

          {Object.keys(vars).length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Template variables</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(vars).map(([ph, val]) => (
                  <label key={ph} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs">
                    <span className="font-mono text-stone-500">{ph}</span>
                    <input
                      value={val}
                      onChange={(e) => setVars((p) => ({ ...p, [ph]: e.target.value }))}
                      className="min-w-0 flex-1 bg-transparent text-stone-900 outline-none"
                    />
                  </label>
                ))}
              </div>
              <p className="text-[0.68rem] text-stone-500">
                [Student Name] is filled in separately for each student when sending.
              </p>
            </div>
          )}

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Send to</span>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAudience(a.id)}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    audience === a.id
                      ? "border-[#68705A] bg-[#68705A]/10 ring-2 ring-[#68705A]/25"
                      : "border-stone-200 bg-white hover:border-[#68705A]/50"
                  }`}
                >
                  <span className="block text-sm font-bold text-stone-900">{a.label}</span>
                  <span className="block text-[0.7rem] text-stone-500">{a.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              result.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-rose-300 bg-rose-50 text-rose-900"
            }`}
          >
            {result.ok ? <CheckCircle2 className="size-4 shrink-0 mt-0.5" /> : <AlertCircle className="size-4 shrink-0 mt-0.5" />}
            <span>{result.text}</span>
          </div>
        )}
      </div>

      <div className="xl:col-span-5 space-y-5 xl:sticky xl:top-20">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#68705A]">Message preview</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700">
              <Users className="size-3.5" />
              {count === null ? "..." : count} recipient{count === 1 ? "" : "s"}
            </span>
          </div>
          {template ? (
            <WhatsAppBubble tpl={template} vars={previewVars} />
          ) : (
            <p className="text-xs text-stone-500">Choose an approved template to see the preview.</p>
          )}

          {confirmOpen ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
              <p className="font-semibold">
                Send this WhatsApp message to {count} student{count === 1 ? "" : "s"} now? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={send}
                  className="rounded-md bg-[#68705A] px-3 py-1.5 font-bold text-white hover:bg-[#575E4B] cursor-pointer"
                >
                  Yes, send
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-md border border-amber-300 px-3 py-1.5 font-semibold hover:bg-amber-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canSend}
              onClick={() => setConfirmOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#68705A] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#575E4B] disabled:opacity-40 cursor-pointer"
            >
              <Send className="size-4" />
              {sending ? "Sending..." : "Send to students"}
            </button>
          )}
          {isReadOnly && <p className="text-xs text-stone-500">Editors have read-only access.</p>}
        </div>

        {history.length > 0 && (
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Recent announcements</span>
            <ul className="divide-y divide-stone-100">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                  <span className="truncate font-medium text-stone-800">{h.title}</span>
                  <span className="shrink-0 text-stone-500 tabular-nums">
                    {h.successfulSends ?? h.successful_sends ?? 0}/{h.totalRecipients ?? h.total_recipients ?? 0} · {h.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
