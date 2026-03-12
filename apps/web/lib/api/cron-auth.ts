/**
 * Cron secret enforcement for /api/v1/admin/jobs/cron-tick and /api/v1/jobs/process.
 * Production should set REQUIRE_CRON_SECRET=true and CRON_SECRET.
 * When required, missing or invalid secret returns 403 with clear error.
 */

import { NextResponse } from "next/server";

export const CRON_SECRET_HEADER = "x-cron-secret";
export const CRON_UNAUTHORIZED_CODE = "cron_unauthorized";
/** When REQUIRE_CRON_SECRET=true but CRON_SECRET is not set (server misconfiguration). */
export const CRON_MISCONFIGURED_CODE = "cron_secret_misconfigured";

export function isCronSecretRequired(): boolean {
  return process.env.REQUIRE_CRON_SECRET === "true";
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
