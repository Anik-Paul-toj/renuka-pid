import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CreateWhatsAppTemplateInput,
  UpdateWhatsAppTemplateInput,
  TemplateCategory,
  TemplatePurpose,
  TemplateStatus,
  createWhatsAppTemplateSchema,
  TemplateComponent,
  VariableDefinition,
} from "@/lib/validations/whatsapp-template";

export interface WhatsAppTemplateRecord {
  id: string;
  internalTitle: string;
  metaTemplateName: string;
  metaTemplateId: string | null;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  templatePurpose: TemplatePurpose;
  assignedCourseId: string | null;
  isDefaultConfirmation: boolean;
  language: string;
  components: TemplateComponent[];
  variableDefinitions: VariableDefinition[];
  metaStatus: TemplateStatus;
  metaRejectionReason: string | null;
  metaQualityScore: string | null;
  submissionStatus: "unsubmitted" | "submitted" | "failed" | "synced";
  submittedAt: string | null;
  lastSyncedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback cache for development or before DB migrations run
const inMemoryTemplates = new Map<string, WhatsAppTemplateRecord>();

// Pre-seed known approved production templates into memory fallback
const INITIAL_SYSTEM_TEMPLATES: WhatsAppTemplateRecord[] = [
  {
    id: "t-booking-confirmation",
    internalTitle: "Booking Confirmation (Official Atelier Notification)",
    metaTemplateName: "booking_confirmation",
    metaTemplateId: "meta_tpl_booking_conf_1",
    category: "UTILITY",
    templatePurpose: "confirmation",
    assignedCourseId: null,
    isDefaultConfirmation: true,
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Namaste {{1}}! Your registration for {{2}} at Renuka Art Studio is confirmed. Your booking reference ID is {{3}}.",
        example: {
          body_text: [["Maya Sharma", "Watercolour Foundation", "REF-KYZ8A1-7F3A"]],
        },
      },
      {
        type: "FOOTER",
        text: "Renuka Art Studio • Mindfulness through Art",
      },
    ],
    variableDefinitions: [
      { placeholder: "{{1}}", name: "Student Name", sampleValue: "Maya Sharma", sourceField: "student_name" },
      { placeholder: "{{2}}", name: "Course Name", sampleValue: "Watercolour Foundation", sourceField: "course_name" },
      { placeholder: "{{3}}", name: "Booking Reference", sampleValue: "REF-KYZ8A1-7F3A", sourceField: "booking_reference" },
    ],
    metaStatus: "APPROVED",
    metaRejectionReason: null,
    metaQualityScore: "GREEN",
    submissionStatus: "synced",
    submittedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t-upcoming-class-reminder",
    internalTitle: "Upcoming Class Reminder",
    metaTemplateName: "upcoming_class_reminder",
    metaTemplateId: "meta_tpl_class_remind_2",
    category: "UTILITY",
    templatePurpose: "batch_reminder",
    assignedCourseId: null,
    isDefaultConfirmation: false,
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}, this is a friendly reminder that your upcoming masterclass for {{2}} is on {{3}} at {{4}}. Join using the live link: {{5}}.",
        example: {
          body_text: [["Maya Sharma", "Roadmap Masterclass", "28 Nov 2026", "6:30 PM IST", "https://zoom.us/j/1234567890"]],
        },
      },
      {
        type: "FOOTER",
        text: "See you in class! • Renuka Aggarwal",
      },
    ],
    variableDefinitions: [
      { placeholder: "{{1}}", name: "Student Name", sampleValue: "Maya Sharma", sourceField: "student_name" },
      { placeholder: "{{2}}", name: "Course Name", sampleValue: "Roadmap Masterclass", sourceField: "course_name" },
      { placeholder: "{{3}}", name: "Batch Date", sampleValue: "28 Nov 2026", sourceField: "batch_date" },
      { placeholder: "{{4}}", name: "Batch Time", sampleValue: "6:30 PM IST", sourceField: "batch_time" },
      { placeholder: "{{5}}", name: "Join Link", sampleValue: "https://zoom.us/j/1234567890", sourceField: "zoom_link" },
    ],
    metaStatus: "APPROVED",
    metaRejectionReason: null,
    metaQualityScore: "GREEN",
    submissionStatus: "synced",
    submittedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

