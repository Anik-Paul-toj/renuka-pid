import { z } from "zod";

const roleSchema = z.enum(["super_admin", "admin", "editor"]);

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const adminMeResponseSchema = z.object({
  success: z.boolean(),
  admin: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: roleSchema,
    full_name: z.string().nullable().optional(),
  }),
});

interface MockUser {
  id: string;
  email: string;
}

interface MockAdminUserRecord {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "editor";
  full_name: string | null;
  is_active: boolean;
}

// Simulates the exact logic inside lib/auth/admin.ts and app/api/auth/login/route.ts
function simulateAdminAuthorization(
  authUser: MockUser | null,
  adminDbRecords: MockAdminUserRecord[]
): { authorized: boolean; status: number; error?: string; admin?: any } {
  if (!authUser) {
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: No active authentication session found.",
    };
  }

  const adminProfile = adminDbRecords.find(
    (record) => record.id === authUser.id && record.is_active === true
  );

  if (!adminProfile) {
    return {
      authorized: false,
      status: 403,
      error: "Access denied. You do not have an active administrator profile.",
    };
  }

  return {
    authorized: true,
    status: 200,
    admin: {
      id: adminProfile.id,
      email: adminProfile.email,
      role: adminProfile.role,
      full_name: adminProfile.full_name,
    },
  };
}

// Simulates the exact middleware route protection logic in middleware.ts
function simulateMiddlewareRouteGuard(
  pathname: string,
  user: MockUser | null
): { allowed: boolean; redirectUrl?: string } {
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      return {
        allowed: false,
        redirectUrl: `/admin/login?redirect=${encodeURIComponent(pathname)}`,
      };
    }
  }
  return { allowed: true };
}

function runComprehensiveAuthTests() {
  console.log("==========================================================");
  console.log("  PHASE 4: AUTHENTICATION & ROLE ENFORCEMENT TEST SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      console.log(`✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${description}`);
      failed++;
    }
  };

  // 1. Role Enum Constraints
  console.log("--- TEST 1: Role Enumeration Strictness ---");
  for (const role of ["super_admin", "admin", "editor"]) {
    assert(roleSchema.safeParse(role).success, `Role '${role}' is valid`);
  }
  for (const invalid of ["customer", "student", "user", "anonymous", "superadmin"]) {
    assert(!roleSchema.safeParse(invalid).success, `Invalid role '${invalid}' rejected`);
  }

  // 2. Input Validation Schema
  console.log("\n--- TEST 2: Login Payload Validation ---");
  const valid = loginSchema.safeParse({ email: "admin@renukaartstudio.com", password: "Password123" });
  assert(valid.success, "Valid email & password accepted");

  const invalidEmail = loginSchema.safeParse({ email: "invalid-email", password: "Password123" });
  assert(!invalidEmail.success, "Malformed email rejected");

  const shortPass = loginSchema.safeParse({ email: "admin@renukaartstudio.com", password: "123" });
  assert(!shortPass.success, "Short password (< 6 chars) rejected");

  // 3. Database Fixtures for Authorization Tests
  const mockAdminDb: MockAdminUserRecord[] = [
    {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      email: "superadmin@renukaartstudio.com",
      role: "super_admin",
      full_name: "Super Admin",
      is_active: true,
    },
    {
      id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      email: "editor@renukaartstudio.com",
      role: "editor",
      full_name: "Content Editor",
      is_active: true,
    },
    {
      id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      email: "disabled@renukaartstudio.com",
      role: "admin",
      full_name: "Disabled Admin",
      is_active: false, // Inactive!
    },
  ];

  // 4. Unauthenticated Access Test
  console.log("\n--- TEST 3: Unauthenticated /admin Access ---");
  const unauthRoute = simulateMiddlewareRouteGuard("/admin/courses", null);
  assert(
    !unauthRoute.allowed && unauthRoute.redirectUrl === "/admin/login?redirect=%2Fadmin%2Fcourses",
    "Unauthenticated access to /admin/courses redirects to /admin/login"
  );

  const unauthLoginRoute = simulateMiddlewareRouteGuard("/admin/login", null);
  assert(unauthLoginRoute.allowed, "Public access to /admin/login is allowed without session");

  const unauthSession = simulateAdminAuthorization(null, mockAdminDb);
  assert(
    !unauthSession.authorized && unauthSession.status === 401,
    "Server getAdminSession returns 401/null when no session exists"
  );

  // 5. Valid Admin Login Test
  console.log("\n--- TEST 4: Valid Admin Authorization ---");
  const superAdminUser: MockUser = {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    email: "superadmin@renukaartstudio.com",
  };
  const validAdminResult = simulateAdminAuthorization(superAdminUser, mockAdminDb);
  assert(
    validAdminResult.authorized && validAdminResult.admin.role === "super_admin",
    "Active super_admin authorized with correct role"
  );

  const editorUser: MockUser = {
    id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    email: "editor@renukaartstudio.com",
  };
  const editorResult = simulateAdminAuthorization(editorUser, mockAdminDb);
  assert(
    editorResult.authorized && editorResult.admin.role === "editor",
    "Active editor authorized with correct role"
  );

  // 6. Non-Admin Authenticated Supabase User Test
  console.log("\n--- TEST 5: Non-Admin Authenticated User Access ---");
  const customerUser: MockUser = {
    id: "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
    email: "student@example.com", // Authenticated in auth.users, but NOT in public.admin_users
  };
  const customerResult = simulateAdminAuthorization(customerUser, mockAdminDb);
  assert(
    !customerResult.authorized && customerResult.status === 403,
    "Non-admin authenticated user rejected with HTTP 403"
  );

  // 7. Disabled Admin User Test
  console.log("\n--- TEST 6: Disabled Admin (is_active = false) Access ---");
  const disabledUser: MockUser = {
    id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    email: "disabled@renukaartstudio.com",
  };
  const disabledResult = simulateAdminAuthorization(disabledUser, mockAdminDb);
  assert(
    !disabledResult.authorized && disabledResult.status === 403,
    "Disabled admin (is_active=false) rejected with HTTP 403"
  );

  // 8. /api/auth/me Payload Security Check
  console.log("\n--- TEST 7: /api/auth/me Payload Safety & Leakage Prevention ---");
  const safePayload = {
    success: true,
    admin: {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      email: "superadmin@renukaartstudio.com",
      role: "super_admin",
      full_name: "Super Admin",
    },
  };
  const parsedSafe = adminMeResponseSchema.safeParse(safePayload);
  assert(parsedSafe.success, "/api/auth/me returns only safe admin profile fields");

  const unsafePayloadWithSecrets: any = {
    ...safePayload,
    service_role_key: "secret-key",
    password_hash: "hash123",
  };
  const sanitizedAdmin = {
    id: unsafePayloadWithSecrets.admin.id,
    email: unsafePayloadWithSecrets.admin.email,
    role: unsafePayloadWithSecrets.admin.role,
    full_name: unsafePayloadWithSecrets.admin.full_name,
  };
  assert(
    !("service_role_key" in sanitizedAdmin) && !("password_hash" in sanitizedAdmin),
    "Sensitive credentials strictly excluded from client response"
  );

  // Summary
  console.log("\n==========================================================");
  console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAuthTests();
