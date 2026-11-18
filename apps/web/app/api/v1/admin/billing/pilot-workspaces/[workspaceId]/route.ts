export const dynamic = "force-dynamic";
import { delegateLegacyTenantAdminPlatformApi } from "@/lib/platform-admin/legacy-tenant-admin-api";
import { DELETE as platformDELETE } from "../../../../platform/billing/pilot-workspaces/[workspaceId]/route";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  return delegateLegacyTenantAdminPlatformApi(request, "/billing/pilot-workspaces/[workspaceId]", (req) =>
    platformDELETE(req, context)
  );
}
