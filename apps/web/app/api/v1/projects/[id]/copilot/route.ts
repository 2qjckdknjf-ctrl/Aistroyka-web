/**
 * GET /api/v1/projects/:id/copilot — Copilot brief for a project.
 * Query: useCase (e.g. generateManagerBrief, detectTopRisks).
 * Fallback: deterministicFallback when provider unavailable or throws.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { runCopilot } from "@/lib/copilot/copilot.service";
import type { ICopilotProvider } from "@/lib/copilot/copilot.provider";
import type { CopilotUseCase } from "@/lib/copilot/copilot.types";
import { createOpenAiCopilotProviderFromEnv } from "@/lib/copilot/copilot.openai-provider";
import { gateCopilotLlmRequest } from "@/lib/copilot/copilot-ai-gate";
import { isOpenAIConfigured } from "@/lib/config/server";
import { recordUsage, checkBudgetAlert } from "@/lib/platform/ai-usage/ai-usage.service";
import { logCopilotNonStreamComplete, getAiReleaseCorrelation } from "@/lib/observability/ai-telemetry";
import { emitAiRuntimeAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "GET /api/v1/projects/:id/copilot";

function generateRequestId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const USE_CASES = [
  "summarizeProjectStatus",
  "summarizeDailyReports",
  "detectTopRisks",
  "findMissingEvidence",
  "identifyBlockedTasks",
  "generateManagerBrief",
  "generateExecutiveBrief",
] as const;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProject(supabase, ctx, id);
  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    return NextResponse.json({ error: projectError ?? "Not found" }, { status });
  }

  const url = new URL(request.url);
  const useCase = url.searchParams.get("useCase") ?? "generateManagerBrief";
  if (!USE_CASES.includes(useCase as (typeof USE_CASES)[number])) {
    return NextResponse.json({ error: "Invalid useCase" }, { status: 400 });
  }

  const tenantId = ctx.tenantId!;
  const requestId = request.headers.get("X-Request-Id")?.trim() || generateRequestId();
  const startMs = Date.now();

  const admin = getAdminClient();
  let copilotProvider: ICopilotProvider | null = null;

  if (isOpenAIConfigured() && admin) {
    const gate = await gateCopilotLlmRequest(admin, {
      tenantId,
      userId: ctx.userId ?? null,
      subscriptionTier: ctx.subscriptionTier ?? null,
      requestId,
      endpoint: ROUTE_KEY,
      request,
    });
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.message, code: gate.code, request_id: requestId },
        { status: gate.httpStatus, headers: { "X-Request-Id": requestId } }
      );
    }
    copilotProvider =
      createOpenAiCopilotProviderFromEnv(async (usage) => {
        await recordUsage(admin, {
          tenant_id: tenantId,
          user_id: ctx.userId ?? null,
          trace_id: requestId,
          provider: "openai",
          model: usage.model,
          tokens_input: usage.promptTokens,
          tokens_output: usage.completionTokens,
          tokens_total: usage.promptTokens + usage.completionTokens,
          cost_usd: usage.costUsd,
          status: "success",
          duration_ms: usage.durationMs,
        });
        await checkBudgetAlert(admin, tenantId, usage.costUsd);
      }) ?? null;
  }

  const copilotOpts = {
    supabase,
    copilotProvider: copilotProvider ?? undefined,
  };

  const uc = useCase as CopilotUseCase;
  let result;
  switch (uc) {
    case "summarizeProjectStatus":
      result = await runCopilot({ useCase: uc, projectId: id, tenantId }, copilotOpts);
      break;
    case "detectTopRisks":
      result = await runCopilot({ useCase: uc, projectId: id, tenantId }, copilotOpts);
      break;
    case "findMissingEvidence":
      result = await runCopilot({ useCase: uc, projectId: id, tenantId }, copilotOpts);
      break;
    case "identifyBlockedTasks":
      result = await runCopilot({ useCase: uc, projectId: id, tenantId }, copilotOpts);
      break;
    case "generateManagerBrief":
      result = await runCopilot({ useCase: uc, projectId: id, tenantId }, copilotOpts);
      break;
    case "generateExecutiveBrief":
      result = await runCopilot({ useCase: uc, projectId: id, tenantId }, copilotOpts);
      break;
    case "summarizeDailyReports":
      result = await runCopilot({ useCase: uc, projectId: id, tenantId }, copilotOpts);
      break;
    default:
      result = await runCopilot({ useCase: "generateManagerBrief", projectId: id, tenantId }, copilotOpts);
  }

  const fallbackTriggered = result.source === "deterministic";
  const fallbackReason = fallbackTriggered ? "provider_unavailable_or_error" : undefined;
  const latencyMs = Date.now() - startMs;
  const rel = getAiReleaseCorrelation();
  const providerLabel =
    result.source === "llm" ? "openai" : result.source === "mock" ? "mock" : "none";
  logCopilotNonStreamComplete({
    request_id: requestId,
    route: ROUTE_KEY,
    tenant_id: tenantId,
    project_id: id,
    user_id: ctx.userId ?? undefined,
    latency_ms: latencyMs,
    output_type: "copilot",
    streaming: false,
    fallback_triggered: fallbackTriggered,
    fallback_reason: fallbackReason ?? undefined,
    fallback_target_path: fallbackTriggered ? "deterministicFallback" : undefined,
    use_case: useCase,
    provider: providerLabel,
    ...rel,
  });
  void emitAiRuntimeAudit(supabase, {
    tenant_id: tenantId,
    user_id: ctx.userId ?? null,
    trace_id: requestId,
    project_id: id,
    action: "ai_copilot_non_stream_complete",
    details: {
      request_id: requestId,
      route: ROUTE_KEY,
      latency_ms: latencyMs,
      output_type: "copilot",
      streaming: false,
      fallback_triggered: fallbackTriggered,
      fallback_reason: fallbackReason ?? undefined,
      provider: providerLabel,
      ...rel,
    },
  });

  return NextResponse.json(
    { data: result },
    { headers: { "X-Request-Id": requestId } }
  );
}
