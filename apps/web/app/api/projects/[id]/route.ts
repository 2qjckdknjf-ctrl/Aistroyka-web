import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/rpc";
import { setLegacyApiHeaders } from "@/lib/api/deprecation-headers";

/** GET /api/projects/[id] — project details for current user (tenant). Prefer GET /api/v1/projects/[id]. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    const res = NextResponse.json({ error: "Missing id" }, { status: 400 });
    setLegacyApiHeaders(res.headers);
    return res;
  }
  const supabase = await createClient();
  const { data, error } = await getProjectById(supabase, id);
  if (error) {
    const status = error === "Unauthorized" ? 401 : 500;
    const res = NextResponse.json({ error }, { status });
    setLegacyApiHeaders(res.headers);
    return res;
  }
  if (!data) {
    const res = NextResponse.json({ error: "Not found" }, { status: 404 });
    setLegacyApiHeaders(res.headers);
    return res;
  }
  const res = NextResponse.json({ data });
  setLegacyApiHeaders(res.headers);
  res.headers.set("Link", '</api/v1/projects/' + id + '>; rel="successor"');
  return res;
}
