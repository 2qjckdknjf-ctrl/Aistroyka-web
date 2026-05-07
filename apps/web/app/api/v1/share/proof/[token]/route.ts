/**
 * GET /api/v1/share/proof/:token — public tokenized Proof Pack.
 *
 * Uses the server-only service role client: share rows and project/media/document data
 * are protected by RLS for anon keys; unauthenticated visitors cannot read them otherwise.
 * Response body is still assembled only via domain code with audience "public"
 * (customer-safe projection).
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProofPackByToken } from "@/lib/domain/proof-pack/proof-pack.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Proof pack links require SUPABASE_SERVICE_ROLE_KEY (server-only). Configure env and redeploy.",
      },
      { status: 503 }
    );
  }
  const { data, error } = await getProofPackByToken(admin, token);
  if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}
