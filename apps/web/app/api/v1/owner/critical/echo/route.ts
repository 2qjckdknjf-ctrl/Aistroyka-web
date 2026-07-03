export const dynamic = "force-dynamic";
import { delegateToPlatformApi } from "@/lib/platform-admin/legacy-owner-api";
import { POST as platformPOST } from "../../platform/critical/echo/route";

export async function POST(request: Request) {
  return delegateToPlatformApi(request, platformPOST);
}
