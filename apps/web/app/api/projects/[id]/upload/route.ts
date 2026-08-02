/**
 * Legacy upload — lite clients forbidden; others redirect to canonical v1.
 */

import { redirectLegacyApiToV1 } from "@/lib/api/legacy-redirect";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/v1/projects/[id]/upload */
export async function POST(
  request: Request,
  _context: { params: Promise<{ id: string }> }
) {
  return redirectLegacyApiToV1(request);
}
