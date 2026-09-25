"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BroadcastListItem,
  BroadcastsListResult,
} from "@/lib/broadcast/service";
import {
  AudienceType,
  TargetFilterInput,
} from "@/lib/validations/broadcast";
import {
  Send,
  Users,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Video,
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
  zoom_join_url: string | null;
}

interface BroadcastManagerProps {
  initialData: BroadcastsListResult;
  courses: CourseItem[];
  batches: BatchItem[];
  userRole?: string;
}

// Pre-defined message templates for effortless admin selection
const PRESET_MESSAGES = [
  {
    id: "upcoming-reminder",
    name: "Upcoming Class Reminder",
    subject: "Reminder: Your watercolour masterclass is tomorrow",
    body: `Hi [Student Name],

Just a reminder that our watercolour masterclass is tomorrow.

Date: [Date]
Time: [Time]

Join here: [Join Link]

See you there!

Warmly,
Renuka`,
  },
  {
    id: "welcome-notice",
    name: "Welcome to Class",
    subject: "Welcome to [Course Name]! 🎨",
    body: `Hi [Student Name],

Welcome to [Course Name] ([Batch Name])! We are so excited to have you join us.

Date: [Date]
Time: [Time]

Join here: [Join Link]

Warmly,
Renuka Aggarwal
Renuka Art Studio`,
  },
  {
    id: "schedule-update",
    name: "Schedule Update",
    subject: "Important: Update regarding your upcoming masterclass",
    body: `Hi [Student Name],

Please note an important update regarding our upcoming session for [Course Name].

Date: [Date]
Time: [Time]

Join here: [Join Link]

Looking forward to seeing you.

Warmly,
Renuka Aggarwal
Renuka Art Studio`,
  },
  {
    id: "custom",
    name: "Custom Message",
    subject: "Announcement from Renuka Art Studio",
    body: `Hi [Student Name],

Type your custom announcement message here.

Date: [Date]
Time: [Time]

Join here: [Join Link]

Warmly,
Renuka Aggarwal`,
  },
];

