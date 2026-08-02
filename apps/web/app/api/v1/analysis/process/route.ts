/**
 * POST /api/v1/analysis/process — tenant-scoped analysis job processing (canonical).
 */

import { handleAnalysisProcessPost } from "@/lib/ai/analysis-process.http";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/analysis/process";
const RATE_LIMIT_ENDPOINT = "/api/v1/analysis/process";

export async function POST(request: Request) {
  return handleAnalysisProcessPost(request, {
    routeKey: ROUTE_KEY,
    rateLimitEndpoint: RATE_LIMIT_ENDPOINT,
    legacy: false,
  });
}
