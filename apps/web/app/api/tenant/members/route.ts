import { redirectToV1PreservePath } from "@/lib/api/legacy-redirect";

/** @deprecated Use GET /api/v1/tenant/members */
export async function GET(request: Request) {
  return redirectToV1PreservePath(request);
}
