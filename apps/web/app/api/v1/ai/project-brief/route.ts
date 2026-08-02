/**
 * GET /api/v1/ai/project-brief — AI Brain Phase A consumption path.
 * Returns orchestrated project brief. Auth: tenant + project membership.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { getOrCreateRequestId, addRequestIdToResponse } from "@/lib/observability/trace";
import { runOrchestrator } from "@/lib/ai-brain/phase-a";
import type { OrchestratorMode } from "@/lib/ai-brain/phase-a";
import { validateOutput } from "@/lib/ai-brain/phase-a/contracts";
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
        route: "GET /api/v1/ai/project-brief",
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
  const modeParam = url.searchParams.get("mode") ?? "executive_summary";

  if (!projectId) {
    return addRequestIdToResponse(
      NextResponse.json({ error: "projectId required" }, { status: 400 }),
      requestId
    );
  }

  const mode = MODES.includes(modeParam as OrchestratorMode)
    ? (modeParam as OrchestratorMode)
    : "executive_summary";

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProjectForInternalWorkspace(supabase, ctx, projectId);

  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    logIntelligenceError({
      request_id: requestId,
      route: "GET /api/v1/ai/project-brief",
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

  let result;
  try {
    result = await runOrchestrator(supabase, {
      requestId,
      mode,
      tenantId,
      projectId,
      userId: ctx.userId,
      role: "manager",
    });
  } catch (e) {
    logIntelligenceError({
      request_id: requestId,
      route: "GET /api/v1/ai/project-brief",
      tenant_id: tenantId,
      project_id: projectId,
      latency_ms: Date.now() - startMs,
      error_kind: "unknown_internal_error",
      ...getAiReleaseCorrelation(),
    });
    void emitAiRuntimeAudit(supabase, {
      tenant_id: tenantId,
      user_id: ctx.userId ?? null,
      trace_id: requestId,
      project_id: projectId,
      action: "ai_intelligence_error",
      details: {
        request_id: requestId,
        route: "GET /api/v1/ai/project-brief",
        latency_ms: Date.now() - startMs,
        output_type: "intelligence",
        error_kind: "unknown_internal_error",
        ...getAiReleaseCorrelation(),
      },
    });
    return addRequestIdToResponse(
      NextResponse.json(
        { error: "Orchestrator failed", request_id: requestId },
        { status: 503 }
      ),
      requestId
    );
  }

  const outputContract =
    result.output && typeof result.output === "object" && "type" in result.output
      ? (result.output.type as string)
      : "unknown";

  const validation =
    result.output && outputContract !== "unknown"
      ? validateOutput(outputContract as "ExecutiveProjectBrief" | "ManagerProjectInsight" | "WorkerNextFocusSummary" | "ClientSafeProjectSummary", result.output)
      : { success: true as const, data: result.output };

  logIntelligenceComplete({
    request_id: requestId,
    route: "GET /api/v1/ai/project-brief",
    tenant_id: tenantId,
    project_id: projectId,
    user_id: ctx.userId ?? undefined,
    latency_ms: Date.now() - startMs,
    output_type: "intelligence",
    data_sufficiency: result.snapshot?.dataSufficiencyFlags.snapshot,
    health_score: result.snapshot
      ? (result.context.get_project_health_summary as { score?: number } | undefined)?.score
      : undefined,
    insights_count: result.degradationFlags.length,
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
      route: "GET /api/v1/ai/project-brief",
      latency_ms: Date.now() - startMs,
      output_type: "intelligence",
      intelligence_diagnostics: {
        mode,
        output_contract: outputContract,
        degradation_flags: result.degradationFlags,
      },
      ...getAiReleaseCorrelation(),
    },
  });

  if (result.success) {
    recordRun(supabase, {
      runId: requestId,
      tenantId,
      projectId,
      userId: ctx.userId ?? null,
      route: "GET /api/v1/ai/project-brief",
      mode,
      outputContractType: outputContract,
      degradedFlags: result.degradationFlags,
      executionTimingMs: Date.now() - startMs,
      validationResult: validation.success ? "ok" : "partial",
    });
  }

  const payload = result.success
    ? {
        data: {
          success: true,
          mode: result.mode,
          snapshot: result.snapshot,
          output: validation.success ? validation.data : result.output,
          degradationFlags: result.degradationFlags,
        },
      }
    : {
        error: result.error,
        degradationFlags: result.degradationFlags,
      };

  const status = result.success ? 200 : 503;
  return addRequestIdToResponse(NextResponse.json(payload, { status }), requestId);
}
