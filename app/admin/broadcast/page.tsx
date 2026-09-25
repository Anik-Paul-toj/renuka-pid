import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBroadcastsList } from "@/lib/broadcast/service";
import { BroadcastManager } from "@/components/admin/broadcast/BroadcastManager";

export const dynamic = "force-dynamic";

export default async function AdminBroadcastPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  // Fetch initial broadcasts list
  const listRes = await getBroadcastsList({
    page: 1,
    limit: 20,
    search: "",
    status: "all",
    channel: "all",
  });

  const initialData = listRes.success
    ? listRes.data
    : {
        broadcasts: [],
        pagination: {
          totalCount: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };

  // Fetch courses and batches
  const adminClient = createAdminClient();
  const [{ data: courses }, { data: batches }] = await Promise.all([
    adminClient.from("courses").select("id, title").order("title"),
    adminClient
      .from("cohort_batches")
      .select("id, course_id, batch_name, start_date, start_time, end_time, zoom_join_url")
      .order("start_date", { ascending: false }),
  ]);

  return (
    <BroadcastManager
      initialData={initialData}
      courses={courses || []}
      batches={batches || []}
      userRole={session.adminProfile.role}
    />
  );
}
