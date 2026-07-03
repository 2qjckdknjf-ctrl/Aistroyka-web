export const dynamic = "force-dynamic";
import { delegateLegacyTenantAdminPlatformApi } from "@/lib/platform-admin/legacy-tenant-admin-api";
import { GET as platformGET } from "../../../platform/billing/workspace-status/route";

export async function GET(request: Request) {
  return delegateLegacyTenantAdminPlatformApi(request, "/billing/workspace-status", platformGET);
}
