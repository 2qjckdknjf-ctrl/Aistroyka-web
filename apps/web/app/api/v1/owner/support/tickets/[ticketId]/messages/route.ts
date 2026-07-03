export const dynamic = "force-dynamic";
import { delegateToPlatformApi } from "@/lib/platform-admin/legacy-owner-api";
import { GET as platformGET } from "../../../../../platform/support/tickets/[ticketId]/messages/route";
import { POST as platformPOST } from "../../../../../platform/support/tickets/[ticketId]/messages/route";

export async function GET(request: Request, context: { params: Promise<Record<string, string>> }) {
  return delegateToPlatformApi(request, (req) => platformGET(req, context));
}

export async function POST(request: Request, context: { params: Promise<Record<string, string>> }) {
  return delegateToPlatformApi(request, (req) => platformPOST(req, context));
}
