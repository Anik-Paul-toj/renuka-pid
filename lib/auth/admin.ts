import "server-only";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/types/database";

export interface AdminProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  is_active: boolean;
}

export interface AdminSession {
  user: {
    id: string;
    email: string;
  };
  adminProfile: AdminProfile;
}

/**
 * Authoritative Server-Side Admin Session Guard.
 * 
 * Verifies both:
 * 1. An authenticated Supabase Auth user session exists.
 * 2. An active record exists in `public.admin_users` with `is_active = true`.
 * 
 * A standard authenticated customer who is not in `public.admin_users`
 * (or whose account is disabled) will always return null.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return null;
    }

    // Authoritative check against public.admin_users
    const { data: adminProfile, error: profileError } = await supabase
      .from("admin_users")
      .select("id, email, role, full_name, is_active")
      .eq("id", user.id)
      .eq("is_active", true)
      .single();

    if (profileError || !adminProfile) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      adminProfile: {
        id: adminProfile.id,
        email: adminProfile.email,
        role: adminProfile.role as UserRole,
        full_name: adminProfile.full_name,
        is_active: adminProfile.is_active,
      },
    };
  } catch (error) {
    console.error("Error evaluating admin session:", error);
    return null;
  }
}
