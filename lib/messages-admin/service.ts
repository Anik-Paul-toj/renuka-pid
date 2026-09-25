import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminMessagesQuery, UpdateMessageTemplateInput } from "@/lib/validations/message-admin";

export interface MessageTemplateRecord {
  id: string;
  slug: string;
  channel: "email" | "whatsapp";
  name: string;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RenderedTemplatePreview {
  renderedSubject: string | null;
  renderedBody: string;
  unrecognizedVariables: string[];
}

export const SAMPLE_PREVIEW_VARIABLES: Record<string, string> = {
  student_name: "Aarav Sharma",
  customerName: "Aarav Sharma",
  course_name: "The WATERCOLOUR Roadmap: One-Day Masterclass",
  courseName: "The WATERCOLOUR Roadmap: One-Day Masterclass",
  batch_name: "Live Masterclass — 28 Oct 2026",
  batchName: "Live Masterclass — 28 Oct 2026",
  date: "28 Oct 2026",
  startDate: "28 Oct 2026",
  time: "6:30 PM – 8:30 PM IST",
  booking_reference: "REF-PREVIEW-8899",
  bookingReference: "REF-PREVIEW-8899",
  amount_paid: "₹199",
  amount: "₹199",
  payment_reference: "pay_preview_123456",
  paymentId: "pay_preview_123456",
  zoom_link: "https://zoom.us/j/1234567890 (Passcode: 123456)",
};

/**
 * Safely renders a preview of subject and body using sample data without sending any messages.
 * Detects and flags any unrecognized variables.
 */
export function renderTemplatePreview(
  subject: string | null,
  body: string,
  sampleVars: Record<string, string> = SAMPLE_PREVIEW_VARIABLES
): RenderedTemplatePreview {
  const unrecognizedSet = new Set<string>();
  const variableRegex = /\{\{([^}]+)\}\}/g;

  // Render Subject
  let renderedSubject: string | null = null;
  if (subject) {
    renderedSubject = subject.replace(variableRegex, (match, varName) => {
      const key = varName.trim();
      if (key in sampleVars) {
        return sampleVars[key];
      }
      unrecognizedSet.add(key);
      return match; // Leave untouched for inspection
    });
  }

  // Render Body
  const renderedBody = body.replace(variableRegex, (match, varName) => {
    const key = varName.trim();
    if (key in sampleVars) {
      return sampleVars[key];
    }
    unrecognizedSet.add(key);
    return match; // Leave untouched for inspection
  });

  return {
    renderedSubject,
    renderedBody,
    unrecognizedVariables: Array.from(unrecognizedSet),
  };
}

/**
 * Retrieves the list of message templates with search and filtering.
 */
export async function getMessageTemplatesList(
  query: AdminMessagesQuery
): Promise<
  | { success: true; data: { templates: MessageTemplateRecord[]; totalCount: number } }
  | { success: false; error: string; statusCode: number }
