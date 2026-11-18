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
  Sparkles,
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

interface BatchStudent {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  bookingReference: string;
  createdAt: string;
}

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

  // Batch Students Segmentation state
  const [batchStudents, setBatchStudents] = useState<BatchStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

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

  // Meta Approved Templates for WhatsApp
  const [approvedTemplates, setApprovedTemplates] = useState<any[]>([]);
  const [broadcastPurpose, setBroadcastPurpose] = useState<"batch_reminder" | "upcoming_batches">("batch_reminder");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [useMetaTemplate, setUseMetaTemplate] = useState<boolean>(true);
  const [templateVariablesMap, setTemplateVariablesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/whatsapp/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setWhatsappStatus(data.data);
        }
      })
      .catch(() => {});

    fetch("/api/admin/message-templates/approved")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setApprovedTemplates(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Filter approved templates by selected broadcast purpose (exclude confirmation templates)
  const purposeFilteredTemplates = useMemo(() => {
    return approvedTemplates.filter((t) => {
      const p = t.templatePurpose || t.template_purpose || "batch_reminder";
      if (p === "confirmation") return false;
      return p === broadcastPurpose;
    });
  }, [approvedTemplates, broadcastPurpose]);

  useEffect(() => {
    if (purposeFilteredTemplates.length > 0) {
      if (!purposeFilteredTemplates.some((t) => t.id === selectedTemplateId)) {
        setSelectedTemplateId(purposeFilteredTemplates[0].id);
      }
    } else {
      setSelectedTemplateId("");
    }
  }, [purposeFilteredTemplates, selectedTemplateId]);

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

  const activeApprovedTemplate = useMemo(() => {
    return purposeFilteredTemplates.find((t) => t.id === selectedTemplateId) || purposeFilteredTemplates[0] || null;
  }, [purposeFilteredTemplates, selectedTemplateId]);

  // Synchronize template variable mapping when approved template, course, or batch changes
  useEffect(() => {
    if (!activeApprovedTemplate) return;
    const initialMap: Record<string, string> = {};
    if (activeApprovedTemplate.variableDefinitions && activeApprovedTemplate.variableDefinitions.length > 0) {
      for (const v of activeApprovedTemplate.variableDefinitions) {
        if (v.sourceField === "student_name") initialMap[v.placeholder] = "[Student Name]";
        else if (v.sourceField === "course_name") initialMap[v.placeholder] = selectedCourse?.title || "[Course Name]";
        else if (v.sourceField === "batch_name") initialMap[v.placeholder] = selectedBatch?.batch_name || "[Batch Name]";
        else if (v.sourceField === "batch_date") initialMap[v.placeholder] = "[Date]";
        else if (v.sourceField === "batch_time") initialMap[v.placeholder] = "[Time]";
        else if (v.sourceField === "zoom_link") initialMap[v.placeholder] = "[Join Link]";
        else initialMap[v.placeholder] = v.sampleValue || "";
      }
    } else {
      const bodyComp = activeApprovedTemplate.components?.find((c: any) => c.type === "BODY");
      const matches = (bodyComp?.text || "").match(/\{\{(\d+)\}\}/g) || [];
      for (const m of matches) {
        const num = m.replace(/\D/g, "");
        if (num === "1") initialMap[m] = "[Student Name]";
        else if (num === "2") initialMap[m] = selectedCourse?.title || "[Course Name]";
        else if (num === "3") initialMap[m] = "[Date]";
        else if (num === "4") initialMap[m] = "[Time]";
        else if (num === "5") initialMap[m] = "[Join Link]";
        else initialMap[m] = "Sample Value";
      }
    }
    setTemplateVariablesMap(initialMap);
  }, [activeApprovedTemplate, selectedCourse, selectedBatch]);

  // Fetch students for selected batch to enable date-wise segmentation
  useEffect(() => {
    if (audience !== "batch" || !selectedBatchId) {
      setBatchStudents([]);
      setSelectedStudentIds([]);
      return;
    }

    let isCancelled = false;
    setIsLoadingStudents(true);

    fetch(`/api/admin/broadcast/batch-students?batchId=${encodeURIComponent(selectedBatchId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && Array.isArray(data.students)) {
          setBatchStudents(data.students);
          // By default, select all students in the batch
          setSelectedStudentIds(data.students.map((s: BatchStudent) => s.id));
        }
      })
      .catch((err) => {
        console.error("Failed to load batch students:", err);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingStudents(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [audience, selectedBatchId]);

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
      selectedCustomerIds:
        audience === "batch" && selectedStudentIds.length > 0
          ? selectedStudentIds
          : null,
      templateId: channel === "whatsapp" && useMetaTemplate ? selectedTemplateId : undefined,
      templateName: channel === "whatsapp" && useMetaTemplate ? (activeApprovedTemplate?.metaTemplateName || activeApprovedTemplate?.meta_template_name) : undefined,
      templateLanguage: channel === "whatsapp" && useMetaTemplate ? (activeApprovedTemplate?.language || "en_US") : undefined,
      templateVariables: channel === "whatsapp" && useMetaTemplate ? templateVariablesMap : undefined,
    };
  }, [
    audience,
    selectedCourseId,
    selectedBatchId,
    selectedCourse,
    selectedBatch,
    subject,
    selectedStudentIds,
    channel,
    useMetaTemplate,
    selectedTemplateId,
    activeApprovedTemplate,
    templateVariablesMap,
  ]);

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
      .replace(/\[Student Name\]|\{\{student_name\}\}/gi, "Renuka (Student Name)")
      .replace(/\[Course Name\]|\{\{course_name\}\}/gi, selectedCourse?.title || "The WATERCOLOUR Roadmap: One-Day Masterclass")
      .replace(/\[Batch Name\]|\{\{batch_name\}\}/gi, selectedBatch?.batch_name || "Live Masterclass — 28 Oct 2026")
      .replace(/\[Date\]|\{\{date\}\}/gi, targetFilter.date || "28 October 2026")
      .replace(/\[Time\]|\{\{time\}\}/gi, targetFilter.time || "6:30 PM – 8:30 PM")
      .replace(/\[Join Link\]|\[Zoom Link\]|\{\{zoom_link\}\}/gi, targetFilter.joinLink || "https://zoom.us/j/1234567890");
  }, [subject, selectedCourse, selectedBatch, targetFilter]);

  const previewBody = useMemo(() => {
    if (channel === "whatsapp" && useMetaTemplate && activeApprovedTemplate) {
      const headerComp = activeApprovedTemplate.components?.find((c: any) => c.type === "HEADER");
      const bodyComp = activeApprovedTemplate.components?.find((c: any) => c.type === "BODY");
      const footerComp = activeApprovedTemplate.components?.find((c: any) => c.type === "FOOTER");
      const buttonsComp = activeApprovedTemplate.components?.find((c: any) => c.type === "BUTTONS");

      let renderedBody = bodyComp?.text || "";
      Object.entries(templateVariablesMap).forEach(([placeholder, mapping]) => {
        const resolved = mapping
          .replace(/\[Student Name\]/gi, "Renuka (Student Name)")
          .replace(/\[Course Name\]/gi, selectedCourse?.title || "The WATERCOLOUR Roadmap")
          .replace(/\[Batch Name\]/gi, selectedBatch?.batch_name || "Live Masterclass")
          .replace(/\[Date\]/gi, targetFilter.date || "28 October 2026")
          .replace(/\[Time\]/gi, targetFilter.time || "6:30 PM – 8:30 PM")
          .replace(/\[Join Link\]/gi, targetFilter.joinLink || "https://zoom.us/j/1234567890");
        renderedBody = renderedBody.split(placeholder).join(resolved);
      });

      let fullPreview = "";
      if (headerComp?.text) fullPreview += `*${headerComp.text}*\n\n`;
      fullPreview += renderedBody;
      if (footerComp?.text) fullPreview += `\n\n_${footerComp.text}_`;
      if (buttonsComp?.buttons?.length) {
        fullPreview += `\n\n[Buttons: ${buttonsComp.buttons.map((b: any) => b.text).join(" | ")}]`;
      }
      return fullPreview;
    }

    return messageBody
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\[Student Name\]|\{\{student_name\}\}/gi, "Renuka (Student Name)")
      .replace(/\[Course Name\]|\{\{course_name\}\}/gi, selectedCourse?.title || "The WATERCOLOUR Roadmap: One-Day Masterclass")
      .replace(/\[Batch Name\]|\{\{batch_name\}\}/gi, selectedBatch?.batch_name || "Live Masterclass — 28 Oct 2026")
      .replace(/\[Date\]|\{\{date\}\}/gi, targetFilter.date || "28 October 2026")
      .replace(/\[Time\]|\{\{time\}\}/gi, targetFilter.time || "6:30 PM – 8:30 PM")
      .replace(/\[Join Link\]|\[Zoom Link\]|\{\{zoom_link\}\}/gi, targetFilter.joinLink || "https://zoom.us/j/1234567890");
  }, [
    channel,
    useMetaTemplate,
    activeApprovedTemplate,
    templateVariablesMap,
    messageBody,
    selectedCourse,
    selectedBatch,
    targetFilter,
  ]);

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
                Please configure WhatsApp settings before sending broadcasts.
              </p>
            </div>
          </div>
        )}

        {/* WhatsApp Template Controls */}
        {channel === "whatsapp" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 block">
                  Meta WhatsApp Template Delivery
                </span>
                <span className="text-[11px] text-emerald-700">
                  Deliver via pre-approved Meta WhatsApp Cloud API templates
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseMetaTemplate(true)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    useMetaTemplate
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  Approved Template
                </button>
                <button
                  type="button"
                  onClick={() => setUseMetaTemplate(false)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    !useMetaTemplate
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  Custom Text
                </button>
              </div>
            </div>

            {useMetaTemplate && (
              <div className="space-y-3 pt-2 border-t border-emerald-200/70">
                {approvedTemplates.length === 0 ? (
                  <div className="bg-white rounded-lg p-3 text-xs border border-emerald-200 flex items-center justify-between">
                    <span className="text-stone-700">
                      No approved Meta templates found in the system.
                    </span>
                    <a
                      href="/admin/message-templates"
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      Manage Templates &rarr;
                    </a>
                  </div>
                ) : (
                  <>
                    {/* Template Purpose Selector */}
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1.5">
                        Template Purpose
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBroadcastPurpose("batch_reminder")}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                            broadcastPurpose === "batch_reminder"
                              ? "bg-amber-100/80 border-amber-500 text-amber-950 shadow-xs"
                              : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-amber-700" />
                            <span>Batch Reminder</span>
                          </div>
                          <p className="text-[0.66rem] font-normal text-stone-500 mt-0.5">
                            Reminders to students of a specific batch date
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBroadcastPurpose("upcoming_batches")}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                            broadcastPurpose === "upcoming_batches"
                              ? "bg-purple-100/80 border-purple-500 text-purple-950 shadow-xs"
                              : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="size-3.5 text-purple-700" />
                            <span>Upcoming Batches</span>
                          </div>
                          <p className="text-[0.66rem] font-normal text-stone-500 mt-0.5">
                            Announcements & new cohort schedule launches
                          </p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-stone-700">
                          Select Approved {broadcastPurpose === "upcoming_batches" ? "Upcoming Batches" : "Batch Reminder"} Template
                        </label>
                        <a
                          href="/admin/message-templates"
                          className="text-[11px] text-emerald-700 hover:underline"
                        >
                          + Create / Sync Templates
                        </a>
                      </div>

                      {purposeFilteredTemplates.length === 0 ? (
                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
                          No approved {broadcastPurpose === "upcoming_batches" ? "Upcoming Batches" : "Batch Reminder"} templates found.
                          <a href="/admin/message-templates" className="ml-1 text-emerald-700 font-semibold hover:underline">
                            Create or sync one &rarr;
                          </a>
                        </div>
                      ) : (
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                        >
                          {purposeFilteredTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.internalTitle || t.internal_title || t.metaTemplateName || t.meta_template_name} ({t.metaTemplateName || t.meta_template_name})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {activeApprovedTemplate && (
                      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-emerald-100 text-xs">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              APPROVED BY META
                            </span>
                            <span className="font-mono text-stone-600 text-[11px]">
                              {activeApprovedTemplate.metaTemplateName || activeApprovedTemplate.meta_template_name}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            Category: {activeApprovedTemplate.category}
                          </span>
                        </div>

                        {/* Dynamic Variables Mapping UI */}
                        {Object.keys(templateVariablesMap).length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="font-bold text-stone-700 block">
                              Dynamic Variables Mapping
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(templateVariablesMap).map(([placeholder, val]) => (
                                <div
                                  key={placeholder}
                                  className="p-2 rounded-lg bg-stone-50 border border-stone-200 space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-emerald-800 text-[11px]">
                                      {placeholder}
                                    </span>
                                    <span className="text-[10px] text-stone-400">
                                      Variable placeholder
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) =>
                                      setTemplateVariablesMap((prev) => ({
                                        ...prev,
                                        [placeholder]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 1. MESSAGE SELECTOR (For Email or Plain WhatsApp) */}
        {(!useMetaTemplate || channel === "email") && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Message Preset
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
        )}

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

        {/* 4b. DATE-WISE STUDENT SEGMENTATION & SELECTION */}
        {audience === "batch" && (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div>
                <span className="text-xs font-bold text-stone-800 block">
                  Registered Students in Selected Batch Date
                </span>
                <span className="text-[0.7rem] text-stone-500">
                  {isLoadingStudents
                    ? "Loading students..."
                    : `${selectedStudentIds.length} of ${batchStudents.length} students selected`}
                </span>
              </div>

              {batchStudents.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStudentIds.length === batchStudents.length) {
                      setSelectedStudentIds([]);
                    } else {
                      setSelectedStudentIds(batchStudents.map((s) => s.id));
                    }
                  }}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
                >
                  {selectedStudentIds.length === batchStudents.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {isLoadingStudents ? (
              <p className="text-xs text-stone-500 italic py-2">Fetching confirmed students for this batch...</p>
            ) : batchStudents.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">
                No confirmed registered students found for this batch date.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-100">
                {batchStudents.map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <label
                      key={student.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-100/80 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds((prev) => [...prev, student.id]);
                            } else {
                              setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
                            }
                          }}
                          className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 size-4"
                        />
                        <div>
                          <span className="font-semibold text-stone-800 block">
                            {student.fullName}
                          </span>
                          <span className="text-[0.68rem] text-stone-500 block">
                            {student.email} {student.phone ? `• ${student.phone}` : ""}
                          </span>
                        </div>
                      </div>
                      <span className="text-[0.65rem] font-mono text-stone-400">
                        {student.bookingReference}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
              Message Preview
            </label>
            <span className="text-[11px] text-stone-400">
              Sample preview — personalized for each student when sent
            </span>
          </div>
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
                <span className="font-medium text-stone-900 text-right">
                  {channel === "whatsapp" && useMetaTemplate && activeApprovedTemplate
                    ? `${activeApprovedTemplate.internalTitle || activeApprovedTemplate.internal_title || activeApprovedTemplate.metaTemplateName || activeApprovedTemplate.meta_template_name} (Meta Approved)`
                    : messageName}
                </span>
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