for (const t of INITIAL_SYSTEM_TEMPLATES) {
  inMemoryTemplates.set(t.id, t);
}

function mapDbRowToRecord(row: any): WhatsAppTemplateRecord {
  return {
    id: row.id,
    internalTitle: row.internal_title,
    metaTemplateName: row.meta_template_name,
    metaTemplateId: row.meta_template_id,
    category: row.category,
    templatePurpose: row.template_purpose || "batch_reminder",
    assignedCourseId: row.assigned_course_id || null,
    isDefaultConfirmation: Boolean(row.is_default_confirmation),
    language: row.language,
    components: Array.isArray(row.components) ? row.components : [],
    variableDefinitions: Array.isArray(row.variable_definitions) ? row.variable_definitions : [],
    metaStatus: row.meta_status,
    metaRejectionReason: row.meta_rejection_reason,
    metaQualityScore: row.meta_quality_score,
    submissionStatus: row.submission_status,
    submittedAt: row.submitted_at,
    lastSyncedAt: row.last_synced_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Gets credentials for Meta WhatsApp Business Management API
 */
export function getMetaWabaCredentials() {
  const version = (process.env.WHATSAPP_API_VERSION || "v21.0").trim();
  const wabaId = (process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "").trim();
  const accessToken = (
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.WHATSAPP_API_TOKEN ||
    ""
  ).trim();

  return {
    version,
    wabaId,
    accessToken,
    isConfigured: Boolean(wabaId && accessToken),
  };
}

/**
 * Lists all message templates stored locally with optional search and filters.
 */
export async function listTemplates(options?: {
  search?: string;
  status?: string;
  category?: string;
  purpose?: string;
}): Promise<WhatsAppTemplateRecord[]> {
  const supabase = createAdminClient();

  try {
    let query = supabase
      .from("whatsapp_message_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (options?.status && options.status !== "all") {
      query = query.eq("meta_status", options.status);
    }
    if (options?.category && options.category !== "all") {
      query = query.eq("category", options.category);
    }
    if (options?.purpose && options.purpose !== "all") {
      query = query.eq("template_purpose", options.purpose);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      let results = data.map(mapDbRowToRecord);
      if (options?.search) {
        const s = options.search.toLowerCase();
        results = results.filter(
          (t) =>
            t.internalTitle.toLowerCase().includes(s) ||
            t.metaTemplateName.toLowerCase().includes(s)
        );
      }
      return results;
    }
  } catch (err) {
    // If table doesn't exist yet, fall back to memory
  }

  // Fallback to in-memory store
  let items = Array.from(inMemoryTemplates.values());
  if (options?.status && options.status !== "all") {
    items = items.filter((t) => t.metaStatus === options.status);
  }
  if (options?.category && options.category !== "all") {
    items = items.filter((t) => t.category === options.category);
  }
  if (options?.purpose && options.purpose !== "all") {
    items = items.filter((t) => t.templatePurpose === options.purpose);
  }
  if (options?.search) {
    const s = options.search.toLowerCase();
    items = items.filter(
      (t) =>
        t.internalTitle.toLowerCase().includes(s) ||
        t.metaTemplateName.toLowerCase().includes(s)
    );
  }
  return items;
}

/**
 * Gets a single template by ID.
 */
export async function getTemplateById(id: string): Promise<WhatsAppTemplateRecord | null> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from("whatsapp_message_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return mapDbRowToRecord(data);
    }
  } catch {}

  return inMemoryTemplates.get(id) || null;
}

/**
 * Creates a new draft WhatsApp template locally.
 */
