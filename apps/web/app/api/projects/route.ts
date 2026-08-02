/**
 * Legacy /api/projects — lite clients forbidden; others redirect to /api/v1/projects.
 */

import { redirectLegacyApiToV1 } from "@/lib/api/legacy-redirect";

export const dynamic = "force-dynamic";

/** @deprecated Use GET /api/v1/projects */
export async function GET(request: Request) {
  return redirectLegacyApiToV1(request);
}

/** @deprecated Use POST /api/v1/projects */
export async function POST(request: Request) {
  return redirectLegacyApiToV1(request);
}
