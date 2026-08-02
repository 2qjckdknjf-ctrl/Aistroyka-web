/**
 * GET /api/v1/ai/memory/context — AI Brain Phase C memory retrieval.
 * Returns relevant memory for project/mode. Auth: tenant + project membership.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { getOrCreateRequestId, addRequestIdToResponse } from "@/lib/observability/trace";
import { getRelevantMemoryForRun } from "@/lib/ai-brain/phase-c";
import type { OrchestratorMode } from "@/lib/ai-brain/phase-a";
import {
  logIntelligenceComplete,
  logIntelligenceError,
  getAiReleaseCorrelation,
} from "@/lib/observability/ai-telemetry";

export const dynamic = "force-dynamic";

const MODES: OrchestratorMode[] = [
  "executive_summary",
  "project_intelligence",
  "manager_assist",
  "worker_assist",
  "client_safe_summary",
];

export async function GET(request: Request) {
  const startMs = Date.now();
  const requestId = getOrCreateRequestId(request);
  const ctx = await getTenantContextFromRequest(request);

  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      logIntelligenceError({
        request_id: requestId,
        route: "GET /api/v1/ai/memory/context",
        tenant_id: ctx.tenantId,
        latency_ms: Date.now() - startMs,
        error_kind: "auth_failure",
        ...getAiReleaseCorrelation(),
      });
      return addRequestIdToResponse(
        NextResponse.json({ error: e.message }, { status: 401 }),
        requestId
      );
    }
    throw e;
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const modeParam = url.searchParams.get("mode") ?? "manager_assist";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10", 10) || 10, 50);

  const mode = MODES.includes(modeParam as OrchestratorMode)
    ? (modeParam as OrchestratorMode)
    : "manager_assist";

  const supabase = await createClientFromRequest(request);
  if (projectId) {
    const { data: project, error: projectError } = await getProjectForInternalWorkspace(supabase, ctx, projectId);
    if (projectError || !project) {
      const status = projectError === "Insufficient rights" ? 403 : 404;
      return addRequestIdToResponse(
        NextResponse.json({ error: projectError ?? "Not found" }, { status }),
        requestId
      );
    }
  }

  const tenantId = ctx.tenantId!;

  let memory;
  try {
    memory = await getRelevantMemoryForRun(supabase, tenantId, {
      projectId: projectId ?? null,
      userId: ctx.userId ?? undefined,
      mode,
      limit,
    });
  } catch (e) {
    logIntelligenceError({
      request_id: requestId,
      route: "GET /api/v1/ai/memory/context",
      tenant_id: tenantId,
      project_id: projectId ?? undefined,
      latency_ms: Date.now() - startMs,
      error_kind: "unknown_internal_error",
      ...getAiReleaseCorrelation(),
    });
    return addRequestIdToResponse(
      NextResponse.json({ error: "Memory retrieval failed" }, { status: 503 }),
      requestId
    );
  }

  logIntelligenceComplete({
    request_id: requestId,
    route: "GET /api/v1/ai/memory/context",
    tenant_id: tenantId,
    project_id: projectId ?? undefined,
    user_id: ctx.userId ?? undefined,
    latency_ms: Date.now() - startMs,
    output_type: "intelligence",
    insights_count: memory.length,
    ...getAiReleaseCorrelation(),
  });

  return addRequestIdToResponse(
    NextResponse.json({
      data: {
        memory: memory.map((m) => ({
          memoryId: m.memoryId,
          memoryType: m.memoryType,
          scope: m.scope,
          title: m.title,
          confidence: m.confidence,
          expiresAt: m.expiresAt,
          sourceKind: m.sourceKind,
        })),
      },
    }),
    requestId
  );
}
