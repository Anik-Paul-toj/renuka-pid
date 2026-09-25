"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { MessageTemplateRecord } from "@/lib/messages-admin/service";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Eye,
  Save,
  X,
} from "lucide-react";

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

interface MessagesManagerProps {
  initialTemplates: MessageTemplateRecord[];
  courses?: CourseItem[];
  batches?: BatchItem[];
  userRole?: string;
}

// Convert database tokens {{...}} into friendly brackets [Field Name] for natural editing
// and ensure any escaped \n sequences are converted to real line breaks
function dbToUiText(text: string | null): string {
  if (!text) return "";
  const clean = text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  return clean
    .replace(/\{\{student_name\}\}/g, "[Student Name]")
    .replace(/\{\{course_name\}\}/g, "[Course Name]")
    .replace(/\{\{batch_name\}\}/g, "[Batch Name]")
    .replace(/\{\{date\}\}/g, "[Date]")
    .replace(/\{\{time\}\}/g, "[Time]")
    .replace(/\{\{zoom_link\}\}/g, "[Join Link]")
    .replace(/\{\{booking_reference\}\}/g, "[Booking Reference]")
    .replace(/\{\{amount_paid\}\}/g, "[Amount Paid]")
    .replace(/\{\{payment_reference\}\}/g, "[Payment Reference]");
}

// Convert friendly brackets back into canonical database tokens {{...}}
function uiToDbText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[Student Name\]/gi, "{{student_name}}")
    .replace(/\[Course Name\]/gi, "{{course_name}}")
    .replace(/\[Batch Name\]/gi, "{{batch_name}}")
    .replace(/\[Date\]/gi, "{{date}}")
    .replace(/\[Time\]/gi, "{{time}}")
    .replace(/\[Join Link\]/gi, "{{zoom_link}}")
    .replace(/\[Zoom Link\]/gi, "{{zoom_link}}")
    .replace(/\[Booking Reference\]/gi, "{{booking_reference}}")
    .replace(/\[Amount Paid\]/gi, "{{amount_paid}}")
    .replace(/\[Payment Reference\]/gi, "{{payment_reference}}");
}

// Helper to format date cleanly: 2026-10-28 -> 28 October 2026
function formatBatchDate(dateStr?: string | null): string {
  if (!dateStr) return "28 October 2026";
  const trimmed = dateStr.trim();
  if (/[a-zA-Z]/.test(trimmed)) return trimmed;
  try {
    const d = new Date(trimmed + "T00:00:00");
    if (isNaN(d.getTime())) return trimmed;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return trimmed;
  }
}

// Helper to format time cleanly without ever duplicating AM/PM
function cleanTimeFormat(timeStr?: string | null): string {
  if (!timeStr) return "";
  const trimmed = timeStr.trim();
  // If already contains AM/PM, clean up any accidental duplicates
  if (/AM|PM/i.test(trimmed)) {
    return trimmed.replace(/\s+(AM|PM)\s+(AM|PM)/gi, " $1");
  }
  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return trimmed;
}

