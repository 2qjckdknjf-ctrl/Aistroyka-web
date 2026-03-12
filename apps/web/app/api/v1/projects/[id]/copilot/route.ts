/**
 * GET /api/v1/projects/:id/copilot — Copilot brief for a project.
 * Query: useCase (e.g. generateManagerBrief, detectTopRisks).
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

export const dynamic = "force-dynamic";

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
  return NextResponse.json({ data: result });
}
