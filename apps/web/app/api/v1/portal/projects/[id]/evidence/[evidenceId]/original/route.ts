import { publishedEvidenceResponse } from "@/lib/domain/portal/published-evidence.route";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string; evidenceId: string }> }) {
  const { id, evidenceId } = await context.params;
  return publishedEvidenceResponse(request, id, evidenceId);
}
