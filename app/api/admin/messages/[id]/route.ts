import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { updateMessageTemplateSchema } from "@/lib/validations/message-admin";
import {
  getMessageTemplateById,
  updateMessageTemplate,
} from "@/lib/messages-admin/service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate Admin Session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access message template details.",
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Template identifier parameter is required.",
          },
        },
        { status: 400 }
      );
    }

    // 2. Query Message Template
    const result = await getMessageTemplateById(id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.statusCode === 404 ? "TEMPLATE_NOT_FOUND" : "DB_ERROR",
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
    console.error("GET /api/admin/messages/[id] unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching message template.",
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate Admin Session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to update message templates.",
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

    // 2. Role-Based Access Control: Editors cannot modify templates
    const allowedRoles = ["admin", "super_admin"];
    if (!allowedRoles.includes(session.adminProfile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Editors have read-only access and cannot modify message templates.",
          },
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Template identifier parameter is required.",
          },
        },
        { status: 400 }
      );
    }

    // 3. Parse and Validate Request Body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Request body must be a valid JSON object.",
          },
        },
        { status: 400 }
      );
    }

    const validationResult = updateMessageTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: issue
              ? `${issue.path.join(".")}: ${issue.message}`
              : "Invalid template update parameters.",
          },
        },
        { status: 400 }
      );
    }

    // 4. Update Template in Database
    const result = await updateMessageTemplate(id, validationResult.data);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.statusCode === 404 ? "TEMPLATE_NOT_FOUND" : "UPDATE_ERROR",
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
    console.error("PUT /api/admin/messages/[id] unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while updating message template.",
        },
      },
      { status: 500 }
    );
  }
}

// Allow PATCH as well for convenience
export const PATCH = PUT;
