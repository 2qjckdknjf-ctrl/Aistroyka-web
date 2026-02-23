import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerAnalysis } from "@/lib/supabase/rpc";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const { id: projectId, jobId } = await params;
  const supabase = await createClient();
  const result = await triggerAnalysis(supabase, projectId, jobId);
  if (result.error) {
    if (result.error === "Unauthorized")
      return NextResponse.json({ error: result.error }, { status: 401 });
    if (result.error === "Project not found")
      return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
