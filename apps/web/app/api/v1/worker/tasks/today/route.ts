import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listTasksForToday } from "@/lib/domain/tasks/task.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id") ?? undefined;
  const supabase = await createClientFromRequest(request);
  const { data, error } = await listTasksForToday(supabase, ctx, projectId);
  if (error === "Insufficient rights") {
    return NextResponse.json({ error }, { status: 403 });
  }
  if (error) {
    return NextResponse.json({ error }, { status: 503 });
  }
  return NextResponse.json({ data });
}
