/**
 * POST /api/v1/ai/action-plan — AI Brain Phase B consumption path.
 * Returns planned action drafts. Draft-only; no execution.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { getOrCreateRequestId, addRequestIdToResponse } from "@/lib/observability/trace";
import { assembleProjectTruthSnapshot } from "@/lib/ai-brain/phase-a";
import { planActions } from "@/lib/ai-brain/phase-b";
import { getRelevantMemoryForRun } from "@/lib/ai-brain/phase-c";
import type { OrchestratorMode } from "@/lib/ai-brain/phase-a";
import type { RunContextRole } from "@/lib/ai-brain/phase-b";
import {
  logIntelligenceComplete,
  logIntelligenceError,
  getAiReleaseCorrelation,
} from "@/lib/observability/ai-telemetry";
import { emitAiRuntimeAudit } from "@/lib/observability/audit.service";
import { recordRun } from "@/lib/ai-brain/phase-d/run/run-recorder.service";

export const dynamic = "force-dynamic";

const MODES: OrchestratorMode[] = [
  "executive_summary",
  "project_intelligence",
  "manager_assist",
  "worker_assist",
  "client_safe_summary",
];

const ROLES: RunContextRole[] = ["manager", "worker", "client", "admin"];

export async function POST(request: Request) {
  const startMs = Date.now();
  const requestId = getOrCreateRequestId(request);
  const ctx = await getTenantContextFromRequest(request);

  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      logIntelligenceError({
        request_id: requestId,
        route: "POST /api/v1/ai/action-plan",
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

  let body: { projectId?: string; mode?: string; role?: string };
  try {
    body = (await request.json()) as { projectId?: string; mode?: string; role?: string };
  } catch {
    return addRequestIdToResponse(
      NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
      requestId
    );
  }

  const projectId = body.projectId?.trim();
  if (!projectId) {
    return addRequestIdToResponse(
      NextResponse.json({ error: "projectId required" }, { status: 400 }),
      requestId
    );
  }

  const mode = MODES.includes((body.mode ?? "") as OrchestratorMode)
    ? (body.mode as OrchestratorMode)
    : "manager_assist";
  const userRole = ROLES.includes((body.role ?? "manager") as RunContextRole)
    ? (body.role as RunContextRole)
    : "manager";

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProjectForInternalWorkspace(supabase, ctx, projectId);

  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    logIntelligenceError({
      request_id: requestId,
      route: "POST /api/v1/ai/action-plan",
      tenant_id: ctx.tenantId,
      project_id: projectId,
      latency_ms: Date.now() - startMs,
      error_kind: status === 403 ? "tenant_failure" : "validation_failure",
      ...getAiReleaseCorrelation(),
    });
    return addRequestIdToResponse(
      NextResponse.json({ error: projectError ?? "Not found" }, { status }),
      requestId
    );
  }

  const tenantId = ctx.tenantId!;

  let snapshot;
  try {
    snapshot = await assembleProjectTruthSnapshot(supabase, projectId, tenantId);
  } catch (e) {
    logIntelligenceError({
      request_id: requestId,
      route: "POST /api/v1/ai/action-plan",
      tenant_id: tenantId,
      project_id: projectId,
      latency_ms: Date.now() - startMs,
      error_kind: "unknown_internal_error",
      ...getAiReleaseCorrelation(),
    });
    return addRequestIdToResponse(
      NextResponse.json({ error: "Failed to load project context" }, { status: 503 }),
      requestId
    );
  }

  if (!snapshot) {
    return addRequestIdToResponse(
      NextResponse.json(
        { error: "Project context unavailable", data: { drafts: [] } },
        { status: 200 }
      ),
      requestId
    );
  }

  const result = planActions({
    snapshot,
    mode,
    userRole,
    userId: ctx.userId,
    runId: requestId,
  });

  let memory: Awaited<ReturnType<typeof getRelevantMemoryForRun>> = [];
  try {
    memory = await getRelevantMemoryForRun(supabase, tenantId, {
      projectId,
      userId: ctx.userId ?? undefined,
      mode,
      limit: 5,
    });
  } catch {
    memory = [];
  }

  logIntelligenceComplete({
    request_id: requestId,
    route: "POST /api/v1/ai/action-plan",
    tenant_id: tenantId,
    project_id: projectId,
    user_id: ctx.userId ?? undefined,
    latency_ms: Date.now() - startMs,
    output_type: "intelligence",
    insights_count: result.drafts.length,
    ...getAiReleaseCorrelation(),
  });

  void emitAiRuntimeAudit(supabase, {
    tenant_id: tenantId,
    user_id: ctx.userId ?? null,
    trace_id: requestId,
    project_id: projectId,
    action: "ai_intelligence_complete",
    details: {
      request_id: requestId,
      route: "POST /api/v1/ai/action-plan",
      latency_ms: Date.now() - startMs,
      output_type: "intelligence",
      intelligence_diagnostics: {
        mode,
        role: userRole,
        draft_count: result.drafts.length,
        degraded: result.degraded,
      },
      ...getAiReleaseCorrelation(),
    },
  });

  recordRun(supabase, {
    runId: requestId,
    tenantId,
    projectId,
    userId: ctx.userId ?? null,
    route: "POST /api/v1/ai/action-plan",
    mode,
    outputContractType: "action_drafts",
    degradedFlags: result.degraded ? [result.degradedReason ?? "degraded"] : [],
    executionTimingMs: Date.now() - startMs,
    validationResult: "ok",
  });

  return addRequestIdToResponse(
    NextResponse.json({
      data: {
        drafts: result.drafts,
        degraded: result.degraded,
        degradedReason: result.degradedReason,
        memory: memory.map((m) => ({
          memoryId: m.memoryId,
          memoryType: m.memoryType,
          title: m.title,
          confidence: m.confidence,
          expiresAt: m.expiresAt,
        })),
      },
    }),
    requestId
  );
}
