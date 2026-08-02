/**
 * Legacy alias for incoming webhooks.
 * Delegate once to canonical v1 — do not redirect (providers may not follow 307;
 * signature verification needs the original unread body).
 */

import { applyLegacyDeprecationHeaders } from "@/lib/api/legacy-redirect";
import { POST as v1Post } from "@/app/api/v1/webhooks/incoming/route";

export const dynamic = "force-dynamic";

const CANONICAL_PATH = "/api/v1/webhooks/incoming";

/** @deprecated Use POST /api/v1/webhooks/incoming */
export async function POST(request: Request) {
  const res = await v1Post(request);
  return applyLegacyDeprecationHeaders(res, CANONICAL_PATH);
}
