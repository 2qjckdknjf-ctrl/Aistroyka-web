/**
 * Legacy POST /api/contact — compatibility redirect only.
 * Canonical implementation: POST /api/v1/contact.
 */

import { redirectDeprecatedApiToV1 } from "@/lib/api/legacy-redirect";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/v1/contact */
export async function POST(request: Request) {
  return redirectDeprecatedApiToV1(request);
}
