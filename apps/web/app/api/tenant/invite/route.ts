import { redirectToV1PreservePath } from "@/lib/api/legacy-redirect";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/v1/tenant/invite */
export async function POST(request: Request) {
  return redirectToV1PreservePath(request);
}
