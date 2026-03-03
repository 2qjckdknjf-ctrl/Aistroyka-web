import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProject, listProjectsForUser } from "@/lib/supabase/rpc";

/** GET /api/projects — list projects for current user (tenant). */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await listProjectsForUser(supabase);
  if (error) {
    const status = error === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { success: false, error: "name is required" },
      { status: 400 }
    );
  }
  const PROJECT_NAME_MAX_LENGTH = 200;
  if (name.length > PROJECT_NAME_MAX_LENGTH) {
    return NextResponse.json(
      { success: false, error: `Project name must be at most ${PROJECT_NAME_MAX_LENGTH} characters` },
      { status: 400 }
    );
  }
  const result = await createProject(supabase, name);
  if ("error" in result) {
    const status = result.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: result.error },
      { status }
    );
  }
  return NextResponse.json({ success: true, data: { id: result.id } });
}
