/**
 * GET /api/v1/projects/:id/copilot — Copilot brief for a project.
 * Query: useCase (e.g. generateManagerBrief, detectTopRisks).
 * Fallback: deterministicFallback when provider unavailable or throws.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import {
  summarizeProjectStatus,
  summarizeDailyReports,
  detectTopRisks,
  findMissingEvidence,
  identifyBlockedTasks,
  generateManagerBrief,
  generateExecutiveBrief,
} from "@/lib/copilot";
import { logCopilotNonStreamComplete } from "@/lib/observability/ai-telemetry";
import { emitAiRuntimeAudit } from "@/lib/observability/audit.service";
import { getBuildStamp } from "@/lib/config";

export const dynamic = "force-dynamic";

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

  let result;
  switch (useCase) {
    case "summarizeProjectStatus":
      result = await summarizeProjectStatus(supabase, id, tenantId);
      break;
    case "detectTopRisks":
      result = await detectTopRisks(supabase, id, tenantId);
      break;
    case "findMissingEvidence":
      result = await findMissingEvidence(supabase, id, tenantId);
      break;
    case "identifyBlockedTasks":
      result = await identifyBlockedTasks(supabase, id, tenantId);
      break;
    case "generateManagerBrief":
      result = await generateManagerBrief(supabase, id, tenantId);
      break;
    case "generateExecutiveBrief":
      result = await generateExecutiveBrief(supabase, id, tenantId);
      break;
    case "summarizeDailyReports":
      result = await summarizeDailyReports(supabase, id, tenantId);
      break;
    default:
      result = await generateManagerBrief(supabase, id, tenantId);
  }

  const fallbackTriggered = result.source === "deterministic";
  const fallbackReason = fallbackTriggered ? "provider_unavailable_or_error" : undefined;
  const latencyMs = Date.now() - startMs;
  logCopilotNonStreamComplete({
    request_id: requestId,
    route: "GET /api/v1/projects/:id/copilot",
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
    provider: fallbackTriggered ? "none" : "openai",
  });
  const { sha } = getBuildStamp();
  void emitAiRuntimeAudit(supabase, {
    tenant_id: tenantId,
    user_id: ctx.userId ?? null,
    trace_id: requestId,
    project_id: id,
    action: "ai_copilot_non_stream_complete",
    details: {
      request_id: requestId,
      route: "GET /api/v1/projects/:id/copilot",
      latency_ms: latencyMs,
      output_type: "copilot",
      streaming: false,
      fallback_triggered: fallbackTriggered,
      fallback_reason: fallbackReason ?? undefined,
      provider: fallbackTriggered ? "none" : "openai",
      ...(sha && { build_sha7: sha.slice(0, 7) }),
    },
  });

  return NextResponse.json(
    { data: result },
    { headers: { "X-Request-Id": requestId } }
  );
}
