/**
 * GET /api/v1/health — canonical v1 health. Same logic as GET /api/health. Response validated by contract.
 */

import { NextResponse } from "next/server";
import { getHealthResponse } from "@/lib/controllers/health";
import { HealthResponseSchema } from "@aistroyka/contracts";
import { getServerConfig } from "@/lib/config/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { body, status } = await getHealthResponse();
  const parsed = HealthResponseSchema.safeParse(body);
  if (!parsed.success) {
    if (getServerConfig().NODE_ENV !== "test") {
      console.error("[v1/health] response contract validation failed", parsed.error.flatten());
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json(parsed.data, { status });
}
