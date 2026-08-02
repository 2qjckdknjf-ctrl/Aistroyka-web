/**
 * POST /api/v1/ai/memory/record — AI Brain Phase C memory write.
 * Creates memory record via write policy. Conservative; rejects unsafe.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { getOrCreateRequestId, addRequestIdToResponse } from "@/lib/observability/trace";
import { createMemoryRecord } from "@/lib/ai-brain/phase-c";
import type { AiMemoryType, AiMemoryScope, AiMemorySourceKind } from "@/lib/ai-brain/phase-c";

export const dynamic = "force-dynamic";

const MEMORY_TYPES: AiMemoryType[] = ["session", "project_working", "user_preference", "learning_candidate"];
const SCOPES: AiMemoryScope[] = ["tenant", "project", "user", "session"];
const SOURCE_KINDS: AiMemorySourceKind[] = ["system_derived", "human_confirmed", "ai_suggested", "ai_inferred", "action_outcome"];

export async function POST(request: Request) {
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
      return addRequestIdToResponse(
        NextResponse.json({ error: e.message }, { status: 401 }),
        requestId
      );
    }
    throw e;
  }

  let body: {
    projectId?: string | null;
    memoryType?: string;
    scope?: string;
    sourceKind?: string;
    sourceRef?: string | null;
    title?: string;
    body?: unknown;
    factsUsed?: string[];
    groundingRefs?: string[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return addRequestIdToResponse(
      NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
      requestId
    );
  }

  const tenantId = ctx.tenantId!;
  const memoryType = MEMORY_TYPES.includes((body.memoryType ?? "") as AiMemoryType)
    ? (body.memoryType as AiMemoryType)
    : "project_working";
  const scope = SCOPES.includes((body.scope ?? "project") as AiMemoryScope)
    ? (body.scope as AiMemoryScope)
    : "project";
  const sourceKind = SOURCE_KINDS.includes((body.sourceKind ?? "ai_suggested") as AiMemorySourceKind)
    ? (body.sourceKind as AiMemorySourceKind)
    : "ai_suggested";

  const title = (body.title ?? "").trim();
  if (!title) {
    return addRequestIdToResponse(
      NextResponse.json({ error: "title required" }, { status: 400 }),
      requestId
    );
  }

  if (body.projectId && scope === "project") {
    const supabase = await createClientFromRequest(request);
    const { data: project, error } = await getProjectForInternalWorkspace(supabase, ctx, body.projectId);
    if (error || !project) {
      return addRequestIdToResponse(
        NextResponse.json({ error: error ?? "Project not found" }, { status: 404 }),
        requestId
      );
    }
  }

  const supabase = await createClientFromRequest(request);
  const result = await createMemoryRecord(supabase, {
    tenantId,
    projectId: body.projectId ?? null,
    userId: ctx.userId ?? null,
    memoryType,
    scope,
    sourceKind,
    sourceRef: body.sourceRef ?? null,
    title,
    body: body.body ?? {},
    factsUsed: body.factsUsed ?? [],
    groundingRefs: body.groundingRefs ?? [],
  });

  if (!result.success) {
    return addRequestIdToResponse(
      NextResponse.json({ error: result.reason }, { status: 400 }),
      requestId
    );
  }

  return addRequestIdToResponse(
    NextResponse.json({
      data: {
        memoryId: result.record.memoryId,
        memoryType: result.record.memoryType,
        title: result.record.title,
        confidence: result.record.confidence,
      },
    }),
    requestId
  );
}
