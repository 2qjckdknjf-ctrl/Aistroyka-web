import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/rpc";

/** GET /api/projects/[id] — project details for current user (tenant). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await getProjectById(supabase, id);
  if (error) {
    const status = error === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error }, { status });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}
