/**
 * POST /api/v1/projects/:id/agent — Agentic Foundation Slice 01.
 * Read-only project agent. Feature-flagged. No autonomous writes.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { getMembership } from "@/lib/domain/project-members/project-members.repository";
import { getOrCreateRequestId, addRequestIdToResponse } from "@/lib/observability/trace";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";
import { IDEMPOTENCY_HEADER, getCachedResponse, storeResponse } from "@/lib/platform/idempotency/idempotency.service";
import { gateTenantAiRequest } from "@/lib/copilot/copilot-ai-gate";
import { recordUsage, checkBudgetAlert } from "@/lib/platform/ai-usage/ai-usage.service";
import { estimateCostUsd } from "@/lib/platform/ai-usage/cost-estimator";
import { isAgenticFoundationEnabled } from "@/lib/agentic/feature-flag";
import { buildAgentExecutionContext } from "@/lib/agentic/context";
import { runProjectAgent } from "@/lib/agentic/orchestrator/orchestrator";
import { parseAgentPublicResponse } from "@/lib/agentic/orchestrator/structured-output";
import { agentIdempotencyRoute } from "@/lib/agentic/idempotency";
import { isAgentError } from "@/lib/agentic/errors";
import { logAgentMetric } from "@/lib/agentic/observability/metrics";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getOrCreateRequestId(request);
  const { id: projectId } = await context.params;
  const pathname = new URL(request.url).pathname;
  const lite = checkLiteAllowList(pathname, request.method, request.headers.get("x-client"));
  if (lite) {
    return addRequestIdToResponse(NextResponse.json(lite.body, { status: lite.status }), requestId);
  }

  const tenantCtx = await getTenantContextFromRequest(request);
  try {
    requireTenant(tenantCtx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return jsonError(requestId, "AGENT_UNAUTHORIZED", e.message, 401);
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const enabled = await isAgenticFoundationEnabled(supabase, tenantCtx.tenantId);
  if (!enabled) {
    return jsonError(requestId, "AGENT_FEATURE_DISABLED", "Agentic foundation is not enabled", 403);
  }

  const { data: project, error: projectError } = await getProjectForInternalWorkspace(
    supabase,
    tenantCtx,
    projectId
  );
  if (projectError === "Insufficient rights") {
    return jsonError(requestId, "AGENT_PROJECT_ACCESS_DENIED", "Insufficient rights", 403);
  }
  if (!project) {
    return jsonError(requestId, "AGENT_PROJECT_ACCESS_DENIED", "Project not found", 404);
  }

  if (tenantCtx.role === "member" || tenantCtx.role === "viewer") {
    const membership = await getMembership(supabase, tenantCtx.tenantId, projectId, tenantCtx.userId);
    if (!membership) {
      return jsonError(requestId, "AGENT_PROJECT_ACCESS_DENIED", "Project access denied", 403);
    }
  }

  let body: { message?: string };
  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return jsonError(requestId, "AGENT_INVALID_INPUT", "Invalid JSON body", 400);
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return jsonError(requestId, "AGENT_INVALID_INPUT", "message required", 400);
  }

  const idempotencyRoute = agentIdempotencyRoute(projectId);
  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim() || null;
  if (idempotencyKey) {
    const cached = await getCachedResponse(
      supabase,
      idempotencyKey,
      tenantCtx.tenantId,
      tenantCtx.userId,
      idempotencyRoute
    );
    const replayed = cached ? parseAgentPublicResponse(cached.response) : null;
    if (replayed) {
      return addRequestIdToResponse(NextResponse.json(cached!.response, { status: cached!.statusCode }), requestId);
    }
  }

  const admin = getAdminClient();
  if (!admin) {
    return jsonError(
      requestId,
      "AGENT_GOVERNANCE_UNAVAILABLE",
      "Agent requires service configuration for AI usage tracking.",
      503
    );
  }

  const gate = await gateTenantAiRequest(admin, {
    tenantId: tenantCtx.tenantId,
    userId: tenantCtx.userId,
    subscriptionTier: tenantCtx.subscriptionTier,
    requestId,
    endpoint: idempotencyRoute,
    request,
  });
  if (!gate.ok) {
    return addRequestIdToResponse(
      NextResponse.json({ error: gate.message, code: gate.code ?? "AGENT_POLICY_DENIED" }, { status: gate.httpStatus }),
      requestId
    );
  }

  const locale = request.headers.get("x-locale")?.trim() || "en";
  try {
    const agentCtx = await buildAgentExecutionContext({
      supabase,
      tenant: tenantCtx,
      projectId,
      requestId,
      locale,
    });
    const result = await runProjectAgent(
      supabase,
      agentCtx,
      {
        message,
        idempotencyKey,
      },
      {
        persistClient: admin,
        recordUsage: async (usage) => {
          const costUsd = estimateCostUsd(usage.model, usage.promptTokens, usage.completionTokens);
          await recordUsage(admin, {
            tenant_id: tenantCtx.tenantId,
            user_id: tenantCtx.userId,
            trace_id: requestId,
            provider: usage.provider,
            model: usage.model,
            tokens_input: usage.promptTokens,
            tokens_output: usage.completionTokens,
            tokens_total: usage.promptTokens + usage.completionTokens,
            cost_usd: costUsd,
            status: "success",
            duration_ms: usage.durationMs,
          });
          await checkBudgetAlert(admin, tenantCtx.tenantId, costUsd);
        },
      }
    );
    const payload = {
      schemaVersion: 1 as const,
      runId: result.runId,
      answer: result.answer,
      health: result.health,
      risks: result.risks,
      blockers: result.blockers,
      evidence: result.evidence,
      proposedActions: result.proposedActions,
      limitations: result.limitations,
      confidence: result.confidence,
      runStatus: result.runStatus,
      synthesisSource: result.synthesisSource,
    };
    if (idempotencyKey) {
      await storeResponse(
        supabase,
        idempotencyKey,
        tenantCtx.tenantId,
        tenantCtx.userId,
        idempotencyRoute,
        payload,
        200
      );
    }
    return addRequestIdToResponse(NextResponse.json(payload), requestId);
  } catch (err) {
    logAgentMetric("agentic.orchestration_failure", {
      request_id: requestId,
      error_code: isAgentError(err) ? err.code : "AGENT_SKILL_FAILED",
    });
    if (isAgentError(err)) {
      return jsonError(requestId, err.code, err.message, err.httpStatus);
    }
    return jsonError(requestId, "AGENT_SKILL_FAILED", "Agent run failed", 500);
  }
}

function jsonError(requestId: string, code: string, error: string, status: number) {
  return addRequestIdToResponse(NextResponse.json({ error, code }, { status }), requestId);
}
