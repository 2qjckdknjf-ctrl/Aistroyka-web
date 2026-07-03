export const dynamic = "force-dynamic";
import { delegateLegacyTenantAdminPlatformApi } from "@/lib/platform-admin/legacy-tenant-admin-api";
import { PATCH as platformPATCH } from "../../../platform/leads/bulk/route";

export async function PATCH(request: Request) {
  return delegateLegacyTenantAdminPlatformApi(request, "/leads/bulk", platformPATCH);
}
