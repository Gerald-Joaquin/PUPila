import { createClient } from "@supabase/supabase-js"

// ── Credentials (API routes only — never import in client components) ──
const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ""

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""

// Service-role key — bypasses ALL RLS policies.
// Only used server-side; never sent to the browser.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

/** true when real Supabase credentials are present */
export const supabaseReady =
  supabaseUrl.startsWith("https://") && supabaseAnonKey.length > 10

const PLACEHOLDER_URL = "https://placeholder.supabase.co"
const PLACEHOLDER_KEY = "placeholder"

/**
 * Standard anon client — subject to RLS.
 * Suitable for reads that don't require a specific user identity.
 * For student-owned reads use createUserClient() instead.
 */
export const supabase = createClient(
  supabaseUrl || PLACEHOLDER_URL,
  supabaseAnonKey || PLACEHOLDER_KEY,
)

/**
 * Admin client — uses the service-role key, bypasses RLS entirely.
 * Use for all server-side writes (enrollments, subjects, etc.).
 * Falls back to the anon key when the service-role key is not yet configured
 * (will be blocked by RLS — fill in SUPABASE_SERVICE_ROLE_KEY to fix this).
 */
export const supabaseAdmin = createClient(
  supabaseUrl || PLACEHOLDER_URL,
  (supabaseServiceKey || supabaseAnonKey) || PLACEHOLDER_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
)

/**
 * Create a per-request Supabase client that forwards the student's JWT.
 * RLS policies that check auth.uid() will resolve correctly.
 *
 * Usage:
 *   const userClient = createUserClient(accessToken)
 *   const { data } = await userClient.from("enrollments").select(...)
 */
export function createUserClient(accessToken: string) {
  return createClient(
    supabaseUrl || PLACEHOLDER_URL,
    supabaseAnonKey || PLACEHOLDER_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  )
}

/**
 * Verify a student's access token using the admin client and return the
 * authenticated user, or null if the token is missing / invalid.
 */
export async function verifyToken(
  authHeader: string | null
): Promise<{ id: string } | null> {
  if (!supabaseReady) return null
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim()
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return null
  return { id: data.user.id }
}

/**
 * Check whether a verified user has the "admin" role in the profiles table.
 * Used by admin-only API routes instead of trusting the x-demo-role header.
 */
export async function isAdminUser(
  authHeader: string | null
): Promise<boolean> {
  if (!supabaseReady) return false
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim()
  if (!token) return false
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !userData?.user) return false
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle()
  return profile?.role === "admin"
}
