export const dynamic = "force-dynamic";
import { delegateLegacyTenantAdminPlatformApi } from "@/lib/platform-admin/legacy-tenant-admin-api";
export type { LeadRow } from "../../platform/leads/route";
import { GET as platformGET } from "../../platform/leads/route";

export async function GET(request: Request) {
  return delegateLegacyTenantAdminPlatformApi(request, "/leads", platformGET);
}
