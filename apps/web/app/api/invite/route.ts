/**
 * POST /api/invite — deprecated alias for tenant invite.
 * Must not map to nonexistent /api/v1/invite.
 */

import { redirectDeprecatedApiToV1 } from "@/lib/api/legacy-redirect";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/v1/tenant/invite */
export async function POST(request: Request) {
  return redirectDeprecatedApiToV1(request, "/api/v1/tenant/invite");
}
