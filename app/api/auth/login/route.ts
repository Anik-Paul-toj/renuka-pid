import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || "Invalid input data.",
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const supabase = await createClient();

    // 1. Authenticate against Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // 2. Authoritative check: User MUST exist in public.admin_users and be active
    const { data: adminProfile, error: profileError } = await supabase
      .from("admin_users")
      .select("id, email, role, full_name, is_active")
      .eq("id", authData.user.id)
      .eq("is_active", true)
      .single();

    if (profileError || !adminProfile) {
      // Sign out immediately to invalidate session cookies for unauthorized users
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          error: "Access denied. You do not have an active administrator profile.",
        },
        { status: 403 }
      );
    }

    // 3. Return safe admin profile snapshot
    return NextResponse.json({
      success: true,
      admin: {
        id: adminProfile.id,
        email: adminProfile.email,
        role: adminProfile.role,
        full_name: adminProfile.full_name,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during authentication.",
      },
      { status: 500 }
    );
  }
}
