/**
 * GET /api/v1/share/proof/:token — public tokenized Proof Pack.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPublicConfig } from "@/lib/config";
import { getProofPackByToken } from "@/lib/domain/proof-pack/proof-pack.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const cfg = getPublicConfig();
  const supabase = createClient(cfg.NEXT_PUBLIC_SUPABASE_URL, cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await getProofPackByToken(supabase, token);
  if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}
