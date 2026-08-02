/**
 * POST /api/v1/portal/projects/:id/decisions/:requestId/respond
 * Portal alias — always customer surface (finance guard on final JSON).
 */

import { POST as projectsPOST } from "@/app/api/v1/projects/[id]/client-requests/[requestId]/respond/route";
import { enforceCustomerFinanceOnJsonResponse } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

const ROUTE = "POST /api/v1/portal/projects/:id/decisions/:requestId/respond";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; requestId: string }> }
) {
  const res = await projectsPOST(request, context);
  return enforceCustomerFinanceOnJsonResponse(ROUTE, res);
}
