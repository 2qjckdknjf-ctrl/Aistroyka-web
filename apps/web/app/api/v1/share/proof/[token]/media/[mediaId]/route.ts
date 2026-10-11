import { getAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/platform/ai/media-path-tenant-guard";
import { downloadSharedProofMedia, ProofMediaError } from "@/lib/domain/proof-pack/proof-media.service";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "CDN-Cache-Control": "no-store", "Cloudflare-CDN-Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
export async function GET(_request: Request, context: { params: Promise<{ token: string; mediaId: string }> }) {
  try {
    const { token, mediaId } = await context.params;
    if (!token || token.length > 128 || !isUuid(mediaId)) throw new ProofMediaError(400);
    const admin = getAdminClient();
    if (!admin) throw new ProofMediaError(503);
    const blob = await downloadSharedProofMedia(admin, token, mediaId);
    return new Response(blob, { headers: { ...headers, "Content-Type": blob.type, "Content-Disposition": `inline; filename="${mediaId}"` } });
  } catch (error) {
    return Response.json({ error: "Shared photo unavailable" }, { status: error instanceof ProofMediaError ? error.status : 503, headers });
  }
}
