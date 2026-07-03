import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/owner/health — read-only; any tiered owner role may call. */
export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;
  return NextResponse.json({ ok: true, userId: auth.userId, role: auth.role });
}
