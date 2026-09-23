import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { CMSSectionKey } from "@/lib/types/cms";
import { sectionSchemaMap } from "@/lib/validations/cms";
import { z } from "zod";

export const dynamic = "force-dynamic";

const VALID_SECTION_KEYS = Object.keys(sectionSchemaMap) as CMSSectionKey[];

const putActionSchema = z.object({
  action: z.enum(["save_draft", "publish", "discard_draft"]),
  content: z.unknown().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectionKey: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access section CMS.",
          },
        },
        { status: 401 }
      );
    }

    const { sectionKey } = await params;
    if (!VALID_SECTION_KEYS.includes(sectionKey as CMSSectionKey)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SECTION_KEY",
            message: `Section key '${sectionKey}' is not recognized.`,
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: rows, error: dbError } = await supabase
      .from("landing_content")
      .select("id, section_key, content_json, status, version, published_at, published_by, updated_at")
      .eq("section_key", sectionKey)
      .in("status", ["published", "draft"])
      .order("version", { ascending: false });

    if (dbError) {
      console.error(`Error fetching section '${sectionKey}':`, dbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DB_ERROR",
            message: "Failed to retrieve section content.",
          },
        },
        { status: 500 }
      );
    }

    const publishedRecord = rows?.find((r) => r.status === "published") || null;
    const draftRecord = rows?.find((r) => r.status === "draft") || null;

    return NextResponse.json({
      success: true,
      data: {
        section_key: sectionKey,
        published: publishedRecord ? publishedRecord.content_json : null,
        published_version: publishedRecord ? publishedRecord.version : null,
        last_published_at: publishedRecord ? publishedRecord.published_at : null,
        draft: draftRecord ? draftRecord.content_json : null,
        draft_version: draftRecord ? draftRecord.version : null,
        has_draft: !!draftRecord,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/landing-content/[sectionKey] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sectionKey: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to update CMS content.",
          },
        },
        { status: 401 }
      );
    }

    const { sectionKey } = await params;
    if (!VALID_SECTION_KEYS.includes(sectionKey as CMSSectionKey)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SECTION_KEY",
            message: `Section key '${sectionKey}' is not valid.`,
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const actionParsed = putActionSchema.safeParse(body);

    if (!actionParsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Invalid action payload. Must specify action: 'save_draft' | 'publish' | 'discard_draft'.",
          },
        },
        { status: 400 }
      );
    }

    const { action, content } = actionParsed.data;
    const { user, adminProfile } = session;

    // Role Enforcement: Publishing requires admin or super_admin
    if (action === "publish" && !["admin", "super_admin"].includes(adminProfile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Insufficient permissions. Only administrators can publish live content.",
          },
        },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // 1. Handle Discard Draft
    if (action === "discard_draft") {
      const { error: deleteError } = await supabase
        .from("landing_content")
        .delete()
        .eq("section_key", sectionKey)
        .eq("status", "draft");

      if (deleteError) {
        console.error("Discard draft DB error:", deleteError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DB_ERROR",
              message: "Failed to discard draft record.",
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          section_key: sectionKey,
          message: "Draft discarded successfully.",
        },
      });
    }

    // 2. Validate Content Schema for Save Draft or Publish
    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_CONTENT",
            message: "Content payload is required for this action.",
          },
        },
        { status: 400 }
      );
    }

    const schema = sectionSchemaMap[sectionKey as CMSSectionKey];
    const validation = schema.safeParse(content);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "Content payload failed schema validation.",
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const validatedContent = validation.data;

    // Query existing records to calculate versions
    const { data: existingRows, error: fetchErr } = await supabase
      .from("landing_content")
      .select("id, status, version")
      .eq("section_key", sectionKey)
      .in("status", ["published", "draft"]);

    if (fetchErr) {
      console.error("Fetch existing records error:", fetchErr);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DB_ERROR",
            message: "Failed to read existing section state.",
          },
        },
        { status: 500 }
      );
    }

    const publishedRecord = existingRows?.find((r) => r.status === "published");
    const draftRecord = existingRows?.find((r) => r.status === "draft");

    // 3. Save Draft
    if (action === "save_draft") {
      if (draftRecord) {
        // Update existing draft
        const { data: updated, error: updateErr } = await supabase
          .from("landing_content")
          .update({
            content_json: validatedContent,
            version: draftRecord.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draftRecord.id)
          .select("id, version, updated_at")
          .single();

        if (updateErr) {
          console.error("Update draft error:", updateErr);
          return NextResponse.json(
            {
              success: false,
              error: { code: "DB_ERROR", message: "Failed to save draft update." },
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            section_key: sectionKey,
            status: "draft",
            version: updated.version,
            message: "Draft saved successfully.",
          },
        });
      } else {
        // Create new draft
        const nextVersion = (publishedRecord?.version || 0) + 1;
        const { data: inserted, error: insertErr } = await supabase
          .from("landing_content")
          .insert({
            section_key: sectionKey,
            content_json: validatedContent,
            status: "draft",
            version: nextVersion,
            created_by: user.id,
          })
          .select("id, version, updated_at")
          .single();

        if (insertErr) {
          console.error("Insert draft error:", insertErr);
          return NextResponse.json(
            {
              success: false,
              error: { code: "DB_ERROR", message: "Failed to create draft." },
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            section_key: sectionKey,
            status: "draft",
            version: inserted.version,
            message: "Draft created successfully.",
          },
        });
      }
    }

    // 4. Publish (Atomic update of published record + draft cleanup)
    if (action === "publish") {
      const nowIso = new Date().toISOString();

      if (publishedRecord) {
        // Atomic in-place update on published row (never leaves 0 published rows)
        const { data: updatedPub, error: pubErr } = await supabase
          .from("landing_content")
          .update({
            content_json: validatedContent,
            version: publishedRecord.version + 1,
            published_at: nowIso,
            published_by: user.id,
            updated_at: nowIso,
          })
          .eq("id", publishedRecord.id)
          .select("id, version, published_at")
          .single();

        if (pubErr) {
          console.error("Publish update error:", pubErr);
          return NextResponse.json(
            {
              success: false,
              error: { code: "DB_ERROR", message: "Failed to publish content changes." },
            },
            { status: 500 }
          );
        }

        // Clean up any remaining draft record
        if (draftRecord) {
          await supabase
            .from("landing_content")
            .delete()
            .eq("id", draftRecord.id);
        }

        return NextResponse.json({
          success: true,
          data: {
            section_key: sectionKey,
            status: "published",
            version: updatedPub.version,
            published_at: updatedPub.published_at,
            message: "Content published successfully.",
          },
        });
      } else {
        // Insert new published record
        const { data: insertedPub, error: insErr } = await supabase
          .from("landing_content")
          .insert({
            section_key: sectionKey,
            content_json: validatedContent,
            status: "published",
            version: 1,
            published_at: nowIso,
            published_by: user.id,
          })
          .select("id, version, published_at")
          .single();

        if (insErr) {
          console.error("Insert published error:", insErr);
          return NextResponse.json(
            {
              success: false,
              error: { code: "DB_ERROR", message: "Failed to publish new section." },
            },
            { status: 500 }
          );
        }

        if (draftRecord) {
          await supabase
            .from("landing_content")
            .delete()
            .eq("id", draftRecord.id);
        }

        return NextResponse.json({
          success: true,
          data: {
            section_key: sectionKey,
            status: "published",
            version: insertedPub.version,
            published_at: insertedPub.published_at,
            message: "Section published successfully.",
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "UNSUPPORTED_ACTION", message: "Unsupported action." },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("PUT /api/admin/landing-content/[sectionKey] unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while updating CMS content.",
        },
      },
      { status: 500 }
    );
  }
}
