export const dynamic = "force-dynamic";
import { delegateToPlatformApi } from "@/lib/platform-admin/legacy-owner-api";
import { GET as platformGET } from "../../../platform/support/tickets/route";
import { PATCH as platformPATCH } from "../../../platform/support/tickets/route";

export async function GET(request: Request) {
  return delegateToPlatformApi(request, platformGET);
}

export async function PATCH(request: Request) {
  return delegateToPlatformApi(request, platformPATCH);
}
