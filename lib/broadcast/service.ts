import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CreateBroadcastInput,
  UpdateBroadcastInput,
  BroadcastQuery,
  TargetFilterInput,
} from "@/lib/validations/broadcast";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { getSettings } from "@/lib/settings/service";

export interface ResolvedRecipient {
  customerId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  courseTitle?: string | null;
  batchName?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  zoomJoinUrl?: string | null;
}

export interface BroadcastListItem {
  id: string;
  title: string;
  channel: "email" | "whatsapp" | "both";
  targetFilter: TargetFilterInput;
  content: string;
  totalRecipients: number;
  successfulSends: number;
  failedSends: number;
  status: "draft" | "pending" | "processing" | "completed" | "failed";
  sentAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastsListResult {
  broadcasts: BroadcastListItem[];
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

/**
 * Resolves audience recipients strictly server-side from the database.
 * Never trusts client-supplied recipient emails.
 */
export async function resolveBroadcastRecipients(
  filter: TargetFilterInput
): Promise<ResolvedRecipient[]> {
  const adminClient = createAdminClient();
  const audience = filter.audience || "all";
  const recipientsMap = new Map<string, ResolvedRecipient>();

  if (audience === "all") {
    // 1. All registered students with a valid email
    let query = adminClient
      .from("customers")
      .select("id, full_name, email, phone")
      .not("email", "is", null);

    const { data: customers, error } = await query;
    if (error) {
      console.error("Error resolving all students:", error);
      return [];
    }

    // If confirmed-only requested, cross-reference bookings
    if (filter.confirmedOnly) {
      const { data: confirmedBookings } = await adminClient
        .from("bookings")
        .select("customer_id")
        .eq("status", "confirmed");

      const confirmedCustomerIds = new Set(
        (confirmedBookings || []).map((b) => b.customer_id)
      );

      for (const c of customers || []) {
        if (c.email && confirmedCustomerIds.has(c.id)) {
          recipientsMap.set(c.id, {
            customerId: c.id,
            fullName: c.full_name,
            email: c.email.trim(),
            phone: c.phone,
          });
        }
      }
    } else {
      for (const c of customers || []) {
        if (c.email && c.email.trim()) {
          recipientsMap.set(c.id, {
            customerId: c.id,
            fullName: c.full_name,
            email: c.email.trim(),
            phone: c.phone,
          });
        }
      }
    }
  } else if (audience === "course") {
    // 2. Students who booked a specific course
    if (!filter.courseId) return [];

    // Find all cohort batches for this course
    const { data: batches } = await adminClient
      .from("cohort_batches")
      .select("id, batch_name, start_date, start_time, end_time, zoom_join_url")
      .eq("course_id", filter.courseId);

    const batchIds = (batches || []).map((b) => b.id);
    if (batchIds.length === 0) return [];

    const batchMap = new Map(batches?.map((b) => [b.id, b]) || []);

    let bookingQuery = adminClient
      .from("bookings")
      .select("customer_id, batch_id, status, customers(id, full_name, email, phone)")
      .in("batch_id", batchIds);

    if (filter.confirmedOnly) {
      bookingQuery = bookingQuery.eq("status", "confirmed");
    }

    const { data: bookings, error } = await bookingQuery;
    if (error) {
      console.error("Error resolving course students:", error);
      return [];
    }

    for (const b of bookings || []) {
      const cust = b.customers as any;
      if (cust && cust.email && cust.email.trim() && !recipientsMap.has(cust.id)) {
        const batchInfo = batchMap.get(b.batch_id);
        recipientsMap.set(cust.id, {
          customerId: cust.id,
          fullName: cust.full_name,
          email: cust.email.trim(),
          phone: cust.phone,
          courseTitle: filter.courseName || null,
          batchName: batchInfo?.batch_name || null,
          startDate: batchInfo?.start_date || null,
          startTime: batchInfo?.start_time || null,
          endTime: batchInfo?.end_time || null,
          zoomJoinUrl: batchInfo?.zoom_join_url || null,
        });
      }
    }
  } else if (audience === "batch") {
    // 3. Students who booked a specific cohort batch
    if (!filter.batchId) return [];

    const { data: batchInfo } = await adminClient
      .from("cohort_batches")
      .select("id, batch_name, start_date, start_time, end_time, zoom_join_url")
      .eq("id", filter.batchId)
      .maybeSingle();

    let bookingQuery = adminClient
      .from("bookings")
      .select("customer_id, status, customers(id, full_name, email, phone)")
      .eq("batch_id", filter.batchId);

    if (filter.confirmedOnly) {
      bookingQuery = bookingQuery.eq("status", "confirmed");
    }

    const { data: bookings, error } = await bookingQuery;
    if (error) {
      console.error("Error resolving batch students:", error);
      return [];
    }

    for (const b of bookings || []) {
      const cust = b.customers as any;
      if (cust && cust.email && cust.email.trim() && !recipientsMap.has(cust.id)) {
        recipientsMap.set(cust.id, {
          customerId: cust.id,
          fullName: cust.full_name,
          email: cust.email.trim(),
          phone: cust.phone,
          courseTitle: filter.courseName || null,
          batchName: batchInfo?.batch_name || null,
          startDate: batchInfo?.start_date || null,
          startTime: batchInfo?.start_time || null,
          endTime: batchInfo?.end_time || null,
          zoomJoinUrl: batchInfo?.zoom_join_url || null,
        });
      }
    }
  } else if (audience === "confirmed") {
    // 4. Confirmed Students across all bookings
    const { data: bookings, error } = await adminClient
      .from("bookings")
      .select("customer_id, customers(id, full_name, email, phone)")
      .eq("status", "confirmed");

    if (error) {
      console.error("Error resolving confirmed students:", error);
      return [];
    }

    for (const b of bookings || []) {
      const cust = b.customers as any;
      if (cust && cust.email && cust.email.trim() && !recipientsMap.has(cust.id)) {
        recipientsMap.set(cust.id, {
          customerId: cust.id,
          fullName: cust.full_name,
          email: cust.email.trim(),
          phone: cust.phone,
        });
      }
    }
  }

  return Array.from(recipientsMap.values());
}

/**
 * Returns list of broadcasts with filtering, search, and pagination.
 */
export async function getBroadcastsList(
  query: BroadcastQuery
): Promise<{ success: true; data: BroadcastsListResult } | { success: false; error: string }> {
  try {
    const adminClient = createAdminClient();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let dbQuery = adminClient
      .from("broadcasts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (query.status && query.status !== "all") {
      dbQuery = dbQuery.eq("status", query.status);
    }

    if (query.channel && query.channel !== "all") {
      dbQuery = dbQuery.eq("channel", query.channel);
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      dbQuery = dbQuery.or(`title.ilike.%${s}%,content.ilike.%${s}%`);
    }

    dbQuery = dbQuery.range(from, to);

    const { data, count, error } = await dbQuery;
    if (error) {
      console.error("Error fetching broadcasts list:", error);
      return { success: false, error: error.message };
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const broadcasts: BroadcastListItem[] = (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      channel: row.channel as any,
      targetFilter: (row.target_filter || {}) as TargetFilterInput,
      content: row.content,
      totalRecipients: row.total_recipients,
      successfulSends: row.successful_sends,
      failedSends: row.failed_sends,
      status: row.status as any,
      sentAt: row.sent_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      success: true,
      data: {
        broadcasts,
        pagination: {
          totalCount,
          page,
          limit,
          totalPages,
          hasPrevious: page > 1,
          hasNext: page < totalPages,
        },
      },
    };
  } catch (err: any) {
    console.error("getBroadcastsList unhandled error:", err);
    return { success: false, error: err.message || "Failed to list broadcasts." };
  }
}

/**
 * Gets a single broadcast detail by ID with delivery summary.
 */
export async function getBroadcastById(
  id: string
): Promise<{ success: true; data: BroadcastListItem } | { success: false; error: string; statusCode: number }> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("broadcasts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: "Broadcast not found", statusCode: 404 };
    }

    const broadcast: BroadcastListItem = {
      id: data.id,
      title: data.title,
      channel: data.channel as any,
      targetFilter: (data.target_filter || {}) as TargetFilterInput,
      content: data.content,
      totalRecipients: data.total_recipients,
      successfulSends: data.successful_sends,
      failedSends: data.failed_sends,
      status: data.status as any,
      sentAt: data.sent_at,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, data: broadcast };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to get broadcast.", statusCode: 500 };
  }
}

/**
 * Creates a new broadcast draft. Calculates total recipients server-side.
 */
export async function createBroadcastDraft(
  input: CreateBroadcastInput,
  adminUserId?: string | null
): Promise<{ success: true; data: BroadcastListItem } | { success: false; error: string }> {
  try {
    const adminClient = createAdminClient();

    // 1. Resolve recipients server-side to calculate exact initial recipient count
    const recipients = await resolveBroadcastRecipients(input.targetFilter);
    const totalRecipients = recipients.length;

    // 2. Insert into broadcasts table
    const { data, error } = await adminClient
      .from("broadcasts")
      .insert({
        title: input.title,
        channel: input.channel,
        target_filter: input.targetFilter as any,
        content: input.content,
        total_recipients: totalRecipients,
        status: "draft",
        created_by: adminUserId || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error creating broadcast draft:", error);
      return { success: false, error: error?.message || "Failed to create draft." };
    }

    return {
      success: true,
      data: {
        id: data.id,
        title: data.title,
        channel: data.channel as any,
        targetFilter: (data.target_filter || {}) as TargetFilterInput,
        content: data.content,
        totalRecipients: data.total_recipients,
        successfulSends: data.successful_sends,
        failedSends: data.failed_sends,
        status: data.status as any,
        sentAt: data.sent_at,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create draft." };
  }
}

/**
 * Updates an existing draft broadcast. Rejects edit if already sent or processing.
 */
export async function updateBroadcast(
  id: string,
  input: UpdateBroadcastInput
): Promise<{ success: true; data: BroadcastListItem } | { success: false; error: string; statusCode: number }> {
  try {
    const adminClient = createAdminClient();

    // 1. Check existing record status
    const { data: existing, error: fetchErr } = await adminClient
      .from("broadcasts")
      .select("status, target_filter")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { success: false, error: "Broadcast not found", statusCode: 404 };
    }

    if (existing.status === "completed" || existing.status === "processing") {
      return {
        success: false,
        error: "Cannot edit a broadcast that has already been dispatched or is currently in progress.",
        statusCode: 400,
      };
    }

    const updates: any = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.channel !== undefined) updates.channel = input.channel;
    if (input.content !== undefined) updates.content = input.content;

    if (input.targetFilter !== undefined) {
      updates.target_filter = input.targetFilter;
      const recipients = await resolveBroadcastRecipients(input.targetFilter);
      updates.total_recipients = recipients.length;
    }

    const { data, error } = await adminClient
      .from("broadcasts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to update broadcast", statusCode: 500 };
    }

    return {
      success: true,
      data: {
        id: data.id,
        title: data.title,
        channel: data.channel as any,
        targetFilter: (data.target_filter || {}) as TargetFilterInput,
        content: data.content,
        totalRecipients: data.total_recipients,
        successfulSends: data.successful_sends,
        failedSends: data.failed_sends,
        status: data.status as any,
        sentAt: data.sent_at,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update broadcast.", statusCode: 500 };
  }
}

/**
 * Deletes a draft broadcast. Rejects deletion if broadcast was sent (audit record protection).
 */
export async function deleteBroadcast(
  id: string
): Promise<{ success: true } | { success: false; error: string; statusCode: number }> {
  try {
    const adminClient = createAdminClient();

    const { data: existing, error: fetchErr } = await adminClient
      .from("broadcasts")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { success: false, error: "Broadcast not found", statusCode: 404 };
    }

    if (existing.status === "completed" || existing.status === "processing") {
      return {
        success: false,
        error: "Cannot delete a sent broadcast. Sent broadcasts are permanent audit records.",
        statusCode: 400,
      };
    }

    const { error } = await adminClient.from("broadcasts").delete().eq("id", id);
    if (error) {
      return { success: false, error: error.message, statusCode: 500 };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete broadcast.", statusCode: 500 };
  }
}

/**
 * Sends a broadcast message to all resolved recipients.
 * Enforces duplicate send protection and uses the existing notification log system.
 */
export async function sendBroadcast(
  id: string,
  adminUserId?: string | null
): Promise<
  | {
      success: true;
      data: {
        broadcastId: string;
        totalRecipients: number;
        successfulSends: number;
        failedSends: number;
        status: string;
      };
    }
  | { success: false; error: string; statusCode: number }
> {
  const adminClient = createAdminClient();

  // 1. Fetch broadcast and lock against duplicate sends
  const { data: broadcast, error: fetchErr } = await adminClient
    .from("broadcasts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !broadcast) {
    return { success: false, error: "Broadcast not found", statusCode: 404 };
  }

  // Duplicate send prevention
  if (broadcast.status !== "draft" && broadcast.status !== "failed") {
    return {
      success: false,
      error: `Broadcast has already been sent or is currently in progress (status: ${broadcast.status}).`,
      statusCode: 400,
    };
  }

  // 2. Mark status as 'processing' immediately
  await adminClient
    .from("broadcasts")
    .update({ status: "processing" })
    .eq("id", id);

  const targetFilter = (broadcast.target_filter || {}) as TargetFilterInput;

  // 3. Resolve actual recipients server-side
  const recipients = await resolveBroadcastRecipients(targetFilter);
  const totalRecipients = recipients.length;

  if (totalRecipients === 0) {
    await adminClient
      .from("broadcasts")
      .update({
        status: "completed",
        total_recipients: 0,
        successful_sends: 0,
        failed_sends: 0,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    return {
      success: true,
      data: {
        broadcastId: id,
        totalRecipients: 0,
        successfulSends: 0,
        failedSends: 0,
        status: "completed",
      },
    };
  }

  let successfulSends = 0;
  let failedSends = 0;

  const defaultDate = targetFilter.date || "28 October 2026";
  const defaultTime = targetFilter.time || "6:30 PM – 8:30 PM";
  const defaultJoinLink = targetFilter.joinLink || "https://zoom.us/j/1234567890";
  const courseTitle = targetFilter.courseName || "The WATERCOLOUR Roadmap: One-Day Masterclass";
  const batchName = targetFilter.batchName || "Live Masterclass — 28 Oct 2026";

  const appSettings = await getSettings();

  // 4. Dispatch to each recipient sequentially
  for (const recipient of recipients) {
    try {
      // Resolve personalizations
      const recipientName = recipient.fullName || "Student";
      const resolvedSubject = (targetFilter.subject || "Studio Announcement")
        .replace(/\[Student Name\]|\{\{student_name\}\}/gi, recipientName)
        .replace(/\[Course Name\]|\{\{course_name\}\}/gi, recipient.courseTitle || courseTitle)
        .replace(/\[Batch Name\]|\{\{batch_name\}\}/gi, recipient.batchName || batchName)
        .replace(/\[Date\]|\{\{date\}\}/gi, recipient.startDate || defaultDate)
        .replace(/\[Time\]|\{\{time\}\}/gi, defaultTime)
        .replace(/\[Join Link\]|\[Zoom Link\]|\{\{zoom_link\}\}/gi, recipient.zoomJoinUrl || defaultJoinLink);

      // Clean unescaped newlines and replace template tags
      const cleanBody = broadcast.content
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\[Student Name\]|\{\{student_name\}\}/gi, recipientName)
        .replace(/\[Course Name\]|\{\{course_name\}\}/gi, recipient.courseTitle || courseTitle)
        .replace(/\[Batch Name\]|\{\{batch_name\}\}/gi, recipient.batchName || batchName)
        .replace(/\[Date\]|\{\{date\}\}/gi, recipient.startDate || defaultDate)
        .replace(/\[Time\]|\{\{time\}\}/gi, defaultTime)
        .replace(/\[Join Link\]|\[Zoom Link\]|\{\{zoom_link\}\}/gi, recipient.zoomJoinUrl || defaultJoinLink)
        .replace(/\[Booking Reference\]|\{\{booking_reference\}\}/gi, "N/A");

      // Format HTML with paragraphs for clean email presentation
      const paragraphs = cleanBody
        .split("\n\n")
        .map((p: string) => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #292524;">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px;">
          <div style="margin-bottom: 24px; border-bottom: 2px solid #f5f5f4; padding-bottom: 16px;">
            <h2 style="margin: 0; color: #1c1917; font-size: 20px;">${appSettings.studioName}</h2>
            <p style="margin: 4px 0 0 0; color: #78716c; font-size: 13px;">Announcements &amp; Updates</p>
          </div>
          <div>${paragraphs}</div>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f5f5f4; font-size: 12px; color: #a8a29e;">
            <p style="margin: 0;">Sent with warmth by ${appSettings.instructorName} • ${appSettings.studioName}</p>
          </div>
        </div>
      `;

      // Dispatch using existing Resend transport
      const sendResult = await sendTransactionalEmail({
        to: recipient.email,
        subject: resolvedSubject,
        html: emailHtml,
        text: cleanBody,
        replyTo: appSettings.replyToEmail || undefined,
      });

      if (sendResult.success) {
        successfulSends++;
        // Log in notification_logs
        await adminClient.from("notification_logs").insert({
          customer_id: recipient.customerId,
          channel: "email",
          message_type: "broadcast",
          provider_message_id: sendResult.providerMessageId || null,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      } else {
        failedSends++;
        await adminClient.from("notification_logs").insert({
          customer_id: recipient.customerId,
          channel: "email",
          message_type: "broadcast",
          status: "failed",
          error_message: sendResult.error || "Unknown delivery failure",
          sent_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      failedSends++;
      console.error(`Failed sending broadcast to ${recipient.email}:`, err);
    }
  }

  // 5. Update broadcast record with final stats
  const finalStatus =
    failedSends === totalRecipients && totalRecipients > 0
      ? "failed"
      : "completed";

  await adminClient
    .from("broadcasts")
    .update({
      total_recipients: totalRecipients,
      successful_sends: successfulSends,
      failed_sends: failedSends,
      status: finalStatus,
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);

  return {
    success: true,
    data: {
      broadcastId: id,
      totalRecipients,
      successfulSends,
      failedSends,
      status: finalStatus,
    },
  };
}
