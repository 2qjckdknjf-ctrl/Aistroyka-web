/**
 * Readiness/health check for the unified system (site + engine + AI).
 * GET /api/health → same as v1. Delegates to shared controller.
 */

import { NextResponse } from "next/server";
import { getHealthResponse } from "@/lib/controllers/health";
import { setLegacyApiHeaders } from "@/lib/api/deprecation-headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { body, status } = await getHealthResponse();
  const res = NextResponse.json(body, { status });
  res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.headers.set("CDN-Cache-Control", "no-store");
  res.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  setLegacyApiHeaders(res.headers);
  res.headers.set("Link", "</api/v1/health>; rel=\"successor\"");
  return res;
}
