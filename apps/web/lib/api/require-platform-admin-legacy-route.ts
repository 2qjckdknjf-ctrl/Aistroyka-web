/**
 * P0 platform-admin boundary: legacy /api/v1/admin/* routes that perform
 * platform-wide actions must not be callable by tenant admins alone.
 * Requires platform_owner_grants (same source as /api/v1/owner/*).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest, getSessionUser } from "@/lib/supabase/server";
import { getPlatformOwnerGrant } from "@/lib/platform-owner/platform-owner-grant";

export const PLATFORM_ADMIN_REQUIRED_BODY = {
  error: "Platform owner access required",
  code: "platform_admin_required",
} as const;

/**
 * Returns 403 when the caller is not a platform owner grant holder.
 * Returns null when access is allowed.
 */
export async function requirePlatformOwnerLegacyAdminRoute(request: Request): Promise<NextResponse | null> {
  let supabase: Awaited<ReturnType<typeof createClientFromRequest>>;
  try {
    supabase = await createClientFromRequest(request);
  } catch {
    return NextResponse.json(PLATFORM_ADMIN_REQUIRED_BODY, { status: 403 });
  }

  const user = await getSessionUser(supabase);
  if (!user?.id) {
    return NextResponse.json(PLATFORM_ADMIN_REQUIRED_BODY, { status: 403 });
  }

  const grant = await getPlatformOwnerGrant(supabase, user.id);
  if (!grant.ok) {
    return NextResponse.json(PLATFORM_ADMIN_REQUIRED_BODY, { status: 403 });
  }

  return null;
}

/**
 * Cross-tenant cron routes: allow unauthenticated cron-secret callers;
 * block authenticated browser sessions without a platform owner grant.
 */
export async function blockAuthenticatedNonPlatformCronCaller(
  request: Request
): Promise<NextResponse | null> {
  let supabase: Awaited<ReturnType<typeof createClientFromRequest>>;
  try {
    supabase = await createClientFromRequest(request);
  } catch {
    return null;
  }

  const user = await getSessionUser(supabase);
  if (!user?.id) {
    return null;
  }

  const grant = await getPlatformOwnerGrant(supabase, user.id);
  if (!grant.ok) {
    return NextResponse.json(PLATFORM_ADMIN_REQUIRED_BODY, { status: 403 });
  }

  return null;
}
