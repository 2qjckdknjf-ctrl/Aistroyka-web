/**
 * Cron secret enforcement for /api/v1/admin/jobs/cron-tick and /api/v1/jobs/process.
 * Production and staging must fail closed (REQUIRE_CRON_SECRET + CRON_SECRET).
 * When required, missing or invalid secret returns 403/503 with clear error.
 *
 * Public deploy environments (NEXT_PUBLIC_APP_ENV=staging|production) never honor
 * REQUIRE_CRON_SECRET=false — that override previously left staging.aistroyka.ai
 * as an unauthenticated cross-tenant job trigger against the live Supabase project.
 */

import { NextResponse } from "next/server";

export const CRON_SECRET_HEADER = "x-cron-secret";
export const CRON_UNAUTHORIZED_CODE = "cron_unauthorized";
/** When REQUIRE_CRON_SECRET=true but CRON_SECRET is not set (server misconfiguration). */
export const CRON_MISCONFIGURED_CODE = "cron_secret_misconfigured";

function isPublicDeployAppEnv(): boolean {
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV ?? "").trim().toLowerCase();
  return appEnv === "staging" || appEnv === "production";
}

export function isCronSecretRequired(): boolean {
  if (isPublicDeployAppEnv()) return true;
  const explicit = process.env.REQUIRE_CRON_SECRET;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function requireCronSecretIfEnabled(request: Request): NextResponse | null {
  if (!isCronSecretRequired()) return null;
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      {
        error: "Cron secret is required (REQUIRE_CRON_SECRET=true) but CRON_SECRET is not set. Set CRON_SECRET in environment.",
        code: CRON_MISCONFIGURED_CODE,
      },
      { status: 503 }
    );
  }
  const provided = request.headers.get(CRON_SECRET_HEADER)?.trim();
  if (provided !== expected) {
    return NextResponse.json(
      { error: "Unauthorized", code: CRON_UNAUTHORIZED_CODE },
      { status: 403 }
    );
  }
  return null;
}