> {
  try {
    const adminClient = createAdminClient();
    const { search, channel, status } = query;

    let queryBuilder = adminClient
      .from("message_templates")
      .select("id, slug, channel, name, subject, body, variables, is_active, created_at, updated_at", { count: "exact" });

    // Filter by Channel
    if (channel && channel !== "all") {
      queryBuilder = queryBuilder.eq("channel", channel);
    }

    // Filter by Active Status
    if (status === "active") {
      queryBuilder = queryBuilder.eq("is_active", true);
    } else if (status === "inactive") {
      queryBuilder = queryBuilder.eq("is_active", false);
    }

    // Search by Slug, Name, Subject, or Body
    if (search && search.trim()) {
      const sanitized = search.trim();
      queryBuilder = queryBuilder.or(
        `slug.ilike.%${sanitized}%,name.ilike.%${sanitized}%,subject.ilike.%${sanitized}%,body.ilike.%${sanitized}%`
      );
    }

    queryBuilder = queryBuilder.order("name", { ascending: true });

    const { data, count, error } = await queryBuilder;

    if (error) {
      console.error("getMessageTemplatesList query error:", error);
      return { success: false, error: "Failed to retrieve message templates.", statusCode: 500 };
    }

    const templates: MessageTemplateRecord[] = (data || []).map((t) => ({
      id: t.id,
      slug: t.slug,
      channel: t.channel as "email" | "whatsapp",
      name: t.name,
      subject: t.subject,
      body: t.body,
      variables: Array.isArray(t.variables) ? t.variables : [],
      isActive: t.is_active,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    return {
      success: true,
      data: {
        templates,
        totalCount: count ?? templates.length,
      },
    };
  } catch (err: any) {
    console.error("getMessageTemplatesList exception:", err);
    return { success: false, error: "Internal error retrieving templates.", statusCode: 500 };
  }
}

/**
 * Retrieves a single template by ID or slug.
 */
export async function getMessageTemplateById(
  idOrSlug: string
): Promise<
  | { success: true; data: MessageTemplateRecord & { preview: RenderedTemplatePreview } }
  | { success: false; error: string; statusCode: number }
> {
  try {
    const adminClient = createAdminClient();

    // Check if UUID or slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let queryBuilder = adminClient
      .from("message_templates")
      .select("id, slug, channel, name, subject, body, variables, is_active, created_at, updated_at");

    if (uuidRegex.test(idOrSlug)) {
      queryBuilder = queryBuilder.eq("id", idOrSlug);
    } else {
      queryBuilder = queryBuilder.eq("slug", idOrSlug);
    }

    const { data: template, error } = await queryBuilder.maybeSingle();

    if (error) {
      console.error("getMessageTemplateById query error:", error);
      return { success: false, error: "Failed to load message template.", statusCode: 500 };
    }

    if (!template) {
      return { success: false, error: "Message template not found.", statusCode: 404 };
    }

    const preview = renderTemplatePreview(template.subject, template.body);

    const record: MessageTemplateRecord & { preview: RenderedTemplatePreview } = {
      id: template.id,
      slug: template.slug,
      channel: template.channel as "email" | "whatsapp",
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: Array.isArray(template.variables) ? template.variables : [],
      isActive: template.is_active,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      preview,
    };

    return { success: true, data: record };
  } catch (err: any) {
    console.error("getMessageTemplateById exception:", err);
    return { success: false, error: "Internal error loading template.", statusCode: 500 };
  }
}

/**
 * Updates a message template without altering its slug or creating duplicate rows.
 */
export async function updateMessageTemplate(
  idOrSlug: string,
  input: UpdateMessageTemplateInput
): Promise<
  | { success: true; data: MessageTemplateRecord & { preview: RenderedTemplatePreview } }
  | { success: false; error: string; statusCode: number }
> {
  try {
    const adminClient = createAdminClient();

    // 1. Fetch existing template to ensure existence and check channel constraints
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let existingQuery = adminClient
      .from("message_templates")
      .select("id, slug, channel, name, subject, body, variables, is_active");

    if (uuidRegex.test(idOrSlug)) {
      existingQuery = existingQuery.eq("id", idOrSlug);
    } else {
      existingQuery = existingQuery.eq("slug", idOrSlug);
    }

    const { data: existing, error: fetchErr } = await existingQuery.maybeSingle();

    if (fetchErr) {
      console.error("updateMessageTemplate fetch error:", fetchErr);
      return { success: false, error: "Failed to verify existing template.", statusCode: 500 };
    }

    if (!existing) {
      return { success: false, error: "Message template not found.", statusCode: 404 };
    }

    // 2. Channel validation rules
    let cleanSubject: string | null = null;
    if (existing.channel === "email") {
      cleanSubject = input.subject !== undefined ? input.subject : existing.subject;
      if (!cleanSubject || !cleanSubject.trim()) {
        return { success: false, error: "Subject is required for email templates.", statusCode: 400 };
      }
      cleanSubject = cleanSubject.trim();
    } else {
      // WhatsApp templates have no subject
      cleanSubject = null;
    }

    const cleanBody = input.body.trim();
    if (!cleanBody) {
      return { success: false, error: "Template body cannot be empty.", statusCode: 400 };
    }

    const cleanName = input.name !== undefined ? input.name.trim() : existing.name;
    const cleanIsActive = input.is_active !== undefined ? input.is_active : existing.is_active;

    // 3. Update existing record atomically (slug and id remain immutable)
    const { data: updated, error: updateErr } = await adminClient
      .from("message_templates")
      .update({
        name: cleanName,
        subject: cleanSubject,
        body: cleanBody,
        is_active: cleanIsActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id, slug, channel, name, subject, body, variables, is_active, created_at, updated_at")
      .single();

    if (updateErr || !updated) {
      console.error("updateMessageTemplate update error:", updateErr);
      return { success: false, error: "Failed to update template record.", statusCode: 500 };
    }

    const preview = renderTemplatePreview(updated.subject, updated.body);

    const record: MessageTemplateRecord & { preview: RenderedTemplatePreview } = {
      id: updated.id,
      slug: updated.slug,
      channel: updated.channel as "email" | "whatsapp",
      name: updated.name,
      subject: updated.subject,
      body: updated.body,
      variables: Array.isArray(updated.variables) ? updated.variables : [],
      isActive: updated.is_active,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      preview,
    };

    return { success: true, data: record };
  } catch (err: any) {
    console.error("updateMessageTemplate exception:", err);
    return { success: false, error: "Internal error updating template.", statusCode: 500 };
  }
}
