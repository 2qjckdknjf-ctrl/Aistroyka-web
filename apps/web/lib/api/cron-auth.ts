/**
 * Cron secret enforcement for /api/v1/admin/jobs/cron-tick and /api/v1/jobs/process.
 * Deployed environments must set CRON_SECRET and pass x-cron-secret.
 * When required, missing or invalid secret returns 403 with clear error.
 */

import { NextResponse } from "next/server";

export const CRON_SECRET_HEADER = "x-cron-secret";
export const CRON_UNAUTHORIZED_CODE = "cron_unauthorized";
/** When REQUIRE_CRON_SECRET=true but CRON_SECRET is not set (server misconfiguration). */
export const CRON_MISCONFIGURED_CODE = "cron_secret_misconfigured";

function isDeployedRuntime(): boolean {
  const nodeEnv = (process.env.NODE_ENV ?? "").trim().toLowerCase();
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV ?? "").trim().toLowerCase();
  return nodeEnv === "production" || appEnv === "production" || appEnv === "staging";
}

export function isCronSecretRequired(): boolean {
  if (isDeployedRuntime()) return true;
  const explicit = process.env.REQUIRE_CRON_SECRET;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return false;
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
