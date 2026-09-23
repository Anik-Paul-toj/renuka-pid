import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { CMSSectionKey } from "@/lib/types/cms";
import { sectionSchemaMap } from "@/lib/validations/cms";
import { CMSManager, SectionMeta } from "@/components/admin/cms/CMSManager";

export const dynamic = "force-dynamic";

const VALID_SECTION_KEYS = Object.keys(sectionSchemaMap) as CMSSectionKey[];

export default async function AdminLandingPageCMS() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const supabase = await createClient();

  // Load landing_content records directly on the server
  const { data: rows, error: dbError } = await supabase
    .from("landing_content")
    .select("id, section_key, content_json, status, version, published_at, published_by, updated_at")
    .order("section_key", { ascending: true })
    .order("version", { ascending: false });

  const sectionMap: Record<string, SectionMeta> = {};

  for (const key of VALID_SECTION_KEYS) {
    sectionMap[key] = {
      section_key: key,
      published: null,
      draft: null,
      published_version: null,
      draft_version: null,
      last_published_at: null,
      has_draft: false,
    };
  }

  if (rows) {
    for (const row of rows) {
      const key = row.section_key as CMSSectionKey;
      if (!sectionMap[key]) continue;

      if (row.status === "published" && !sectionMap[key].published) {
        sectionMap[key].published = row.content_json;
        sectionMap[key].published_version = row.version;
        sectionMap[key].last_published_at = row.published_at;
      } else if (row.status === "draft" && !sectionMap[key].draft) {
        sectionMap[key].draft = row.content_json;
        sectionMap[key].draft_version = row.version;
        sectionMap[key].has_draft = true;
      }
    }
  }

  const initialSections = Object.values(sectionMap);

  return (
    <CMSManager
      initialSections={initialSections}
      adminProfile={session.adminProfile}
    />
  );
}
