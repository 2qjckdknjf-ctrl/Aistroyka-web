/**
 * Optional cron secret enforcement for /api/v1/jobs/process.
 * When REQUIRE_CRON_SECRET=true, requests must include x-cron-secret matching CRON_SECRET.
 */

import { NextResponse } from "next/server";

export const CRON_SECRET_HEADER = "x-cron-secret";
export const CRON_UNAUTHORIZED_CODE = "cron_unauthorized";

export function requireCronSecretIfEnabled(request: Request): NextResponse | null {
  if (process.env.REQUIRE_CRON_SECRET !== "true") return null;
  const expected = process.env.CRON_SECRET?.trim();
  const provided = request.headers.get(CRON_SECRET_HEADER)?.trim();
  if (!expected || provided !== expected) {
    return NextResponse.json(
      { error: "Unauthorized", code: CRON_UNAUTHORIZED_CODE },
      { status: 403 }
    );
  }
  return null;
}
