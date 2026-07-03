export const dynamic = "force-dynamic";
import { delegateToPlatformApi } from "@/lib/platform-admin/legacy-owner-api";
import { GET as platformGET } from "../platform/overview/route";

export async function GET(request: Request) {
  return delegateToPlatformApi(request, platformGET);
}
