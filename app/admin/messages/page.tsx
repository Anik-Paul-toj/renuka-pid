import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { MessagesHub } from "@/components/admin/messages/MessagesHub";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Fetch active courses and batches for dropdowns
  const adminClient = createAdminClient();
  const [{ data: courses }, { data: batches }] = await Promise.all([
    adminClient
      .from("courses")
      .select("id, title")
      .order("title"),
    adminClient
      .from("cohort_batches")
      .select("id, course_id, batch_name, start_date, start_time, end_time, timezone, zoom_join_url")
      .order("start_date", { ascending: false }),
  ]);

  return (
    <MessagesHub
      courses={courses || []}
      batches={batches || []}
      userRole={session.adminProfile.role}
    />
  );
}
