import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listTasks, createTask } from "@/lib/domain/tasks/task.service";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  getCachedResponse,
  storeResponse,
  IDEMPOTENCY_HEADER,
} from "@/lib/platform/idempotency/idempotency.service";
import type { CreateTaskInput } from "@/lib/domain/tasks/task.types";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "GET /api/v1/tasks";
const POST_ROUTE_KEY = "POST /api/v1/tasks";

/** GET /api/v1/tasks — list tasks (manager, tenant-scoped). Query: project_id, from, to, status, q, limit, offset. */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const project_id = url.searchParams.get("project_id") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

  const supabase = await createClientFromRequest(request);
  const { data, total, error } = await listTasks(supabase, ctx, {
    project_id,
    from,
    to,
    status,
    q,
    limit,
    offset,
  });
  if (error) return NextResponse.json({ error }, { status: error === "Insufficient rights" ? 403 : 400 });
  return NextResponse.json({ data, total });
}

/** POST /api/v1/tasks — create task (manager). Body: CreateTaskInput. Idempotent when x-idempotency-key sent. */
export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const admin = getAdminClient();
    if (admin) {
      const cached = await getCachedResponse(admin, idempotencyKey, ctx.tenantId, ctx.userId, POST_ROUTE_KEY);
      if (cached) return NextResponse.json(cached.response as object, { status: cached.statusCode });
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const project_id = typeof body.project_id === "string" ? body.project_id.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!project_id || !title)
    return NextResponse.json({ error: "project_id and title required" }, { status: 400 });

  const input: CreateTaskInput = {
    project_id,
    title,
    description: typeof body.description === "string" ? body.description : undefined,
    due_at: typeof body.due_at === "string" ? body.due_at : undefined,
    milestone_id: typeof body.milestone_id === "string" ? body.milestone_id : undefined,
    required_photos:
      body.required_photos && typeof body.required_photos === "object" && !Array.isArray(body.required_photos)
        ? (body.required_photos as CreateTaskInput["required_photos"])
        : undefined,
    report_required: typeof body.report_required === "boolean" ? body.report_required : undefined,
  };

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createTask(supabase, ctx, input);
  if (error) return NextResponse.json({ error }, { status: error === "Insufficient rights" ? 403 : 400 });
  if (!data) return NextResponse.json({ error: "Create failed" }, { status: 500 });

  const res = NextResponse.json({ data }, { status: 201 });
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const admin = getAdminClient();
    if (admin) await storeResponse(admin, idempotencyKey, ctx.tenantId, ctx.userId, POST_ROUTE_KEY, { data }, 201);
  }
  return res;
}
