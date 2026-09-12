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
import { recordUsageAtomic, checkBudgetAlert } from "@/lib/platform/ai-usage/ai-usage.service";
import { estimateCostUsd } from "@/lib/platform/ai-usage/cost-estimator";
import { isAgenticFoundationEnabled } from "@/lib/agentic/feature-flag";
import { buildAgentExecutionContext } from "@/lib/agentic/context";
import { runProjectAgent } from "@/lib/agentic/orchestrator/orchestrator";
import { parseAgentPublicResponse } from "@/lib/agentic/orchestrator/structured-output";
import { agentIdempotencyRoute } from "@/lib/agentic/idempotency";
import {
  claimAgentIdempotencyKey,
  releaseAgentIdempotencyKey,
  type AgentIdempotencyScope,
} from "@/lib/agentic/idempotency-claim";
import { isAgentError } from "@/lib/agentic/errors";
import { logAgentMetric } from "@/lib/agentic/observability/metrics";

export const dynamic = "force-dynamic";
export const AGENT_MESSAGE_MAX_CHARS = 4_000;
export const AGENT_BODY_MAX_CHARS = 16_000;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getOrCreateRequestId(request);
  const { id: projectId } = await context.params;
  const pathname = new URL(request.url).pathname;
  const lite = checkLiteAllowList(pathname, request.method, request.headers.get("x-client"));
  if (lite) {
    return addRequestIdToResponse(NextResponse.json(lite.body, { status: lite.status }), requestId);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > AGENT_BODY_MAX_CHARS * 4) {
    return jsonError(requestId, "AGENT_INVALID_INPUT", "request body too large", 400);
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

  const parsedBody = await parseAgentRequestBody(request);
  if (!parsedBody.ok) {
    return jsonError(requestId, "AGENT_INVALID_INPUT", parsedBody.error, 400);
  }
  const message = parsedBody.message;

  const idempotencyRoute = agentIdempotencyRoute(projectId);
  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim() || null;
  if (idempotencyKey) {
    const replay = await getValidCachedReplay(
      supabase,
      idempotencyKey,
      tenantCtx.tenantId,
      tenantCtx.userId,
      idempotencyRoute
    );
    if (replay) {
      return addRequestIdToResponse(
        NextResponse.json(replay.response, { status: replay.statusCode }),
        requestId
      );
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

  let claimScope: AgentIdempotencyScope | null = null;
  let claimToken: string | null = null;
  if (idempotencyKey) {
    claimScope = {
      tenantId: tenantCtx.tenantId,
      projectId,
      userId: tenantCtx.userId,
      key: idempotencyKey,
    };
    claimToken = await claimAgentIdempotencyKey(admin, claimScope);
    if (!claimToken) {
      // The winning request may have completed between the first cache read and our
      // failed claim. Recheck once before returning an in-progress conflict.
      const replay = await getValidCachedReplay(
        supabase,
        idempotencyKey,
        tenantCtx.tenantId,
        tenantCtx.userId,
        idempotencyRoute
      );
      if (replay) {
        return addRequestIdToResponse(
          NextResponse.json(replay.response, { status: replay.statusCode }),
          requestId
        );
      }
      return jsonError(
        requestId,
        "AGENT_IDEMPOTENCY_IN_PROGRESS",
        "A request with this idempotency key is already in progress or reserved.",
        409
      );
    }
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
          await recordUsageAtomic(admin, {
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

    // Release only after the durable run exists and the response cache write was
    // attempted. If orchestration/accounting/persistence fails, keep the claim until
    // TTL so an identical retry cannot duplicate a possibly paid provider call.
    if (claimScope && claimToken) {
      try {
        await releaseAgentIdempotencyKey(admin, claimScope, claimToken);
      } catch {
        logAgentMetric("agentic.idempotency_release_failed", { request_id: requestId });
      }
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

async function getValidCachedReplay(
  supabase: Awaited<ReturnType<typeof createClientFromRequest>>,
  key: string,
  tenantId: string,
  userId: string,
  route: string
): Promise<{ response: unknown; statusCode: number } | null> {
  const cached = await getCachedResponse(supabase, key, tenantId, userId, route);
  if (!cached) return null;
  return parseAgentPublicResponse(cached.response) ? cached : null;
}

export async function parseAgentRequestBody(
  request: Request
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, error: "Invalid request body" };
  }
  if (raw.length > AGENT_BODY_MAX_CHARS) {
    return { ok: false, error: "request body too large" };
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "JSON body must be an object" };
  }

  const messageValue = (value as Record<string, unknown>).message;
  const message = typeof messageValue === "string" ? messageValue.trim() : "";
  if (!message) return { ok: false, error: "message required" };
  if (message.length > AGENT_MESSAGE_MAX_CHARS) {
    return {
      ok: false,
      error: `message exceeds ${AGENT_MESSAGE_MAX_CHARS} characters`,
    };
  }
  return { ok: true, message };
}

function jsonError(requestId: string, code: string, error: string, status: number) {
  return addRequestIdToResponse(NextResponse.json({ error, code }, { status }), requestId);
}
