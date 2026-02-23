import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "@/lib/supabase/rpc";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }
  const result = await createProject(supabase, name);
  if ("error" in result) {
    const status = result.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ id: result.id });
}
