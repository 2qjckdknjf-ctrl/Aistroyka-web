/**
 * Admin access: allowlist by email (env ADMIN_EMAILS, comma-separated).
 * No new roles table. Server-side only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const ADMIN_EMAILS_KEY = "ADMIN_EMAILS";

function getAdminEmails(): string[] {
  const raw = process.env[ADMIN_EMAILS_KEY];
  if (typeof raw !== "string" || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true if the current user's email is in ADMIN_EMAILS.
 * Call from server (page/layout/route) only.
 */
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const allowlist = getAdminEmails();
  if (allowlist.length === 0) return false;
  return allowlist.includes(user.email.toLowerCase());
}
