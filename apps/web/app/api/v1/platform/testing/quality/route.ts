import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { buildRomaQualityDashboard } from "@/lib/platform-admin/roma-quality-dashboard.service";

export const dynamic = "force-dynamic";

/** GET /api/v1/platform/testing/quality — read-only live quality dashboard data. */
export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

  const dashboard = await buildRomaQualityDashboard();
  return NextResponse.json({ data: dashboard });
}
