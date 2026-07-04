import { NextResponse } from "next/server";
import { buildSafeReadonlyAuditRefreshResponse } from "@/lib/platform-admin/roma-safe-readonly-audit";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";

export const dynamic = "force-dynamic";

/** POST /api/v1/platform/testing/safe-audit/refresh — recompute read-only safe audit (owner only). */
export async function POST(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

  const payload = await buildSafeReadonlyAuditRefreshResponse();
  return NextResponse.json({ data: payload });
}
