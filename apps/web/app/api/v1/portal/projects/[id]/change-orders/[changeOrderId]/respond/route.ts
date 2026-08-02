/**
 * POST /api/v1/portal/projects/:id/change-orders/:changeOrderId/respond
 * Portal alias — always customer surface (finance guard on final JSON).
 */

import { POST as projectsPOST } from "@/app/api/v1/projects/[id]/change-orders/[changeOrderId]/respond/route";
import { enforceCustomerFinanceOnJsonResponse } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

const ROUTE = "POST /api/v1/portal/projects/:id/change-orders/:changeOrderId/respond";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const res = await projectsPOST(request, context);
  return enforceCustomerFinanceOnJsonResponse(ROUTE, res);
}
