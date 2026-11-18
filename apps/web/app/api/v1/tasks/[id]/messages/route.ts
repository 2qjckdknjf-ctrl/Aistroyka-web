import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import {
  createTaskMessage,
  listTaskMessages,
} from "@/lib/domain/task-messages/task-messages.service";
import type { TaskMessageKind } from "@/lib/domain/task-messages/task-messages.types";
import {
  getCachedResponse,
  storeResponse,
  IDEMPOTENCY_HEADER,
} from "@/lib/platform/idempotency/idempotency.service";
import { getAdminClient } from "@/lib/supabase/admin";
import { getOrCreateRequestId, logStructured, withRequestIdAndTiming } from "@/lib/observability";
import { checkRequestBodySize } from "@/lib/api/request-limit";
import { checkRateLimit } from "@/lib/platform/rate-limit/rate-limit.service";

export const dynamic = "force-dynamic";

const ROUTE_GET_PREFIX = "GET /api/v1/tasks/";
const ROUTE_POST_PREFIX = "POST /api/v1/tasks/";

/** GET /api/v1/tasks/:id/messages — paginated task chat (oldest-first page). */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const { id: taskId } = await context.params;
  const routeKey = `${ROUTE_GET_PREFIX}${taskId ?? ""}/messages`;
  if (!taskId) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Missing task id" }, { status: 400 }), {
      route: routeKey,
      method: "GET",
      duration_ms: Date.now() - start,
    });
  }

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: 401 }), {
        route: routeKey,
        method: "GET",
        duration_ms: Date.now() - start,
      });
    }
    throw e;
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);
  const cursor = url.searchParams.get("cursor");
  const supabase = await createClientFromRequest(request);
  const { result, error, status, code } = await listTaskMessages(supabase, ctx, taskId, {
    limit,
    cursor,
  });
  if (error) {
    return withRequestIdAndTiming(
      request,
      NextResponse.json(code ? { error, code } : { error }, { status }),
      {
        route: routeKey,
        method: "GET",
        duration_ms: Date.now() - start,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      }
    );
  }
  return withRequestIdAndTiming(
    request,
    NextResponse.json({ data: result!.data, nextCursor: result!.nextCursor }),
    {
      route: routeKey,
      method: "GET",
      duration_ms: Date.now() - start,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    }
  );
}

/** POST /api/v1/tasks/:id/messages — create chat message. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  const { id: taskId } = await context.params;
  const routeKey = `${ROUTE_POST_PREFIX}${taskId ?? ""}/messages`;
  if (!taskId) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Missing task id" }, { status: 400 }), {
      route: routeKey,
      method: "POST",
      duration_ms: Date.now() - start,
    });
  }

  const sizeError = checkRequestBodySize(request);
  if (sizeError) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: sizeError }, { status: 413 }), {
      route: routeKey,
      method: "POST",
      duration_ms: Date.now() - start,
    });
  }

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: 401 }), {
        route: routeKey,
        method: "POST",
        duration_ms: Date.now() - start,
      });
    }
    throw e;
  }

  const adminForRl = getAdminClient();
  if (adminForRl && ctx.tenantId) {
    try {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      const rl = await checkRateLimit(adminForRl, {
        tenantId: ctx.tenantId,
        ip,
        endpoint: "/api/v1/tasks/:id/messages",
      });
      if (rl.limited) {
        return withRequestIdAndTiming(
          request,
          NextResponse.json({ error: rl.message }, { status: 429 }),
          {
            route: routeKey,
            method: "POST",
            duration_ms: Date.now() - start,
            tenantId: ctx.tenantId,
            userId: ctx.userId,
          }
        );
      }
    } catch {
      logStructured({
        event: "rate_limit_unavailable",
        endpoint: "/api/v1/tasks/:id/messages",
        tenant_id: ctx.tenantId,
        request_id: getOrCreateRequestId(request),
      });
    }
  }

  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const admin = getAdminClient();
    if (admin) {
      const cached = await getCachedResponse(admin, idempotencyKey, ctx.tenantId, ctx.userId, routeKey);
      if (cached) {
        return withRequestIdAndTiming(
          request,
          NextResponse.json(cached.response as object, { status: cached.statusCode }),
          {
            route: routeKey,
            method: "POST",
            duration_ms: Date.now() - start,
            tenantId: ctx.tenantId,
            userId: ctx.userId,
          }
        );
      }
    }
  }

  let body: {
    kind?: string;
    body?: string;
    mediaId?: string;
    media_id?: string;
    durationMs?: number;
    duration_ms?: number;
    clientId?: string;
    client_id?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Invalid JSON" }, { status: 400 }), {
      route: routeKey,
      method: "POST",
      duration_ms: Date.now() - start,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
  }

  const supabase = await createClientFromRequest(request);
  const { data, error, status, code } = await createTaskMessage(supabase, ctx, taskId, {
    kind: (body.kind ?? "") as TaskMessageKind,
    body: body.body,
    mediaId: body.mediaId ?? body.media_id,
    durationMs: body.durationMs ?? body.duration_ms,
    clientId: body.clientId ?? body.client_id,
  });

  if (error) {
    return withRequestIdAndTiming(
      request,
      NextResponse.json(code ? { error, code } : { error }, { status }),
      {
        route: routeKey,
        method: "POST",
        duration_ms: Date.now() - start,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      }
    );
  }

  const responseBody = { data };
  if (idempotencyKey && ctx.tenantId && ctx.userId) {
    const admin = getAdminClient();
    if (admin) {
      await storeResponse(admin, idempotencyKey, ctx.tenantId, ctx.userId, routeKey, responseBody, status);
    }
  }

  return withRequestIdAndTiming(request, NextResponse.json(responseBody, { status }), {
    route: routeKey,
    method: "POST",
    duration_ms: Date.now() - start,
    tenantId: ctx.tenantId,
    userId: ctx.userId,
  });
}
