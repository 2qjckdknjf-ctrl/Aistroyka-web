export const dynamic = "force-dynamic";
import { delegateLegacyTenantAdminPlatformApi } from "@/lib/platform-admin/legacy-tenant-admin-api";
import { POST as platformPOST } from "../../../platform/billing/reprocess-event/route";

export async function POST(request: Request) {
  return delegateLegacyTenantAdminPlatformApi(request, "/billing/reprocess-event", platformPOST);
}
