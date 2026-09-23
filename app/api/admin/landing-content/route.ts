import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { CMSSectionKey } from "@/lib/types/cms";
import { sectionSchemaMap } from "@/lib/validations/cms";

export const dynamic = "force-dynamic";

const VALID_SECTION_KEYS = Object.keys(sectionSchemaMap) as CMSSectionKey[];

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access CMS records.",
          },
        },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch all landing_content records
    const { data: rows, error: dbError } = await supabase
      .from("landing_content")
      .select("id, section_key, content_json, status, version, published_at, published_by, updated_at, created_at")
      .order("section_key", { ascending: true })
      .order("version", { ascending: false });

    if (dbError) {
      console.error("Error fetching landing_content in admin API:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DB_ERROR",
            message: "Failed to retrieve landing content records.",
          },
        },
        { status: 500 }
      );
    }

    // Group records by section_key into published & active draft
    const sectionMap: Record<
      string,
      {
        section_key: string;
        published: any | null;
        draft: any | null;
        published_version: number | null;
        draft_version: number | null;
        last_published_at: string | null;
        has_draft: boolean;
      }
    > = {};

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
        if (!sectionMap[row.section_key]) continue;

        if (row.status === "published" && !sectionMap[row.section_key].published) {
          sectionMap[row.section_key].published = row.content_json;
          sectionMap[row.section_key].published_version = row.version;
          sectionMap[row.section_key].last_published_at = row.published_at;
        } else if (row.status === "draft" && !sectionMap[row.section_key].draft) {
          sectionMap[row.section_key].draft = row.content_json;
          sectionMap[row.section_key].draft_version = row.version;
          sectionMap[row.section_key].has_draft = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sections: Object.values(sectionMap),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/landing-content unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching CMS sections.",
        },
      },
      { status: 500 }
    );
  }
}
