import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isConfigured = Boolean(supabaseUrl && supabaseKey);
  const isServiceRoleConfigured = Boolean(serviceRoleKey);

  const healthData = {
    success: true,
    status: isConfigured ? "configured" : "pending_environment_variables",
    environment: {
      supabase_url_configured: Boolean(supabaseUrl),
      supabase_key_configured: Boolean(supabaseKey),
      supabase_service_role_configured: isServiceRoleConfigured,
      node_env: process.env.NODE_ENV || "development",
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(healthData, {
    status: isConfigured ? 200 : 503,
  });
}
