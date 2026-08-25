import { POST as acceptInvite } from "@/app/api/v1/tenant/accept-invite/route";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/worker/site-join
 * Server-validated invite token only. Forwards to the existing accept-invite contract.
 * Body: { token: string }
 */
export async function POST(request: Request) {
  return acceptInvite(request);
}
