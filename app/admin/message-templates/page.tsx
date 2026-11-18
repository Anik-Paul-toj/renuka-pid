import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { listTemplates } from "@/lib/whatsapp/template-management";
import { TemplateManager } from "@/components/admin/templates/TemplateManager";

export const dynamic = "force-dynamic";

export default async function AdminMessageTemplatesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const adminClient = createAdminClient();
  const [templates, { data: courses }] = await Promise.all([
    listTemplates(),
    adminClient.from("courses").select("id, title, slug").order("title"),
  ]);

  return (
    <TemplateManager
      initialTemplates={templates}
      courses={courses || []}
      userRole={session.adminProfile.role}
    />
  );
}
