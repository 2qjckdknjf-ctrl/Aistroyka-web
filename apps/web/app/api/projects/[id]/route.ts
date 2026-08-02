/**
 * Legacy /api/projects/[id] — lite clients forbidden; others redirect to /api/v1/projects/[id].
 */

import { redirectLegacyApiToV1 } from "@/lib/api/legacy-redirect";

export const dynamic = "force-dynamic";

/** @deprecated Use GET /api/v1/projects/[id] */
export async function GET(
  request: Request,
  _context: { params: Promise<{ id: string }> }
) {
  return redirectLegacyApiToV1(request);
}
