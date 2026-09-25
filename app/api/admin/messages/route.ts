import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { adminMessagesQuerySchema } from "@/lib/validations/message-admin";
import { getMessageTemplatesList } from "@/lib/messages-admin/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate Admin Session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access message templates.",
          },
        },
        { status: 401 }
      );
    }

    if (!session.adminProfile?.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin account is inactive.",
          },
        },
        { status: 403 }
      );
    }

    // 2. Parse & Validate Query Parameters
    const url = new URL(request.url);
    const rawParams = {
      search: url.searchParams.get("search") || "",
      channel: url.searchParams.get("channel") || "all",
      status: url.searchParams.get("status") || "all",
    };

    const validationResult = adminMessagesQuerySchema.safeParse(rawParams);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: issue
              ? `${issue.path.join(".")}: ${issue.message}`
              : "Invalid query parameters.",
          },
        },
        { status: 400 }
      );
    }

    // 3. Query Message Templates List
    const result = await getMessageTemplatesList(validationResult.data);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DB_ERROR",
            message: result.error,
          },
        },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /api/admin/messages unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while querying message templates.",
        },
      },
      { status: 500 }
    );
  }
}
