/**
 * Legacy poll-status — lite clients forbidden; others redirect to canonical v1.
 */

import { redirectLegacyApiToV1 } from "@/lib/api/legacy-redirect";

export const dynamic = "force-dynamic";

/** @deprecated Use GET /api/v1/projects/[id]/poll-status */
export async function GET(
  request: Request,
  _context: { params: Promise<{ id: string }> }
) {
  return redirectLegacyApiToV1(request);
}
