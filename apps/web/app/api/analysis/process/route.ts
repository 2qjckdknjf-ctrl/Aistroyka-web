/**
 * Legacy POST /api/analysis/process — delegates to the same tenant-scoped handler as v1.
 * Deprecation headers are applied by the shared handler when legacy=true.
 * Lite clients are denied in-handler (legacy paths bypass v1 middleware allow-list).
 */

import { handleAnalysisProcessPost } from "@/lib/ai/analysis-process.http";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/analysis/process";
const RATE_LIMIT_ENDPOINT = "/api/analysis/process";

export async function POST(request: Request) {
  return handleAnalysisProcessPost(request, {
    routeKey: ROUTE_KEY,
    rateLimitEndpoint: RATE_LIMIT_ENDPOINT,
    legacy: true,
  });
}