export function BroadcastManager({
  initialData,
  courses,
  batches,
  userRole = "admin",
}: BroadcastManagerProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastListItem[]>(
    initialData.broadcasts
  );

  // 1. Message preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>("upcoming-reminder");

  // Active preset
  const activePreset = useMemo(() => {
    return PRESET_MESSAGES.find((p) => p.id === selectedPresetId) || PRESET_MESSAGES[0];
  }, [selectedPresetId]);

  // Form states
  const [messageName, setMessageName] = useState(activePreset.name);
  const [subject, setSubject] = useState(activePreset.subject);
  const [messageBody, setMessageBody] = useState(activePreset.body);
  const [isEditingCustomText, setIsEditingCustomText] = useState(false);

  // When preset changes, update values
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = PRESET_MESSAGES.find((item) => item.id === presetId);
    if (p) {
      setMessageName(p.name);
      setSubject(p.subject);
      setMessageBody(p.body);
      setIsEditingCustomText(presetId === "custom");
    }
  };

  // Channel Selection
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [whatsappStatus, setWhatsappStatus] = useState<{ isConfigured: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/whatsapp/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setWhatsappStatus(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Audience Selection
  const [audience, setAudience] = useState<AudienceType>("batch");

  // 3. Course and Batch
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ""
  );

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

  // 4. Server-Side Recipient Count Resolution
  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [isResolvingCount, setIsResolvingCount] = useState<boolean>(false);

  // Target Filter object
  const targetFilter: TargetFilterInput = useMemo(() => {
    const formattedDate = selectedBatch?.start_date
      ? new Date(selectedBatch.start_date + "T00:00:00").toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "28 October 2026";

    const formattedTime = selectedBatch
      ? `${selectedBatch.start_time} – ${selectedBatch.end_time}`
      : "6:30 PM – 8:30 PM";

    return {
      audience,
      courseId: audience === "course" || audience === "batch" ? selectedCourseId : null,
      courseName: selectedCourse?.title || null,
      batchId: audience === "batch" ? selectedBatchId : null,
      batchName: selectedBatch?.batch_name || null,
      subject,
      date: formattedDate,
      time: formattedTime,
      joinLink: selectedBatch?.zoom_join_url || "https://zoom.us/j/1234567890",
      confirmedOnly: audience === "confirmed",
    };
  }, [audience, selectedCourseId, selectedBatchId, selectedCourse, selectedBatch, subject]);

  // Query server-side recipient count whenever filter changes
  useEffect(() => {
    let isCancelled = false;
    async function updateCount() {
      setIsResolvingCount(true);
      try {
        const res = await fetch("/api/admin/broadcast/recipients-count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetFilter),
        });
        const data = await res.json();
        if (!isCancelled && data.success) {
          setRecipientCount(data.count);
        }
      } catch (err) {
        console.error("Failed to fetch recipient count:", err);
      } finally {
        if (!isCancelled) setIsResolvingCount(false);
      }
    }
    updateCount();
    return () => {
      isCancelled = true;
    };
  }, [targetFilter]);

  // Status and feedback
  const [isSending, setIsSending] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
  const [viewingBroadcastDetail, setViewingBroadcastDetail] = useState<BroadcastListItem | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick insertion helpers
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      setMessageBody((prev) => (prev ? prev + " " + tag : tag));
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = messageBody.substring(0, start) + tag + messageBody.substring(end);
    setMessageBody(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Realistic resolved preview text
  const previewSubject = useMemo(() => {
    return subject
      .replace(/\[Student Name\]|\{\{student_name\}\}/gi, "Anik")
      .replace(/\[Course Name\]|\{\{course_name\}\}/gi, selectedCourse?.title || "The WATERCOLOUR Roadmap: One-Day Masterclass")
      .replace(/\[Batch Name\]|\{\{batch_name\}\}/gi, selectedBatch?.batch_name || "Live Masterclass — 28 Oct 2026")
      .replace(/\[Date\]|\{\{date\}\}/gi, targetFilter.date || "28 October 2026")
      .replace(/\[Time\]|\{\{time\}\}/gi, targetFilter.time || "6:30 PM – 8:30 PM")
      .replace(/\[Join Link\]|\[Zoom Link\]|\{\{zoom_link\}\}/gi, targetFilter.joinLink || "https://zoom.us/j/1234567890");
  }, [subject, selectedCourse, selectedBatch, targetFilter]);

  const previewBody = useMemo(() => {
    return messageBody
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\[Student Name\]|\{\{student_name\}\}/gi, "Anik")
      .replace(/\[Course Name\]|\{\{course_name\}\}/gi, selectedCourse?.title || "The WATERCOLOUR Roadmap: One-Day Masterclass")
      .replace(/\[Batch Name\]|\{\{batch_name\}\}/gi, selectedBatch?.batch_name || "Live Masterclass — 28 Oct 2026")
      .replace(/\[Date\]|\{\{date\}\}/gi, targetFilter.date || "28 October 2026")
      .replace(/\[Time\]|\{\{time\}\}/gi, targetFilter.time || "6:30 PM – 8:30 PM")
      .replace(/\[Join Link\]|\[Zoom Link\]|\{\{zoom_link\}\}/gi, targetFilter.joinLink || "https://zoom.us/j/1234567890");
  }, [messageBody, selectedCourse, selectedBatch, targetFilter]);

  // Dispatch Send
  const handleConfirmSend = async () => {
    setShowConfirmSendModal(false);
    setIsSending(true);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    try {
      // 1. Create broadcast record first
      const payload = {
        title: messageName.trim() || "Broadcast Announcement",
        channel: channel,
        targetFilter,
        content: messageBody,
      };

      const createRes = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.error?.message || "Failed to prepare broadcast.");
      }

      const broadcastId = createData.data.id;

      // 2. Dispatch broadcast
      const sendRes = await fetch(`/api/admin/broadcast/${broadcastId}/send`, {
        method: "POST",
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok || !sendData.success) {
        throw new Error(sendData.error?.message || "Failed to dispatch broadcast.");
      }

      // 3. Refresh list
      const listRes = await fetch("/api/admin/broadcast");
      const listData = await listRes.json();
      if (listData.success) {
        setBroadcasts(listData.data.broadcasts);
      }

      setFeedbackSuccess(
        `Broadcast sent successfully! Delivered to ${sendData.data.successfulSends} recipients.`
      );
    } catch (err: any) {
      setFeedbackError(err.message || "Failed to dispatch broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  // Delete Draft
  const handleDeleteDraft = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    try {
      const res = await fetch(`/api/admin/broadcast/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error?.message || "Failed to delete draft.");
        return;
      }
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Error deleting draft.");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Broadcast
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Send an announcement or reminder directly to your students.
        </p>
      </div>

      {/* Main Broadcast Form Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* CHANNEL SELECTOR */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Channel
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                channel === "email"
                  ? "bg-amber-50/80 border-amber-600 text-amber-900"
                  : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setChannel("whatsapp")}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                channel === "whatsapp"
                  ? "bg-emerald-50/80 border-emerald-600 text-emerald-900"
                  : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"
              }`}
            >
              WhatsApp
            </button>
          </div>
        </div>

        {/* WhatsApp Not Configured Notice */}
        {channel === "whatsapp" && whatsappStatus && !whatsappStatus.isConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">WhatsApp is not configured</p>
              <p className="mt-0.5 text-amber-700">
                Add the required server-side WhatsApp Business API configuration before sending.
              </p>
            </div>
          </div>
        )}

        {/* 1. MESSAGE SELECTOR */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Message
          </label>
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium"
          >
            {PRESET_MESSAGES.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. AUDIENCE */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Audience
          </label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as AudienceType)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium"
          >
            <option value="batch">Students of selected batch</option>
            <option value="course">Students of selected course</option>
            <option value="all">All Students</option>
            <option value="confirmed">Confirmed Students Only</option>
          </select>
        </div>

        {/* 3. COURSE (when relevant) */}
        {(audience === "course" || audience === "batch") && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                const nextBatches = batches.filter((b) => b.course_id === e.target.value);
                if (nextBatches.length > 0) setSelectedBatchId(nextBatches[0].id);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 4. BATCH (when relevant) */}
        {audience === "batch" && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            >
              {availableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 5. RECIPIENTS COUNT */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Recipients
          </label>
          <div className="flex items-center gap-2 text-stone-800 font-medium text-sm px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200">
            <Users className="w-4 h-4 text-stone-500" />
            <span>
              {isResolvingCount ? "Calculating..." : `${recipientCount} students`}
            </span>
          </div>
        </div>

        {/* Optional Edit Message Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsEditingCustomText(!isEditingCustomText)}
            className="text-xs text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditingCustomText ? "Hide text editor" : "Customize message text"}</span>
          </button>
        </div>

        {/* Custom Textarea Editor (if toggled or on Custom Message) */}
        {isEditingCustomText && (
          <div className="space-y-4 pt-2 border-t border-stone-100 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Message Body
              </label>
              <textarea
                ref={textareaRef}
                rows={8}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-y whitespace-pre-wrap"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  "[+ Student Name]",
                  "[+ Course Name]",
                  "[+ Batch Name]",
                  "[+ Date]",
                  "[+ Time]",
                  "[+ Join Link]",
                ].map((pill) => {
                  const tag = pill.replace("+ ", "");
                  return (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="px-2.5 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 text-xs transition-colors"
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 6. MESSAGE PREVIEW (Exact Visual Preview Box) */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            Message Preview
          </label>
          <div className="border border-stone-200 rounded-xl p-5 bg-[#FAF9F5] text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {previewBody}
          </div>
        </div>

        {/* Feedback Notices */}
        {feedbackSuccess && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        )}
        {feedbackError && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{feedbackError}</span>
          </div>
        )}

        {/* 7. ACTION BUTTONS: [ Preview ] and [ Send Broadcast ] */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4 text-stone-500" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmSendModal(true)}
            disabled={isSending || recipientCount === 0 || userRole === "editor"}
            title={userRole === "editor" ? "Editors cannot dispatch broadcasts" : undefined}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? "Sending..." : "Send Broadcast"}</span>
          </button>
        </div>
      </div>

      {/* Broadcast History Table */}
      {broadcasts.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-serif font-bold text-stone-900">
            Recent Broadcasts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3">Audience</th>
                  <th className="py-2.5 px-3">Recipients</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {broadcasts.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-3 font-medium text-stone-900">
                      {b.title}
                    </td>
                    <td className="py-3 px-3 text-stone-600 capitalize">
                      {b.targetFilter?.audience || "All"}
                    </td>
                    <td className="py-3 px-3 text-stone-700">
                      {b.successfulSends} / {b.totalRecipients}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          b.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "processing"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-stone-100 text-stone-600 border border-stone-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setViewingBroadcastDetail(b)}
                        className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Send Modal */}
      {showConfirmSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              Confirm Broadcast Send
            </h3>

            <div className="space-y-2.5 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-700">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-500 uppercase tracking-wider">Template:</span>
                <span className="font-medium text-stone-900 text-right">{messageName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-500 uppercase tracking-wider">Audience:</span>
                <span className="font-medium text-stone-900 text-right capitalize">
                  {audience === "batch"
                    ? `Selected Batch (${selectedBatch?.batch_name || "Batch"})`
                    : audience === "course"
                    ? `Selected Course (${selectedCourse?.title || "Course"})`
                    : audience === "confirmed"
                    ? "Confirmed Students"
                    : "All Students"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-500 uppercase tracking-wider">Recipients:</span>
                <span className="font-bold text-stone-900">{recipientCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-500 uppercase tracking-wider">Channel:</span>
                <span className={`font-bold uppercase px-2 py-0.5 rounded text-[11px] ${
                  channel === "whatsapp"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {channel}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-400">
              This action will dispatch individual {channel === "whatsapp" ? "WhatsApp messages" : "emails"} immediately and cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowConfirmSendModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-stone-700 text-sm font-medium hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="px-5 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
              >
                Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  Message Preview
                </h3>
                <p className="text-xs text-stone-500">
                  How this message will appear to the student
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1 text-xs text-stone-600">
                <div>
                  <span className="font-semibold text-stone-800">From: </span>
                  Renuka Art Studio &lt;hello@renukaartstudio.com&gt;
                </div>
                <div>
                  <span className="font-semibold text-stone-800">To: </span>
                  Student Recipient &lt;student@renukaartstudio.com&gt;
                </div>
                <div>
                  <span className="font-semibold text-stone-800">Subject: </span>
                  <span className="font-medium text-stone-900">{previewSubject}</span>
                </div>
              </div>

              <div className="rounded-xl p-5 border border-stone-200 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-white text-stone-800">
                {previewBody}
              </div>
            </div>

            <div className="flex justify-end px-6 py-3.5 bg-stone-50 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Detail Modal */}
      {viewingBroadcastDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-lg">
                  {viewingBroadcastDetail.title}
                </h3>
                <p className="text-xs text-stone-500 capitalize">
                  Status: {viewingBroadcastDetail.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingBroadcastDetail(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-center">
                <div>
                  <span className="text-xs text-stone-400 block uppercase font-bold">
                    Total
                  </span>
                  <span className="text-lg font-bold text-stone-900">
                    {viewingBroadcastDetail.totalRecipients}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 block uppercase font-bold">
                    Sent
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    {viewingBroadcastDetail.successfulSends}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 block uppercase font-bold">
                    Failed
                  </span>
                  <span className="text-lg font-bold text-rose-600">
                    {viewingBroadcastDetail.failedSends}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-400 uppercase block mb-1">
                  Subject
                </span>
                <p className="text-stone-900 font-medium">
                  {viewingBroadcastDetail.targetFilter?.subject || "N/A"}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-400 uppercase block mb-1">
                  Message Content
                </span>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {viewingBroadcastDetail.content.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n")}
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-3.5 bg-stone-50 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setViewingBroadcastDetail(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
