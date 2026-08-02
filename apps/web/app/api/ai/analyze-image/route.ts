/**
 * Legacy analyze-image — lite clients forbidden; others redirect to canonical v1.
 */

import { redirectLegacyApiToV1 } from "@/lib/api/legacy-redirect";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/v1/ai/analyze-image */
export async function POST(request: Request) {
  return redirectLegacyApiToV1(request);
}
