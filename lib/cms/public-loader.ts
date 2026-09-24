import { createClient } from "@supabase/supabase-js";
import { masterclassData, MasterclassData } from "@/data/content";
import { sectionSchemaMap } from "@/lib/validations/cms";

// Create public client for server-side loading (no service role key)
function getPublicSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pwhtvzvtpwexxfsgfrxf.supabase.co";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_M99xxZ_T9Hh413smmntC_A_YwEl6Ypl";

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Server-side public loader for landing page content.
 * 
 * Features:
 * 1. Single batch query for all published sections.
 * 2. Section-by-section safe fallback: if any section is missing or invalid,
 *    it gracefully falls back to the client-approved baseline in `data/content.ts`.
 * 3. Complete system fallback: if Supabase is down, returns `masterclassData` with zero downtime.
 * 4. Strictly loads `status = 'published'` — drafts are never exposed.
 */
export async function getPublicLandingContent(): Promise<MasterclassData> {
  try {
    const supabase = getPublicSupabase();

    const { data: rows, error } = await supabase
      .from("landing_content")
      .select("section_key, content_json")
      .eq("status", "published");

    if (error || !rows || rows.length === 0) {
      console.warn("Public CMS loader: Supabase published content query returned error or empty, using baseline fallback:", error?.message);
      return masterclassData;
    }

    const rowMap = new Map<string, any>();
    for (const row of rows) {
      rowMap.set(row.section_key, row.content_json);
    }

    // Build complete MasterclassData with section-level safe fallback
    const result: any = { ...masterclassData };

    const canonicalKeys = Object.keys(sectionSchemaMap) as (keyof MasterclassData)[];

    for (const key of canonicalKeys) {
      const rawContent = rowMap.get(key);
      const schema = sectionSchemaMap[key as keyof typeof sectionSchemaMap];

      if (!rawContent || !schema) {
        result[key] = masterclassData[key];
        continue;
      }

      // Validate section content with Zod
      const parseResult = schema.safeParse(rawContent);
      if (parseResult.success) {
        result[key] = parseResult.data;
      } else {
        console.warn(`Public CMS loader: Section '${key}' failed validation, falling back to baseline:`, parseResult.error.issues[0]?.message);
        result[key] = masterclassData[key];
      }
    }

    return result as MasterclassData;
  } catch (err) {
    console.error("Public CMS loader unexpected exception, using complete baseline fallback:", err);
    return masterclassData;
  }
}