export function MessagesManager({
  initialTemplates,
  courses = [],
  batches = [],
  userRole = "admin",
}: MessagesManagerProps) {
  const [templates, setTemplates] = useState<MessageTemplateRecord[]>(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplates[0]?.id || ""
  );

  // Active template state
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0] || null;
  }, [templates, selectedTemplateId]);

  // Form states initialized with friendly text and real line breaks
  const [name, setName] = useState<string>(activeTemplate?.name || "");
  const [subject, setSubject] = useState<string>(dbToUiText(activeTemplate?.subject || ""));
  const [body, setBody] = useState<string>(dbToUiText(activeTemplate?.body || ""));

  // Track the active message selection and update form fields
  const handleSelectTemplate = (template: MessageTemplateRecord) => {
    setSelectedTemplateId(template.id);
    setName(template.name);
    setSubject(dbToUiText(template.subject));
    setBody(dbToUiText(template.body));
    setSaveMessage(null);
    setSaveError(null);
  };

  // Course and Batch selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || "");
  
  // Batches for the selected course
  const availableBatches = useMemo(() => {
    if (!selectedCourseId) return batches;
    const filtered = batches.filter((b) => b.course_id === selectedCourseId);
    return filtered.length > 0 ? filtered : batches;
  }, [batches, selectedCourseId]);

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    availableBatches[0]?.id || ""
  );

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0] || null;
  }, [courses, selectedCourseId]);

  const selectedBatch = useMemo(() => {
    return (
      availableBatches.find((b) => b.id === selectedBatchId) ||
      availableBatches[0] ||
      null
    );
  }, [availableBatches, selectedBatchId]);

  // Fully EDITABLE Date, Time, and Join Link fields
  const [dateValue, setDateValue] = useState<string>(
    formatBatchDate(selectedBatch?.start_date)
  );
  const [startTime, setStartTime] = useState<string>(
    cleanTimeFormat(selectedBatch?.start_time || "6:30 PM")
  );
  const [endTime, setEndTime] = useState<string>(
    cleanTimeFormat(selectedBatch?.end_time || "8:30 PM")
  );
  const [joinLink, setJoinLink] = useState<string>(
    selectedBatch?.zoom_join_url || "https://zoom.us/j/1234567890"
  );

  // When admin selects a new batch: populate Date, Time, Join Link defaults
  // BUT all three remain fully editable afterwards!
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const b = availableBatches.find((item) => item.id === batchId);
    if (b) {
      setDateValue(formatBatchDate(b.start_date));
      setStartTime(cleanTimeFormat(b.start_time || "6:30 PM"));
      setEndTime(cleanTimeFormat(b.end_time || "8:30 PM"));
      setJoinLink(b.zoom_join_url || "https://zoom.us/j/1234567890");
    }
  };

  // When course changes, update batch and its defaults
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const nextBatches = batches.filter((b) => b.course_id === courseId);
    if (nextBatches.length > 0) {
      const firstBatch = nextBatches[0];
      setSelectedBatchId(firstBatch.id);
      setDateValue(formatBatchDate(firstBatch.start_date));
      setStartTime(cleanTimeFormat(firstBatch.start_time || "6:30 PM"));
      setEndTime(cleanTimeFormat(firstBatch.end_time || "8:30 PM"));
      setJoinLink(firstBatch.zoom_join_url || "https://zoom.us/j/1234567890");
    }
  };

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preview Modal state
  const [showPreview, setShowPreview] = useState(false);

  // Ref for textarea insertion
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert friendly tag at cursor in body
  const handleInsertTag = (tag: string) => {
    if (!bodyTextareaRef.current) {
      setBody((prev) => (prev ? prev + " " + tag : tag));
      return;
    }
    const el = bodyTextareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newBody = body.substring(0, start) + tag + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Handle Save
  const handleSave = async () => {
    if (!activeTemplate) return;
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const dbSubject = activeTemplate.channel === "email" ? uiToDbText(subject) : null;
      const dbBody = uiToDbText(body);

      const res = await fetch(`/api/admin/messages/${activeTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || activeTemplate.name,
          subject: dbSubject,
          body: dbBody,
          is_active: activeTemplate.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to save message template");
      }

      // Update local template state
      setTemplates((prev) =>
        prev.map((t) => (t.id === activeTemplate.id ? data.data : t))
      );
      setSaveMessage("Changes saved successfully!");
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Realistic sample message rendering for Preview using the edited values
  const formattedTimeRange = useMemo(() => {
    if (startTime && endTime) return `${startTime} – ${endTime}`;
    return startTime || endTime || "6:30 PM – 8:30 PM";
  }, [startTime, endTime]);

  const previewSubject = useMemo(() => {
    if (!activeTemplate || activeTemplate.channel !== "email") return "";
    return subject
      .replace(/\[Course Name\]|\{\{course_name\}\}/gi, selectedCourse?.title || "The WATERCOLOUR Roadmap: One-Day Masterclass")
      .replace(/\[Batch Name\]|\{\{batch_name\}\}/gi, selectedBatch?.batch_name || "Live Masterclass — 28 Oct 2026")
      .replace(/\[Student Name\]|\{\{student_name\}\}/gi, "Anik Paul")
      .replace(/\[Date\]|\{\{date\}\}/gi, dateValue)
      .replace(/\[Time\]|\{\{time\}\}/gi, formattedTimeRange)
      .replace(/\[Join Link\]|\[Zoom Link\]|\{\{zoom_link\}\}/gi, joinLink);
  }, [subject, activeTemplate, selectedCourse, selectedBatch, dateValue, formattedTimeRange, joinLink]);

  const previewBody = useMemo(() => {
    return body
      .replace(/\[Student Name\]|\{\{student_name\}\}/gi, "Anik Paul")
      .replace(/\[Course Name\]|\{\{course_name\}\}/gi, selectedCourse?.title || "The WATERCOLOUR Roadmap: One-Day Masterclass")
      .replace(/\[Batch Name\]|\{\{batch_name\}\}/gi, selectedBatch?.batch_name || "Live Masterclass — 28 Oct 2026")
      .replace(/\[Date\]|\{\{date\}\}/gi, dateValue)
      .replace(/\[Time\]|\{\{time\}\}/gi, formattedTimeRange)
      .replace(/\[Join Link\]|\[Zoom Link\]|\{\{zoom_link\}\}/gi, joinLink)
      .replace(/\[Booking Reference\]|\{\{booking_reference\}\}/gi, "REF-ABC123")
      .replace(/\[Amount Paid\]|\{\{amount_paid\}\}/gi, "₹199")
      .replace(/\[Payment Reference\]|\{\{payment_reference\}\}/gi, "pay_TEST123");
  }, [body, selectedCourse, selectedBatch, dateValue, formattedTimeRange, joinLink]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Messages
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Compose and customize messages sent to students.
        </p>
      </div>

      {/* Message Template Selector */}
      <div className="flex flex-wrap gap-2 pt-1">
        {templates.map((tpl) => {
          const isSelected = tpl.id === activeTemplate?.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tpl)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-600 ring-offset-2"
                  : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {tpl.channel === "email" ? (
                <Mail className={`w-4 h-4 ${isSelected ? "text-white" : "text-amber-600"}`} />
              ) : (
                <MessageSquare className={`w-4 h-4 ${isSelected ? "text-white" : "text-emerald-600"}`} />
              )}
              <span>{tpl.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Simple Message Form */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        {/* 1. MESSAGE NAME */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Message Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            placeholder="e.g. Booking Confirmation Email"
          />
        </div>

        {/* 2. SUBJECT (Email Only) */}
        {activeTemplate?.channel === "email" && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              placeholder="e.g. Your seat is reserved for [Course Name]! 🎨"
            />
          </div>
        )}

        {/* 3. COURSE & BATCH SELECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            >
              {availableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. DATE (Fully Editable) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Date
          </label>
          <input
            type="text"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            placeholder="e.g. 28 October 2026"
          />
        </div>

        {/* 5. TIME (Fully Editable Start & End Time: 6:30 PM – 8:30 PM) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Time
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              placeholder="e.g. 6:30 PM"
            />
            <span className="text-stone-400 font-medium">–</span>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              placeholder="e.g. 8:30 PM"
            />
          </div>
        </div>

        {/* 6. JOIN LINK (Fully Editable Input) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Join Link
          </label>
          <input
            type="text"
            value={joinLink}
            onChange={(e) => setJoinLink(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            placeholder="e.g. https://zoom.us/j/1234567890"
          />
        </div>

        {/* 7. MESSAGE BODY (Real Line Breaks, Zero Escaped \n) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Message
          </label>
          <textarea
            ref={bodyTextareaRef}
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-900 text-sm leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-y whitespace-pre-wrap"
            placeholder="Type your message here..."
          />

          {/* Insert into message helper buttons */}
          <div className="mt-3">
            <span className="text-xs font-medium text-stone-500 block mb-2">
              Insert into message:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                "[+ Student Name]",
                "[+ Course Name]",
                "[+ Batch Name]",
                "[+ Date]",
                "[+ Time]",
                "[+ Join Link]",
                "[+ Booking Reference]",
              ].map((tagWithPlus) => {
                const tagToInsert = tagWithPlus.replace("+ ", "");
                return (
                  <button
                    key={tagWithPlus}
                    type="button"
                    onClick={() => handleInsertTag(tagToInsert)}
                    className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-amber-50 hover:border-amber-300 text-stone-700 hover:text-amber-900 border border-stone-200 text-xs font-medium transition-colors"
                  >
                    {tagWithPlus}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {saveMessage && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* 8. ACTIONS: PREVIEW & SAVE */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4 text-stone-500" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Simple Clean Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  Message Preview
                </h3>
                <p className="text-xs text-stone-500">
                  This is how the message appears to the student
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {activeTemplate?.channel === "email" && (
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1.5 text-xs text-stone-600">
                  <div>
                    <span className="font-semibold text-stone-800">From: </span>
                    Renuka Aggarwal &lt;artandsoul.studios@gmail.com&gt;
                  </div>
                  <div>
                    <span className="font-semibold text-stone-800">To: </span>
                    Anik Paul &lt;anik.paul@example.com&gt;
                  </div>
                  <div>
                    <span className="font-semibold text-stone-800">Subject: </span>
                    <span className="font-medium text-stone-900">{previewSubject}</span>
                  </div>
                </div>
              )}

              {/* Rendered Text with real line breaks */}
              <div
                className={`rounded-xl p-5 border text-sm leading-relaxed whitespace-pre-wrap font-sans ${
                  activeTemplate?.channel === "whatsapp"
                    ? "bg-[#EFEAE2] border-emerald-200 text-stone-800"
                    : "bg-white border-stone-200 text-stone-800"
                }`}
              >
                {previewBody}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-3.5 bg-stone-50 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
