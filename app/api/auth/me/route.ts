import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: No active administrator session found.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: session.adminProfile.id,
        email: session.adminProfile.email,
        role: session.adminProfile.role,
        full_name: session.adminProfile.full_name,
      },
    });
  } catch (error) {
    console.error("Auth me endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify administrator profile.",
      },
      { status: 500 }
    );
  }
}