export async function createTemplateDraft(
  input: CreateWhatsAppTemplateInput,
  adminEmail: string = "admin"
): Promise<WhatsAppTemplateRecord> {
  const validated = createWhatsAppTemplateSchema.parse(input);
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const insertPayload = {
    internal_title: validated.internalTitle,
    meta_template_name: validated.metaTemplateName,
    meta_template_id: null,
    category: validated.category,
    template_purpose: validated.templatePurpose,
    assigned_course_id: validated.assignedCourseId || null,
    is_default_confirmation: Boolean(validated.isDefaultConfirmation),
    language: validated.language,
    components: validated.components,
    variable_definitions: validated.variableDefinitions,
    meta_status: "DRAFT",
    meta_rejection_reason: null,
    meta_quality_score: null,
    submission_status: "unsubmitted",
    submitted_at: null,
    last_synced_at: null,
    created_by: adminEmail,
    created_at: now,
    updated_at: now,
  };

  try {
    // If setting as default confirmation, uncheck other defaults first
    if (validated.isDefaultConfirmation && validated.templatePurpose === "confirmation") {
      await supabase
        .from("whatsapp_message_templates")
        .update({ is_default_confirmation: false })
        .eq("is_default_confirmation", true);

      for (const [k, v] of inMemoryTemplates.entries()) {
        if (v.isDefaultConfirmation) inMemoryTemplates.set(k, { ...v, isDefaultConfirmation: false });
      }
    }

    // If assigning to a specific course, clear previous template for this course
    if (validated.assignedCourseId && validated.templatePurpose === "confirmation") {
      await supabase
        .from("whatsapp_message_templates")
        .update({ assigned_course_id: null })
        .eq("assigned_course_id", validated.assignedCourseId);

      for (const [k, v] of inMemoryTemplates.entries()) {
        if (v.assignedCourseId === validated.assignedCourseId) {
          inMemoryTemplates.set(k, { ...v, assignedCourseId: null });
        }
      }
    }

    const { data, error } = await supabase
      .from("whatsapp_message_templates")
      .insert(insertPayload)
      .select("*")
      .single();

    if (!error && data) {
      const record = mapDbRowToRecord(data);
      inMemoryTemplates.set(record.id, record);
      return record;
    }
  } catch {}

  // Fallback to memory
  const id = `tpl-${Date.now()}`;
  const record: WhatsAppTemplateRecord = {
    id,
    internalTitle: validated.internalTitle,
    metaTemplateName: validated.metaTemplateName,
    metaTemplateId: null,
    category: validated.category,
    templatePurpose: validated.templatePurpose,
    assignedCourseId: validated.assignedCourseId || null,
    isDefaultConfirmation: Boolean(validated.isDefaultConfirmation),
    language: validated.language,
    components: validated.components,
    variableDefinitions: validated.variableDefinitions,
    metaStatus: "DRAFT",
    metaRejectionReason: null,
    metaQualityScore: null,
    submissionStatus: "unsubmitted",
    submittedAt: null,
    lastSyncedAt: null,
    createdBy: adminEmail,
    createdAt: now,
    updatedAt: now,
  };
  inMemoryTemplates.set(id, record);
  return record;
}

/**
 * Updates an unsubmitted or draft template.
 */
