/**
 * Middleware stakeholder page gate: identify portal-only stakeholders and redirect
 * blocked dashboard/portal/internal paths via redirectIfStakeholderBlockedPath.
 *
 * Fail-closed for identified stakeholders (blocked paths always redirect).
 * Role-lookup errors do not globally lock non-stakeholders (avoids outage lockout).
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, hasSupabaseEnv } from "@/lib/env";
import { getActiveTenantRoleForUser } from "./tenant-role.server";
import { redirectIfStakeholderBlockedPath } from "./stakeholder-dashboard-paths";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function resolveStakeholderPageRedirect(input: {
  request: NextRequest;
  sessionResponse: NextResponse;
  userId: string;
  pathWithoutLocale: string;
  locale: string;
}): Promise<NextResponse | null> {
  const { request, sessionResponse, userId, pathWithoutLocale, locale } = input;
  if (!hasSupabaseEnv()) return null;

  try {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();
    const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            options != null
              ? sessionResponse.cookies.set(name, value, options as never)
              : sessionResponse.cookies.set(name, value)
          );
        },
      },
    });

    const role = await getActiveTenantRoleForUser(supabase, userId, request);
    if (role !== "stakeholder") return null;

    return redirectIfStakeholderBlockedPath(pathWithoutLocale, locale, request.url);
  } catch {
    return null;
  }
}
