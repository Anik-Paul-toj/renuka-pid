import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates an elevated Supabase client with the service role key.
 * Strictly guarded with `import "server-only"` to prevent client bundle inclusion.
 * Used exclusively for administrative mutations, webhooks, and background jobs.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined on the server."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