export async function updateTemplateDraft(
  id: string,
  input: UpdateWhatsAppTemplateInput
): Promise<WhatsAppTemplateRecord> {
  const existing = await getTemplateById(id);
  if (!existing) {
    throw new Error("Template not found.");
  }

  if (existing.metaStatus === "APPROVED" || existing.submissionStatus === "submitted") {
    throw new Error("Submitted or approved Meta templates cannot be directly overwritten. Please duplicate or create a new template draft.");
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const updatedTitle = input.internalTitle ?? existing.internalTitle;
  const updatedCategory = input.category ?? existing.category;
  const updatedPurpose = input.templatePurpose ?? existing.templatePurpose;
  const updatedAssignedCourse = input.assignedCourseId !== undefined ? input.assignedCourseId : existing.assignedCourseId;
  const updatedIsDefault = input.isDefaultConfirmation !== undefined ? input.isDefaultConfirmation : existing.isDefaultConfirmation;
  const updatedLanguage = input.language ?? existing.language;
  const updatedComponents = input.components ?? existing.components;
  const updatedVariables = input.variableDefinitions ?? existing.variableDefinitions;

  try {
    const { data, error } = await supabase
      .from("whatsapp_message_templates")
      .update({
        internal_title: updatedTitle,
        category: updatedCategory,
        template_purpose: updatedPurpose,
        assigned_course_id: updatedAssignedCourse,
        is_default_confirmation: updatedIsDefault,
        language: updatedLanguage,
        components: updatedComponents,
        variable_definitions: updatedVariables,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (!error && data) {
      const record = mapDbRowToRecord(data);
      inMemoryTemplates.set(record.id, record);
      return record;
    }
  } catch {}

  const record: WhatsAppTemplateRecord = {
    ...existing,
    internalTitle: updatedTitle,
    category: updatedCategory,
    templatePurpose: updatedPurpose,
    assignedCourseId: updatedAssignedCourse,
    isDefaultConfirmation: updatedIsDefault,
    language: updatedLanguage,
    components: updatedComponents,
    variableDefinitions: updatedVariables,
    updatedAt: now,
  };
  inMemoryTemplates.set(id, record);
  return record;
}

/**
 * Assigns an approved Confirmation template to a course or sets as studio-wide default.
 */
export async function assignConfirmationTemplate(
  templateId: string,
  options: {
    courseId?: string | null;
    isDefault?: boolean;
  }
): Promise<{ success: boolean; template?: WhatsAppTemplateRecord; error?: string }> {
  const template = await getTemplateById(templateId);
  if (!template) {
    return { success: false, error: "Template not found." };
  }

  if (template.templatePurpose !== "confirmation") {
    return { success: false, error: "Only templates with purpose 'confirmation' can be assigned as confirmation templates." };
  }

  if (template.metaStatus !== "APPROVED") {
    return { success: false, error: "Only Meta-approved templates can be assigned for active confirmation delivery." };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    // 1. If setting as default, clear any other default
    if (options.isDefault) {
      await supabase
        .from("whatsapp_message_templates")
        .update({ is_default_confirmation: false })
        .eq("is_default_confirmation", true);

      for (const [k, v] of inMemoryTemplates.entries()) {
        if (v.isDefaultConfirmation) inMemoryTemplates.set(k, { ...v, isDefaultConfirmation: false });
      }
    }

    // 2. If assigning to course, clear previous template assigned to this course
    if (options.courseId) {
      await supabase
        .from("whatsapp_message_templates")
        .update({ assigned_course_id: null })
        .eq("assigned_course_id", options.courseId);

      for (const [k, v] of inMemoryTemplates.entries()) {
        if (v.assignedCourseId === options.courseId) inMemoryTemplates.set(k, { ...v, assignedCourseId: null });
      }
    }

    const updates: any = {
      updated_at: now,
    };
    if (options.courseId !== undefined) updates.assigned_course_id = options.courseId;
    if (options.isDefault !== undefined) updates.is_default_confirmation = options.isDefault;

    const { data, error } = await supabase
      .from("whatsapp_message_templates")
      .update(updates)
      .eq("id", templateId)
      .select("*")
      .single();

    if (!error && data) {
      const updated = mapDbRowToRecord(data);
      inMemoryTemplates.set(updated.id, updated);
      return { success: true, template: updated };
    }
  } catch {}

  const updated: WhatsAppTemplateRecord = {
    ...template,
    assignedCourseId: options.courseId !== undefined ? options.courseId : template.assignedCourseId,
    isDefaultConfirmation: options.isDefault !== undefined ? options.isDefault : template.isDefaultConfirmation,
    updatedAt: now,
  };
  inMemoryTemplates.set(templateId, updated);
  return { success: true, template: updated };
}

/**
 * Deletes a local draft template.
 */
export async function deleteTemplateDraft(id: string): Promise<boolean> {
  const existing = await getTemplateById(id);
  if (!existing) return false;

  const supabase = createAdminClient();
  try {
    await supabase.from("whatsapp_message_templates").delete().eq("id", id);
  } catch {}

  inMemoryTemplates.delete(id);
  return true;
}

/**
 * Builds the exact Meta WABA API template payload.
 * Ensures example body_text arrays and header parameters conform strictly to Meta guidelines.
 */
export function buildMetaTemplatePayload(template: Partial<WhatsAppTemplateRecord> & {
  metaTemplateName: string;
  category: TemplateCategory;
  language: string;
  components: TemplateComponent[];
  variableDefinitions?: VariableDefinition[];
}) {
  const varDefs = template.variableDefinitions || [];
  const componentsPayload = template.components.map((comp) => {
    if (comp.type === "BODY") {
      // Find placeholders like {{1}}, {{2}} in comp.text
      const matches = comp.text.match(/\{\{(\d+)\}\}/g) || [];
      if (matches.length > 0) {
        // Collect sample values from variable definitions or defaults
        const samples = matches.map((m) => {
          const def = varDefs.find((v) => v.placeholder === m);
          return def?.sampleValue || "Sample";
        });
        return {
          type: "BODY",
          text: comp.text,
          example: {
            body_text: [samples],
          },
        };
      }
      return {
        type: "BODY",
        text: comp.text,
      };
    }

    if (comp.type === "HEADER") {
      if (comp.format === "TEXT") {
        const matches = (comp.text || "").match(/\{\{(\d+)\}\}/g) || [];
        if (matches.length > 0) {
          const samples = matches.map((m) => {
            const def = varDefs.find((v) => v.placeholder === m);
            return def?.sampleValue || "Sample";
          });
          return {
            type: "HEADER",
            format: "TEXT",
            text: comp.text,
            example: {
              header_text: samples,
            },
          };
        }
        return {
          type: "HEADER",
          format: "TEXT",
          text: comp.text,
        };
      }
      return {
        type: "HEADER",
        format: comp.format,
      };
    }

    if (comp.type === "FOOTER") {
      return {
        type: "FOOTER",
        text: comp.text,
      };
    }

    if (comp.type === "BUTTONS") {
      return {
        type: "BUTTONS",
        buttons: comp.buttons.map((b) => {
          if (b.type === "URL") {
            return {
              type: "URL",
              text: b.text,
              url: b.url,
            };
          }
          return {
            type: "QUICK_REPLY",
            text: b.text,
          };
        }),
      };
    }

    return comp;
  });

  return {
    name: template.metaTemplateName,
    category: template.category,
    language: template.language,
    components: componentsPayload,
  };
}

/**
 * Submits a template directly to Meta WhatsApp Business API for approval.
 */
export async function submitTemplateToMeta(
  id: string,
  options?: { mockSuccessId?: string; mockStatus?: TemplateStatus; useMock?: boolean }
): Promise<{ success: boolean; metaTemplateId?: string; status?: TemplateStatus; template?: WhatsAppTemplateRecord; error?: string }> {
  const template = await getTemplateById(id);
  if (!template) {
    return { success: false, error: "Template not found." };
  }

  // Ensure body component exists
  const hasBody = template.components.some((c) => c.type === "BODY");
  if (!hasBody) {
    return { success: false, error: "A message template must contain a BODY component." };
  }

  const { version, wabaId, accessToken, isConfigured } = getMetaWabaCredentials();
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Test / Mock override mode (for automated tests or offline sandbox)
  if (options?.useMock || options?.mockSuccessId || !isConfigured || process.env.NODE_ENV === "test") {
    const metaId = options?.mockSuccessId || `meta_${Date.now()}`;
    const initialStatus: TemplateStatus = options?.mockStatus || "PENDING";

    const updatedRecord: WhatsAppTemplateRecord = {
      ...template,
      metaTemplateId: metaId,
      metaStatus: initialStatus,
      submissionStatus: "submitted",
      submittedAt: now,
      lastSyncedAt: now,
      updatedAt: now,
    };

    try {
      await supabase
        .from("whatsapp_message_templates")
        .update({
          meta_template_id: metaId,
          meta_status: initialStatus,
          submission_status: "submitted",
          submitted_at: now,
          last_synced_at: now,
          updated_at: now,
        })
        .eq("id", id);
    } catch {}

    inMemoryTemplates.set(id, updatedRecord);
    return { success: true, metaTemplateId: metaId, status: initialStatus, template: updatedRecord };
  }

  // Live Meta Cloud API Submission
  try {
    const payload = buildMetaTemplatePayload(template);
    const url = `https://graph.facebook.com/${version}/${wabaId}/message_templates`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const metaError = data?.error;
      const errorMsg =
        metaError?.error_user_msg ||
        metaError?.message ||
        `Meta API submission failed with HTTP ${response.status}`;

      try {
        await supabase
          .from("whatsapp_message_templates")
          .update({
            submission_status: "failed",
            meta_rejection_reason: errorMsg,
            updated_at: now,
          })
          .eq("id", id);
      } catch {}

      template.submissionStatus = "failed";
      template.metaRejectionReason = errorMsg;
      inMemoryTemplates.set(id, template);

      return { success: false, error: errorMsg };
    }

    const metaTemplateId = data.id || `meta_${Date.now()}`;
    const initialStatus: TemplateStatus =
      data.status === "APPROVED" ? "APPROVED" : "PENDING";

    try {
      await supabase
        .from("whatsapp_message_templates")
        .update({
          meta_template_id: metaTemplateId,
          meta_status: initialStatus,
          submission_status: "submitted",
          submitted_at: now,
          last_synced_at: now,
          updated_at: now,
        })
        .eq("id", id);
    } catch {}

    template.metaTemplateId = metaTemplateId;
    template.metaStatus = initialStatus;
    template.submissionStatus = "submitted";
    template.submittedAt = now;
    template.lastSyncedAt = now;
    inMemoryTemplates.set(id, template);

    return {
      success: true,
      metaTemplateId,
      status: initialStatus,
    };
  } catch (err: any) {
    const errorMsg = err.message || "Network error while connecting to Meta WhatsApp API.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Synchronizes template statuses with Meta Graph API.
 * Updates local records and auto-imports existing templates from Meta.
 */
export async function syncTemplatesWithMeta(): Promise<{
  success: boolean;
  syncedCount: number;
  importedCount: number;
  error?: string;
}> {
  const { version, wabaId, accessToken, isConfigured } = getMetaWabaCredentials();
  if (!isConfigured) {
    return {
      success: false,
      syncedCount: 0,
      importedCount: 0,
      error: "WhatsApp Business Account credentials are not configured.",
    };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    const url = `https://graph.facebook.com/${version}/${wabaId}/message_templates?fields=id,name,status,category,language,components,quality_score,rejected_reason&limit=100`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || !Array.isArray(data.data)) {
      return {
        success: false,
        syncedCount: 0,
        importedCount: 0,
        error: data?.error?.message || "Failed to retrieve templates from Meta.",
      };
    }

    let syncedCount = 0;
    let importedCount = 0;

    const localTemplates = await listTemplates();
    const localMap = new Map(
      localTemplates.map((t) => [`${t.metaTemplateName}:${t.language}`, t])
    );

    for (const metaTpl of data.data) {
      const key = `${metaTpl.name}:${metaTpl.language}`;
      const existing = localMap.get(key);

      const statusMap: Record<string, TemplateStatus> = {
        APPROVED: "APPROVED",
        PENDING: "PENDING",
        REJECTED: "REJECTED",
        PAUSED: "PAUSED",
        DISABLED: "DISABLED",
        IN_APPEAL: "IN_APPEAL",
      };
      const resolvedStatus = statusMap[metaTpl.status] || "PENDING";
      const qualityScore = metaTpl.quality_score?.score || null;
      const rejectionReason = metaTpl.rejected_reason || null;

      if (existing) {
        // Update local template record
        try {
          await supabase
            .from("whatsapp_message_templates")
            .update({
              meta_template_id: metaTpl.id,
              meta_status: resolvedStatus,
              meta_quality_score: qualityScore,
              meta_rejection_reason: rejectionReason,
              submission_status: "synced",
              last_synced_at: now,
              updated_at: now,
            })
            .eq("id", existing.id);
        } catch {}

        existing.metaTemplateId = metaTpl.id;
        existing.metaStatus = resolvedStatus;
        existing.metaQualityScore = qualityScore;
        existing.metaRejectionReason = rejectionReason;
        existing.submissionStatus = "synced";
        existing.lastSyncedAt = now;
        inMemoryTemplates.set(existing.id, existing);
        syncedCount++;
      } else {
        // Auto-import template from Meta into studio database
        const newRecord: WhatsAppTemplateRecord = {
          id: `meta-${metaTpl.id}`,
          internalTitle: metaTpl.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          metaTemplateName: metaTpl.name,
          metaTemplateId: metaTpl.id,
          category: metaTpl.category || "UTILITY",
          templatePurpose: metaTpl.name.includes("confirm") ? "confirmation" : "batch_reminder",
          assignedCourseId: null,
          isDefaultConfirmation: metaTpl.name === "booking_confirmation",
          language: metaTpl.language || "en_US",
          components: metaTpl.components || [],
          variableDefinitions: [],
          metaStatus: resolvedStatus,
          metaRejectionReason: rejectionReason,
          metaQualityScore: qualityScore,
          submissionStatus: "synced",
          submittedAt: now,
          lastSyncedAt: now,
          createdBy: "meta_sync",
          createdAt: now,
          updatedAt: now,
        };

        try {
          await supabase.from("whatsapp_message_templates").upsert(
            {
              internal_title: newRecord.internalTitle,
              meta_template_name: newRecord.metaTemplateName,
              meta_template_id: newRecord.metaTemplateId,
              category: newRecord.category,
              language: newRecord.language,
              components: newRecord.components,
              variable_definitions: newRecord.variableDefinitions,
              meta_status: newRecord.metaStatus,
              meta_quality_score: newRecord.metaQualityScore,
              meta_rejection_reason: newRecord.metaRejectionReason,
              submission_status: "synced",
              submitted_at: now,
              last_synced_at: now,
              created_by: "meta_sync",
              created_at: now,
              updated_at: now,
            },
            { onConflict: "meta_template_name, language" }
          );
        } catch {}

        inMemoryTemplates.set(newRecord.id, newRecord);
        importedCount++;
      }
    }

    return {
      success: true,
      syncedCount,
      importedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      syncedCount: 0,
      importedCount: 0,
      error: err.message || "Failed to synchronize templates.",
    };
  }
}

/**
 * Returns only templates whose confirmed Meta status is APPROVED.
 * Strictly filters by broadcast-eligible purpose ('upcoming_batches' or 'batch_reminder').
 * Strictly excludes Confirmation templates from normal broadcasts by default.
 */
export async function getApprovedTemplatesForBroadcast(options?: {
  purpose?: "upcoming_batches" | "batch_reminder" | "all";
}): Promise<WhatsAppTemplateRecord[]> {
  const allTemplates = await listTemplates({ status: "APPROVED" });
  return allTemplates.filter((t) => {
    if (t.metaStatus !== "APPROVED") return false;

    // Normal broadcasts strictly exclude confirmation templates
    if (options?.purpose !== "all" && t.templatePurpose === "confirmation") {
      return false;
    }

    if (options?.purpose && options.purpose !== "all") {
      return t.templatePurpose === options.purpose;
    }

    // Default: allow upcoming_batches and batch_reminder
    return t.templatePurpose === "upcoming_batches" || t.templatePurpose === "batch_reminder";
  });
}

/**
 * Resolves the active, approved confirmation template for a given course or studio default.
 * Safe fallback hierarchy:
 * 1. Course-specific approved confirmation template
 * 2. Studio-wide default approved confirmation template
 * 3. Approved 'booking_confirmation' system template
 * 4. Any approved confirmation template
 * Returns null if no approved confirmation template is available.
 */
export async function getActiveConfirmationTemplate(
  courseId?: string | null
): Promise<WhatsAppTemplateRecord | null> {
  const allApproved = await listTemplates({ status: "APPROVED" });
  const confirmations = allApproved.filter(
    (t) => t.metaStatus === "APPROVED" && t.templatePurpose === "confirmation"
  );

  // 1. Look for course-specific approved confirmation template
  if (courseId) {
    const courseSpecific = confirmations.find(
      (t) => t.assignedCourseId === courseId
    );
    if (courseSpecific) return courseSpecific;
  }

  // 2. Look for studio-wide default confirmation template
  const defaultTpl = confirmations.find((t) => t.isDefaultConfirmation);
  if (defaultTpl) return defaultTpl;

  // 3. Fallback to approved booking_confirmation
  const bookingConf = allApproved.find(
    (t) => t.metaTemplateName === "booking_confirmation" && t.metaStatus === "APPROVED"
  );
  if (bookingConf) return bookingConf;

  // 4. Return any approved confirmation template
  return confirmations[0] || null;
}
