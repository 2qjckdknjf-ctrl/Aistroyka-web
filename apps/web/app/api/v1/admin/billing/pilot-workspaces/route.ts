export const dynamic = "force-dynamic";
import { delegateLegacyTenantAdminPlatformApi } from "@/lib/platform-admin/legacy-tenant-admin-api";
import { GET as platformGET } from "../../../platform/billing/pilot-workspaces/route";
import { POST as platformPOST } from "../../../platform/billing/pilot-workspaces/route";

export async function GET(request: Request) {
  return delegateLegacyTenantAdminPlatformApi(request, "/billing/pilot-workspaces", platformGET);
}

export async function POST(request: Request) {
  return delegateLegacyTenantAdminPlatformApi(request, "/billing/pilot-workspaces", platformPOST);
}
