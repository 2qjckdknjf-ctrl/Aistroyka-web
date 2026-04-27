import { redirectToV1PreservePath } from "@/lib/api/legacy-redirect";

export const dynamic = "force-dynamic";

/** @deprecated Use PATCH /api/v1/tenant/profile */
export async function PATCH(request: Request) {
  return redirectToV1PreservePath(request);
}
