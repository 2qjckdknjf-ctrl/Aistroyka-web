import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/owner/critical/echo — requires full `OWNER` + `X-Owner-Step-Up` (see owner-step-up.ts).
 * Demonstrates critical mutation path; safe no-op body.
 */
export async function POST(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "critical" });
  if (!auth.ok) return auth.response;
  return NextResponse.json({ ok: true, echo: "critical_ack", userId: auth.userId });
}
