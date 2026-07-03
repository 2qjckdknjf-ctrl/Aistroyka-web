export const dynamic = "force-dynamic";
import { delegateLegacyTenantAdminPlatformApi } from "@/lib/platform-admin/legacy-tenant-admin-api";
import { GET as platformGET } from "../../../platform/leads/[id]/route";
import { PATCH as platformPATCH } from "../../../platform/leads/[id]/route";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return delegateLegacyTenantAdminPlatformApi(request, "/leads/[id]", (req) => platformGET(req, context));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return delegateLegacyTenantAdminPlatformApi(request, "/leads/[id]", (req) => platformPATCH(req, context));
}
