import { publishedEvidenceResponse } from "@/lib/domain/portal/published-evidence.route";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return publishedEvidenceResponse(request, id);
}
