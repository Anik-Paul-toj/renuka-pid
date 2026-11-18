"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  WhatsAppTemplateRecord,
} from "@/lib/whatsapp/template-management";
import {
  TemplateCategory,
  TemplatePurpose,
  TemplateComponent,
  VariableDefinition,
} from "@/lib/validations/whatsapp-template";
import {
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  PauseCircle,
  Eye,
  Trash2,
  Send,
  Copy,
  ExternalLink,
  Smartphone,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  CheckCheck,
} from "lucide-react";

interface TemplateManagerProps {
  initialTemplates: WhatsAppTemplateRecord[];
  courses?: Array<{ id: string; title: string; slug: string }>;
  userRole?: string;
}

const DEFAULT_LANGUAGES = [
  { code: "en_US", label: "English (US)" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
];

export function TemplateManager({
  initialTemplates,
  courses = [],
  userRole = "admin",
}: TemplateManagerProps) {
  const isReadOnly = userRole === "editor";

  const [templates, setTemplates] = useState<WhatsAppTemplateRecord[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Loading & Feedback
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<WhatsAppTemplateRecord | null>(null);

  // Form State for Create Template
  const [formTitle, setFormTitle] = useState("");
  const [formMetaName, setFormMetaName] = useState("");
  const [formPurpose, setFormPurpose] = useState<TemplatePurpose>("batch_reminder");
  const [formCategory, setFormCategory] = useState<TemplateCategory>("UTILITY");
  const [formAssignedCourseId, setFormAssignedCourseId] = useState<string>("");
  const [formIsDefaultConfirmation, setFormIsDefaultConfirmation] = useState<boolean>(false);
  const [formLanguage, setFormLanguage] = useState("en_US");

  // Header State
  const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT">("NONE");
  const [headerText, setHeaderText] = useState("");

  // Body State
  const [bodyText, setBodyText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Footer State
  const [footerText, setFooterText] = useState("");

  // Buttons State
  const [hasButton, setHasButton] = useState(false);
  const [buttonType, setButtonType] = useState<"QUICK_REPLY" | "URL">("URL");
  const [buttonText, setButtonText] = useState("Visit Studio");
  const [buttonUrl, setButtonUrl] = useState("https://renuka-art-studio.vercel.app/course");

  // Variables Definitions State
  const [variables, setVariables] = useState<VariableDefinition[]>([]);

  // Automatically parse variables {{1}}, {{2}} from body and header
  const detectedPlaceholders = useMemo(() => {
    const combined = `${headerText} ${bodyText}`;
    const matches = combined.match(/\{\{(\d+)\}\}/g) || [];
    return Array.from(new Set(matches)).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.replace(/\D/g, "")) || 0;
      return numA - numB;
    });
  }, [headerText, bodyText]);

  // Synchronize variables list with detected placeholders
  React.useEffect(() => {
    setVariables((prev) => {
      return detectedPlaceholders.map((ph) => {
        const existing = prev.find((v) => v.placeholder === ph);
        if (existing) return existing;

        // Smart defaults based on variable index
        let defaultName = `Variable ${ph.replace(/\D/g, "")}`;
        let defaultSample = "Sample Value";
        let defaultSource: any = "custom";

        const num = ph.replace(/\D/g, "");
        if (num === "1") {
          defaultName = "Student Name";
          defaultSample = "Maya Sharma";
          defaultSource = "student_name";
        } else if (num === "2") {
          defaultName = "Course Name";
          defaultSample = "Watercolour Foundation";
          defaultSource = "course_name";
        } else if (num === "3") {
          defaultName = "Batch Date";
          defaultSample = "28 November 2026";
          defaultSource = "batch_date";
        } else if (num === "4") {
          defaultName = "Batch Time";
          defaultSample = "6:30 PM IST";
          defaultSource = "batch_time";
        } else if (num === "5") {
          defaultName = "Join Link";
          defaultSample = "https://zoom.us/j/1234567890";
          defaultSource = "zoom_link";
        }

        return {
          placeholder: ph,
          name: defaultName,
          sampleValue: defaultSample,
          sourceField: defaultSource,
        };
      });
    });
  }, [detectedPlaceholders]);

  // Handle Tag Insertion into Body Textarea
  const handleInsertTag = (tag: string) => {
    if (!textareaRef.current) {
      setBodyText((prev) => (prev ? prev + " " + tag : tag));
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = bodyText.substring(0, start) + tag + bodyText.substring(end);
    setBodyText(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Preview Body Resolution
  const resolvedPreviewBody = useMemo(() => {
    let result = bodyText;
    for (const v of variables) {
      result = result.replace(new RegExp(v.placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"), v.sampleValue || v.placeholder);
    }
    return result || "Start typing your WhatsApp message in the editor on the left...";
  }, [bodyText, variables]);

  const resolvedPreviewHeader = useMemo(() => {
    if (headerType !== "TEXT" || !headerText) return null;
    let result = headerText;
    for (const v of variables) {
      result = result.replace(new RegExp(v.placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"), v.sampleValue || v.placeholder);
    }
    return result;
  }, [headerType, headerText, variables]);

  // Purpose counts for filter tabs
  const purposeCounts = useMemo(() => {
    return {
      all: templates.length,
      confirmation: templates.filter((t) => (t.templatePurpose || (t as any).template_purpose) === "confirmation").length,
      upcoming_batches: templates.filter((t) => (t.templatePurpose || (t as any).template_purpose) === "upcoming_batches").length,
      batch_reminder: templates.filter((t) => (t.templatePurpose || (t as any).template_purpose) === "batch_reminder").length,
    };
  }, [templates]);

  // Filter templates list
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const tPurpose = t.templatePurpose || (t as any).template_purpose || "batch_reminder";
      const matchesPurpose = purposeFilter === "all" || tPurpose === purposeFilter;

      const matchesSearch =
        searchQuery === "" ||
        t.internalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.metaTemplateName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || t.metaStatus === statusFilter;
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

      return matchesPurpose && matchesSearch && matchesStatus && matchesCategory;
    });
  }, [templates, purposeFilter, searchQuery, statusFilter, categoryFilter]);

  // Sync templates from Meta
  const handleSyncFromMeta = async () => {
    setIsSyncing(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch("/api/admin/message-templates/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to sync templates from Meta.");
      }

      // Re-fetch local list
      const listRes = await fetch("/api/admin/message-templates");
      const listData = await listRes.json();
      if (listData.success) {
        setTemplates(listData.data);
      }

      setActionSuccess(
        `Meta templates synchronized successfully! Updated ${data.data.syncedCount} and imported ${data.data.importedCount} templates.`
      );
    } catch (err: any) {
      setActionError(err.message || "Failed to sync templates.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit Template for Approval
  const handleSubmitTemplate = async (isDraftOnly: boolean = false) => {
    if (isReadOnly) return;
    setActionError(null);
    setActionSuccess(null);

    // Validation
    if (!formTitle.trim()) {
      setActionError("Please provide an internal template title.");
      return;
    }
    if (!formMetaName.trim()) {
      setActionError("Please provide a Meta template name.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(formMetaName)) {
      setActionError("Meta template name must contain only lowercase letters, numbers, and underscores (e.g. 'class_reminder_nov').");
      return;
    }
    if (!bodyText.trim()) {
      setActionError("Please enter message body content.");
      return;
    }

    // Build components
    const components: TemplateComponent[] = [];

    if (headerType === "TEXT" && headerText.trim()) {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: headerText.trim(),
      });
    } else if (headerType !== "NONE" && headerType !== "TEXT") {
      components.push({
        type: "HEADER",
        format: headerType,
      });
    }

    components.push({
      type: "BODY",
      text: bodyText.trim(),
    });

    if (footerText.trim()) {
      components.push({
        type: "FOOTER",
        text: footerText.trim(),
      });
    }

    if (hasButton && buttonText.trim()) {
      components.push({
        type: "BUTTONS",
        buttons: [
          buttonType === "URL"
            ? {
                type: "URL",
                text: buttonText.trim(),
                url: buttonUrl.trim(),
              }
            : {
                type: "QUICK_REPLY",
                text: buttonText.trim(),
              },
        ],
      });
    }

    setIsSubmitting(true);

    try {
      // 1. Save draft
      const saveRes = await fetch("/api/admin/message-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalTitle: formTitle.trim(),
          metaTemplateName: formMetaName.trim(),
          templatePurpose: formPurpose,
          assignedCourseId: formPurpose === "confirmation" && formAssignedCourseId ? formAssignedCourseId : null,
          isDefaultConfirmation: formPurpose === "confirmation" ? formIsDefaultConfirmation : false,
          category: formCategory,
          language: formLanguage,
          components,
          variableDefinitions: variables,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || "Failed to create template draft.");
      }

      const createdTemplate = saveData.data;

      // 2. If submitting to Meta
      if (!isDraftOnly) {
        const submitRes = await fetch(
          `/api/admin/message-templates/${createdTemplate.id}/submit`,
          { method: "POST" }
        );
        const submitData = await submitRes.json();

        if (!submitRes.ok || !submitData.success) {
          throw new Error(submitData.error || "Meta submission failed. Draft preserved.");
        }

        setActionSuccess(
          `Template '${formMetaName}' submitted to Meta for approval! Status is currently ${submitData.data.status}.`
        );
      } else {
        setActionSuccess(`Template draft '${formTitle}' saved successfully.`);
      }

      // Refresh list
      const listRes = await fetch("/api/admin/message-templates");
      const listData = await listRes.json();
      if (listData.success) {
        setTemplates(listData.data);
      }

      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      setActionError(err.message || "Failed to process template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit existing draft to Meta
  const handleSubmitExistingDraft = async (tpl: WhatsAppTemplateRecord) => {
    if (isReadOnly) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const submitRes = await fetch(`/api/admin/message-templates/${tpl.id}/submit`, {
        method: "POST",
      });
      const submitData = await submitRes.json();

      if (!submitRes.ok || !submitData.success) {
        throw new Error(submitData.error || "Failed to submit to Meta.");
      }

      setActionSuccess(
        `Template '${tpl.metaTemplateName}' submitted to Meta! Status: ${submitData.data.status}.`
      );

      // Refresh list
      const listRes = await fetch("/api/admin/message-templates");
      const listData = await listRes.json();
      if (listData.success) {
        setTemplates(listData.data);
      }
    } catch (err: any) {
      setActionError(err.message || "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete local draft
  const handleDeleteDraft = async (id: string) => {
    if (isReadOnly) return;
    if (!confirm("Are you sure you want to delete this template draft?")) return;

    try {
      const res = await fetch(`/api/admin/message-templates/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete template.");
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setActionSuccess("Template deleted successfully.");
    } catch (err: any) {
      setActionError(err.message || "Failed to delete.");
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormMetaName("");
    setFormPurpose("batch_reminder");
    setFormAssignedCourseId("");
    setFormIsDefaultConfirmation(false);
    setFormCategory("UTILITY");
    setFormLanguage("en_US");
    setHeaderType("NONE");
    setHeaderText("");
    setBodyText("");
    setFooterText("");
    setHasButton(false);
    setButtonType("URL");
    setButtonText("Visit Studio");
    setButtonUrl("https://renuka-art-studio.vercel.app/course");
    setVariables([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="size-3" />
            Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="size-3" />
            Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="size-3" />
            Rejected
          </span>
        );
      case "PAUSED":
      case "DISABLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-stone-200 text-stone-700 border border-stone-300">
            <PauseCircle className="size-3" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
            Draft
          </span>
        );
    }
  };

  const getPurposeBadge = (purpose: string) => {
    switch (purpose) {
      case "confirmation":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCheck className="size-3" />
            Confirmation
          </span>
        );
      case "upcoming_batches":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
            <Sparkles className="size-3" />
            Upcoming Batches
          </span>
        );
      case "batch_reminder":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="size-3" />
            Batch Reminder
          </span>
        );
    }
  };

  const handleAssignTemplate = async (
    templateId: string,
    options: { courseId?: string | null; isDefault?: boolean }
  ) => {
    if (isReadOnly) return;
    setIsAssigning(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/message-templates/${templateId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update assignment.");
      }

      setActionSuccess("Template assignment updated successfully!");

      // Refresh list
      const listRes = await fetch("/api/admin/message-templates");
      const listData = await listRes.json();
      if (listData.success) {
        setTemplates(listData.data);
      }
      if (viewingTemplate && viewingTemplate.id === templateId) {
        setViewingTemplate(data.data);
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to assign template.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-6 text-[#68705A]" />
            <h1 className="text-2xl font-serif font-bold text-[#14120E] tracking-tight">
              WhatsApp Message Templates
            </h1>
          </div>
          <p className="text-xs text-[#6F6B61] mt-1">
            Create, manage, and submit official WhatsApp Cloud API templates to Meta for approval. Approved templates can be used in Broadcast campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncFromMeta}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#464137]/20 bg-white text-xs font-semibold text-[#464137] hover:bg-[#F7F4EC] transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync from Meta"}</span>
          </button>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="btn-studio px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Create New Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900 font-medium animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900 font-medium animate-in fade-in">
          <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Purpose Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#464137]/15 pb-2">
        {[
          { key: "all", label: "All Templates", count: purposeCounts.all },
          { key: "confirmation", label: "Confirmation", count: purposeCounts.confirmation },
          { key: "upcoming_batches", label: "Upcoming Batches", count: purposeCounts.upcoming_batches },
          { key: "batch_reminder", label: "Batch Reminder", count: purposeCounts.batch_reminder },
        ].map((tab) => {
          const isActive = purposeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPurposeFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-[#444C38] text-white shadow-xs"
                  : "bg-white text-[#464137] hover:bg-[#F4F1EA] border border-[#464137]/20"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[0.62rem] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-white/25 text-white" : "bg-[#FAF8F2] text-[#6F6B61]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="size-3.5 text-[#6F6B61] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates by title or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-[#464137]/20 text-xs text-[#14120E] outline-none focus:border-[#68705A]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#464137]/20 text-xs text-[#14120E] font-medium outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#464137]/20 text-xs text-[#14120E] font-medium outline-none"
          >
            <option value="all">All Categories</option>
            <option value="UTILITY">Utility</option>
            <option value="MARKETING">Marketing</option>
            <option value="AUTHENTICATION">Authentication</option>
          </select>
        </div>
      </div>

      {/* Templates Table */}
      <div className="rounded-xl bg-[#FAF8F2] border border-[#464137]/15 shadow-xs overflow-hidden">
        {filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6F6B61]">
            <MessageSquareText className="size-8 mx-auto text-[#6F6B61]/40 mb-2" />
            <p className="font-semibold text-sm text-[#14120E]">No message templates found.</p>
            <p className="mt-1">
              Click &ldquo;Create New Template&rdquo; to author your first WhatsApp template, or &ldquo;Sync from Meta&rdquo; to fetch existing WABA templates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#464137]/15 bg-[#F4F1EA] text-[0.68rem] uppercase tracking-wider font-bold text-[#444C38]">
                  <th className="py-3 px-4">Template Title & Meta Name</th>
                  <th className="py-3 px-4">Purpose (Internal)</th>
                  <th className="py-3 px-4">Category (Meta)</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Meta Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#464137]/10">
                {filteredTemplates.map((tpl) => {
                  const bodyComp = tpl.components.find((c) => c.type === "BODY") as any;
                  const assignedCourse = courses.find((c) => c.id === tpl.assignedCourseId);
                  return (
                    <tr key={tpl.id} className="hover:bg-white/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#14120E]">{tpl.internalTitle}</div>
                        <div className="font-mono text-[0.66rem] text-[#6F6B61] mt-0.5">
                          {tpl.metaTemplateName}
                        </div>
                        {bodyComp?.text && (
                          <div className="text-[0.68rem] text-[#6F6B61] line-clamp-1 mt-1 max-w-sm">
                            {bodyComp.text}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {getPurposeBadge(tpl.templatePurpose || (tpl as any).template_purpose)}
                        {tpl.isDefaultConfirmation && (
                          <div className="mt-1">
                            <span className="text-[0.62rem] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Studio Default
                            </span>
                          </div>
                        )}
                        {tpl.assignedCourseId && (
                          <div className="mt-1">
                            <span className="text-[0.62rem] font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 line-clamp-1">
                              Assigned: {assignedCourse?.title || "Specific Course"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#444C38]">
                        <span className="bg-[#EBE7DC] px-2 py-0.5 rounded text-[0.65rem] uppercase">
                          {tpl.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#14120E] font-medium uppercase font-mono text-[0.68rem]">
                        {tpl.language}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(tpl.metaStatus)}
                        {tpl.metaRejectionReason && (
                          <span
                            title={tpl.metaRejectionReason}
                            className="block text-[0.62rem] text-rose-600 line-clamp-1 mt-0.5 cursor-help"
                          >
                            Reason: {tpl.metaRejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[0.68rem] text-[#6F6B61]">
                        {tpl.updatedAt ? new Date(tpl.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingTemplate(tpl)}
                            className="p-1.5 rounded-md hover:bg-[#EBE7DC] text-[#444C38] transition-colors"
                            title="View Template Details & Live Preview"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {tpl.metaStatus === "DRAFT" && !isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleSubmitExistingDraft(tpl)}
                              disabled={isSubmitting}
                              className="px-2 py-1 rounded bg-emerald-700 text-white font-bold text-[0.65rem] hover:bg-emerald-800 transition-colors inline-flex items-center gap-1"
                              title="Submit for Meta Approval"
                            >
                              <Send className="size-2.5" />
                              <span>Submit</span>
                            </button>
                          )}

                          {tpl.metaStatus === "DRAFT" && !isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(tpl.id)}
                              className="p-1.5 rounded-md hover:bg-rose-100 text-rose-700 transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE NEW TEMPLATE MODAL / DRAWER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#FAF8F2] w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#464137]/20 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 size-8 grid place-items-center rounded-full bg-[#EBE7DC] text-[#444C38] hover:bg-[#DFD8C8] transition-colors"
            >
              ✕
            </button>

            <div className="border-b border-[#464137]/15 pb-4 mb-5">
              <h2 className="text-xl font-serif font-bold text-[#14120E]">
                Create WhatsApp Message Template
              </h2>
              <p className="text-xs text-[#6F6B61] mt-0.5">
                Design a template according to Meta Cloud API guidelines. Once submitted, Meta evaluates the template for approval.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Controls Column */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Internal Template Purpose (Workflow Classification) */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#292923]">
                      Template Purpose * <span className="font-normal text-stone-500">(Studio Workflow)</span>
                    </label>
                    <span className="text-[0.62rem] uppercase font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                      Required
                    </span>
                  </div>

                  <select
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value as TemplatePurpose)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#464137]/20 text-xs text-[#14120E] font-bold outline-none focus:border-[#68705A]"
                  >
                    <option value="confirmation">Confirmation — Automatically sent upon confirmed registration</option>
                    <option value="upcoming_batches">Upcoming Batches — Schedule announcements & launches in Broadcast</option>
                    <option value="batch_reminder">Batch Reminder — Live session reminders to confirmed batch students in Broadcast</option>
                  </select>

                  <div className="text-[0.7rem] text-stone-600 bg-white/80 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                    {formPurpose === "confirmation" && (
                      <p>
                        <strong className="text-blue-900">Confirmation Template:</strong> Automatically sent when a student&apos;s registration is successfully confirmed (paid registrations after verified Razorpay payment, or free registrations upon confirmation). Supports student name, course title, and booking reference ID.
                      </p>
                    )}
                    {formPurpose === "upcoming_batches" && (
                      <p>
                        <strong className="text-purple-900">Upcoming Batches Template:</strong> Used in the Broadcast tab to notify students about upcoming cohorts, newly scheduled masterclass dates, and registration announcements.
                      </p>
                    )}
                    {formPurpose === "batch_reminder" && (
                      <p>
                        <strong className="text-amber-900">Batch Reminder Template:</strong> Used in the Broadcast tab to send timely reminders (e.g. class tomorrow, class starting today, schedule update) strictly to students registered for a specific batch date.
                      </p>
                    )}
                  </div>

                  {/* Course assignment options if purpose is Confirmation */}
                  {formPurpose === "confirmation" && (
                    <div className="pt-2 border-t border-amber-200/70 space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                        <input
                          type="checkbox"
                          checked={formIsDefaultConfirmation}
                          onChange={(e) => setFormIsDefaultConfirmation(e.target.checked)}
                          className="size-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>
                          Assign as Studio-Wide Default Confirmation Template
                          <span className="block text-[0.66rem] font-normal text-stone-500">
                            Acts as the primary confirmation message for all courses without a course-specific template override.
                          </span>
                        </span>
                      </label>

                      {courses.length > 0 && (
                        <div className="pt-1">
                          <label className="block text-[0.7rem] font-bold text-stone-700 mb-1">
                            Or Assign to Specific Course (Optional Override)
                          </label>
                          <select
                            value={formAssignedCourseId}
                            onChange={(e) => setFormAssignedCourseId(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#464137]/20 text-xs text-[#14120E] outline-none"
                          >
                            <option value="">No specific course (Uses studio default)</option>
                            {courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Title & Meta Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Internal Template Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Masterclass Reminder 24H"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#464137]/20 text-xs text-[#14120E] outline-none focus:border-[#68705A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Meta Template Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. masterclass_reminder_24h"
                      value={formMetaName}
                      onChange={(e) => setFormMetaName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#464137]/20 text-xs font-mono text-[#14120E] outline-none focus:border-[#68705A]"
                    />
                    <span className="text-[0.62rem] text-[#6F6B61] block mt-0.5">
                      Lowercase, numbers, and underscores only.
                    </span>
                  </div>
                </div>

                {/* 3. Category (Meta Official) & Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#292923]">
                        Meta Category *
                      </label>
                      <span className="text-[0.6rem] text-stone-500 font-mono">Meta Cloud API</span>
                    </div>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as TemplateCategory)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#464137]/20 text-xs text-[#14120E] font-medium outline-none"
                    >
                      <option value="UTILITY">UTILITY (Booking, Reminders, Updates)</option>
                      <option value="MARKETING">MARKETING (Promotions, Announcements)</option>
                      <option value="AUTHENTICATION">AUTHENTICATION (OTPs, Security)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#292923] mb-1">
                      Language *
                    </label>
                    <select
                      value={formLanguage}
                      onChange={(e) => setFormLanguage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#464137]/20 text-xs text-[#14120E] font-medium outline-none"
                    >
                      {DEFAULT_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label} ({lang.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Header Component */}
                <div className="p-3.5 rounded-xl bg-white border border-[#464137]/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#292923]">Header (Optional)</label>
                    <select
                      value={headerType}
                      onChange={(e) => setHeaderType(e.target.value as any)}
                      className="text-[0.68rem] px-2 py-0.5 rounded bg-[#F7F4EC] border border-[#464137]/20 text-[#14120E] font-medium"
                    >
                      <option value="NONE">None</option>
                      <option value="TEXT">Text Header</option>
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                      <option value="DOCUMENT">Document</option>
                    </select>
                  </div>

                  {headerType === "TEXT" && (
                    <input
                      type="text"
                      placeholder="Header text (e.g. Masterclass Alert)..."
                      value={headerText}
                      maxLength={60}
                      onChange={(e) => setHeaderText(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F2] border border-[#464137]/20 text-xs text-[#14120E] outline-none"
                    />
                  )}
                </div>

                {/* 4. Body Content */}
                <div className="p-3.5 rounded-xl bg-white border border-[#464137]/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#292923]">Body Text *</label>
                    <span className="text-[0.62rem] text-[#6F6B61]">{bodyText.length}/1024 chars</span>
                  </div>

                  {/* Placeholder Injection Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[0.62rem] uppercase font-bold text-[#68705A] mr-1">Insert Variable:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertTag("{{1}}")}
                      className="px-2 py-0.5 rounded bg-[#EBE7DC] hover:bg-[#DFD8C8] text-[0.65rem] font-mono font-bold text-[#444C38] transition-colors"
                    >
                      {"{{1}} Student"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag("{{2}}")}
                      className="px-2 py-0.5 rounded bg-[#EBE7DC] hover:bg-[#DFD8C8] text-[0.65rem] font-mono font-bold text-[#444C38] transition-colors"
                    >
                      {"{{2}} Course"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag("{{3}}")}
                      className="px-2 py-0.5 rounded bg-[#EBE7DC] hover:bg-[#DFD8C8] text-[0.65rem] font-mono font-bold text-[#444C38] transition-colors"
                    >
                      {"{{3}} Date"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag("{{4}}")}
                      className="px-2 py-0.5 rounded bg-[#EBE7DC] hover:bg-[#DFD8C8] text-[0.65rem] font-mono font-bold text-[#444C38] transition-colors"
                    >
                      {"{{4}} Time"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag("{{5}}")}
                      className="px-2 py-0.5 rounded bg-[#EBE7DC] hover:bg-[#DFD8C8] text-[0.65rem] font-mono font-bold text-[#444C38] transition-colors"
                    >
                      {"{{5}} Zoom Link"}
                    </button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={4}
                    placeholder="Hi {{1}}, this is a reminder for your upcoming {{2}} session on {{3}} at {{4}}..."
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F2] border border-[#464137]/20 text-xs text-[#14120E] outline-none font-sans"
                  />
                </div>

                {/* 5. Dynamic Variables Mapping */}
                {variables.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#464137]/15 space-y-2">
                    <label className="text-xs font-bold text-[#292923] block">
                      Define Dynamic Variables ({variables.length} detected)
                    </label>
                    <p className="text-[0.65rem] text-[#6F6B61]">
                      Meta requires sample values for each placeholder. These define how variables map to student records during broadcasts.
                    </p>

                    <div className="space-y-2 pt-1">
                      {variables.map((v, idx) => (
                        <div key={v.placeholder} className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F2] p-2 rounded-lg border border-[#464137]/10 text-xs">
                          <span className="col-span-2 font-mono font-bold text-[#444C38] text-[0.68rem] text-center">
                            {v.placeholder}
                          </span>
                          <input
                            type="text"
                            placeholder="Variable label"
                            value={v.name}
                            onChange={(e) => {
                              const next = [...variables];
                              next[idx].name = e.target.value;
                              setVariables(next);
                            }}
                            className="col-span-4 px-2 py-1 rounded bg-white border border-[#464137]/20 text-[0.68rem] text-[#14120E]"
                          />
                          <input
                            type="text"
                            placeholder="Sample value"
                            value={v.sampleValue}
                            onChange={(e) => {
                              const next = [...variables];
                              next[idx].sampleValue = e.target.value;
                              setVariables(next);
                            }}
                            className="col-span-3 px-2 py-1 rounded bg-white border border-[#464137]/20 text-[0.68rem] text-[#14120E]"
                          />
                          <select
                            value={v.sourceField}
                            onChange={(e) => {
                              const next = [...variables];
                              next[idx].sourceField = e.target.value as any;
                              setVariables(next);
                            }}
                            className="col-span-3 px-1 py-1 rounded bg-white border border-[#464137]/20 text-[0.65rem] text-[#14120E]"
                          >
                            <option value="student_name">Student Name</option>
                            <option value="course_name">Course Name</option>
                            <option value="batch_name">Batch Name</option>
                            <option value="batch_date">Batch Date</option>
                            <option value="batch_time">Batch Time</option>
                            <option value="booking_reference">Booking Ref</option>
                            <option value="zoom_link">Zoom Link</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Footer Component */}
                <div className="p-3.5 rounded-xl bg-white border border-[#464137]/15 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#292923]">Footer Text (Optional)</label>
                    <span className="text-[0.62rem] text-[#6F6B61]">{footerText.length}/60 chars</span>
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    placeholder="e.g. Renuka Art Studio • Warm regards"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F2] border border-[#464137]/20 text-xs text-[#14120E] outline-none"
                  />
                </div>

                {/* 7. Action Buttons */}
                <div className="p-3.5 rounded-xl bg-white border border-[#464137]/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#292923]">Call-To-Action Button (Optional)</label>
                    <button
                      type="button"
                      onClick={() => setHasButton(!hasButton)}
                      className={`text-[0.68rem] px-2.5 py-0.5 rounded font-bold uppercase ${
                        hasButton ? "bg-emerald-100 text-emerald-800" : "bg-[#EBE7DC] text-[#444C38]"
                      }`}
                    >
                      {hasButton ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  {hasButton && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[0.62rem] text-[#6F6B61] block mb-0.5">Button Label</span>
                        <input
                          type="text"
                          maxLength={25}
                          value={buttonText}
                          onChange={(e) => setButtonText(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-[#FAF8F2] border border-[#464137]/20 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[0.62rem] text-[#6F6B61] block mb-0.5">Button Target URL</span>
                        <input
                          type="url"
                          value={buttonUrl}
                          onChange={(e) => setButtonUrl(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-[#FAF8F2] border border-[#464137]/20 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Column (Simulated WhatsApp Interface) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.68rem] uppercase font-bold text-[#68705A] tracking-wider">
                    Live WhatsApp Preview
                  </span>
                  <span className="text-[0.62rem] font-bold text-[#3E522D] bg-[#3E522D]/10 px-2 py-0.5 rounded">
                    Student View
                  </span>
                </div>

                {/* WhatsApp Chat Frame */}
                <div className="rounded-2xl bg-[#EFEAE2] p-4 border border-[#464137]/15 shadow-inner min-h-[380px] flex flex-col justify-end">
                  {/* WhatsApp Message Bubble */}
                  <div className="bg-white rounded-lg p-3.5 shadow-sm max-w-sm space-y-2 border border-black/5 text-xs text-[#111B21] self-start relative">
                    {/* Header preview */}
                    {headerType === "TEXT" && resolvedPreviewHeader && (
                      <div className="font-bold text-xs text-[#111B21] border-b border-black/5 pb-1">
                        {resolvedPreviewHeader}
                      </div>
                    )}
                    {headerType === "IMAGE" && (
                      <div className="aspect-[16/9] w-full rounded bg-[#D9D2C7] flex items-center justify-center text-[#54656F] text-[0.68rem]">
                        🖼️ [Image Header Preview]
                      </div>
                    )}
                    {headerType === "VIDEO" && (
                      <div className="aspect-[16/9] w-full rounded bg-[#D9D2C7] flex items-center justify-center text-[#54656F] text-[0.68rem]">
                        🎥 [Video Header Preview]
                      </div>
                    )}

                    {/* Body text with resolved sample values */}
                    <div className="whitespace-pre-line leading-relaxed text-[0.74rem]">
                      {resolvedPreviewBody}
                    </div>

                    {/* Footer text */}
                    {footerText && (
                      <div className="text-[0.62rem] text-[#667781] pt-1">
                        {footerText}
                      </div>
                    )}

                    {/* Time indicator */}
                    <div className="text-right text-[0.58rem] text-[#667781] leading-none pt-0.5">
                      10:42 AM
                    </div>

                    {/* Button */}
                    {hasButton && (
                      <div className="border-t border-[#E9EDEF] pt-2 mt-2 -mx-3.5 -mb-1 px-3.5 flex items-center justify-center gap-1.5 text-[#00A884] font-bold text-[0.7rem]">
                        <ExternalLink className="size-3" />
                        <span>{buttonText}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F2] border border-[#464137]/15 text-[0.66rem] text-[#6F6B61] space-y-1">
                  <div className="flex items-center gap-1 text-[#444C38] font-bold">
                    <Info className="size-3" />
                    <span>Meta Approval Requirement</span>
                  </div>
                  <p>
                    Submitted templates are reviewed by Meta automated and human evaluators. Utility templates must be non-promotional and directly relevant to confirmed workshop registrations.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-[#464137]/15 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-[#464137]/20 text-xs font-semibold text-[#464137] hover:bg-[#EBE7DC] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitTemplate(true)}
                className="px-4 py-2 rounded-lg bg-[#EBE7DC] text-[#444C38] text-xs font-bold hover:bg-[#DFD8C8] transition-colors disabled:opacity-50"
              >
                Save as Draft Only
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitTemplate(false)}
                className="btn-studio px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Send className="size-3.5" />
                <span>{isSubmitting ? "Submitting to Meta..." : "Submit for WhatsApp Approval"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TEMPLATE DETAILS MODAL */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#FAF8F2] w-full max-w-xl rounded-2xl border border-[#464137]/20 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setViewingTemplate(null)}
              className="absolute top-4 right-4 size-8 grid place-items-center rounded-full bg-[#EBE7DC] text-[#444C38] hover:bg-[#DFD8C8] transition-colors"
            >
              ✕
            </button>

            <div className="border-b border-[#464137]/15 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-[#14120E]">
                  {viewingTemplate.internalTitle}
                </h3>
                {getStatusBadge(viewingTemplate.metaStatus)}
              </div>
              <p className="font-mono text-xs text-[#6F6B61] mt-0.5">
                Meta Name: {viewingTemplate.metaTemplateName} • {viewingTemplate.language}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-[#464137]/10 text-xs">
                <div>
                  <span className="text-[#6F6B61] block text-[0.65rem] uppercase font-bold">Purpose</span>
                  <div className="mt-0.5">
                    {getPurposeBadge(viewingTemplate.templatePurpose || (viewingTemplate as any).template_purpose)}
                  </div>
                </div>
                <div>
                  <span className="text-[#6F6B61] block text-[0.65rem] uppercase font-bold">Meta Category</span>
                  <span className="font-semibold text-[#14120E] block mt-0.5">{viewingTemplate.category}</span>
                </div>
                <div>
                  <span className="text-[#6F6B61] block text-[0.65rem] uppercase font-bold">Meta ID</span>
                  <span className="font-mono text-[#14120E] text-[0.68rem] block mt-0.5">{viewingTemplate.metaTemplateId || "Pending Submission"}</span>
                </div>
              </div>

              {/* Confirmation Assignment Status & Actions */}
              {viewingTemplate.templatePurpose === "confirmation" && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-950 flex items-center gap-1.5">
                      <CheckCheck className="size-3.5 text-blue-700" />
                      Confirmation Template Assignment
                    </span>
                    {viewingTemplate.isDefaultConfirmation && (
                      <span className="px-2 py-0.5 rounded-full text-[0.62rem] font-bold bg-emerald-100 text-emerald-800">
                        Default Active
                      </span>
                    )}
                  </div>

                  <p className="text-[0.68rem] text-blue-800">
                    {viewingTemplate.isDefaultConfirmation
                      ? "This template is currently active as the studio-wide default confirmation message."
                      : viewingTemplate.assignedCourseId
                      ? `This template is assigned to: ${courses.find((c) => c.id === viewingTemplate.assignedCourseId)?.title || "Course"}`
                      : "This confirmation template is not currently assigned to any course."}
                  </p>

                  {!isReadOnly && viewingTemplate.metaStatus === "APPROVED" && (
                    <div className="pt-2 border-t border-blue-200/60 flex flex-wrap items-center gap-2">
                      {!viewingTemplate.isDefaultConfirmation && (
                        <button
                          type="button"
                          disabled={isAssigning}
                          onClick={() => handleAssignTemplate(viewingTemplate.id, { isDefault: true })}
                          className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-[0.68rem] font-bold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Set as Studio Default
                        </button>
                      )}

                      {courses.length > 0 && (
                        <select
                          disabled={isAssigning}
                          value={viewingTemplate.assignedCourseId || ""}
                          onChange={(e) =>
                            handleAssignTemplate(viewingTemplate.id, {
                              courseId: e.target.value || null,
                            })
                          }
                          className="px-2 py-1 rounded bg-white border border-blue-300 text-[0.68rem] text-blue-950 font-medium outline-none"
                        >
                          <option value="">Assign to Course...</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              Assign to: {c.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}

              {viewingTemplate.metaRejectionReason && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                  <span className="font-bold block">Meta Rejection Feedback</span>
                  <p>{viewingTemplate.metaRejectionReason}</p>
                </div>
              )}

              {/* Message Content */}
              <div className="bg-[#EFEAE2] p-4 rounded-xl border border-[#464137]/15">
                <div className="bg-white rounded-lg p-3 shadow-xs max-w-md text-xs text-[#111B21] space-y-1.5 whitespace-pre-line">
                  {viewingTemplate.components.map((c, idx) => {
                    if (c.type === "HEADER" && (c as any).text) {
                      return <div key={idx} className="font-bold border-b pb-1">{(c as any).text}</div>;
                    }
                    if (c.type === "BODY") {
                      return <div key={idx}>{(c as any).text}</div>;
                    }
                    if (c.type === "FOOTER") {
                      return <div key={idx} className="text-[0.62rem] text-[#667781] pt-1">{(c as any).text}</div>;
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Variables Summary */}
              {viewingTemplate.variableDefinitions && viewingTemplate.variableDefinitions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#292923] block">Variable Mapping Definition</span>
                  <div className="grid grid-cols-3 gap-2 text-[0.68rem]">
                    {viewingTemplate.variableDefinitions.map((v) => (
                      <div key={v.placeholder} className="bg-white p-2 rounded border border-[#464137]/10">
                        <span className="font-mono font-bold text-[#444C38] block">{v.placeholder}</span>
                        <span className="text-[#14120E] block font-medium">{v.name}</span>
                        <span className="text-[#6F6B61] text-[0.62rem] block">Source: {v.sourceField}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#464137]/15 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingTemplate(null)}
                className="btn-studio px-5 py-2 text-xs font-bold"
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
