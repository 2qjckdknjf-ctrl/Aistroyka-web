export const dynamic = "force-dynamic";
import { delegateToPlatformApi } from "@/lib/platform-admin/legacy-owner-api";
import { GET as platformGET } from "../../../platform/tenants/[tenantId]/route";

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
  return delegateToPlatformApi(request, (req) => platformGET(req, context));
}
