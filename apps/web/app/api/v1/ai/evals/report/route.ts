/**
 * GET /api/v1/ai/evals/report — AI Brain Phase D eval report.
 * Returns report for an eval run. Auth: tenant.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getEvalRunReport } from "@/lib/ai-brain/phase-d/eval/eval-result.repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);

  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const evalRunId = url.searchParams.get("evalRunId");

  if (!evalRunId?.trim()) {
    return NextResponse.json({ error: "evalRunId required" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const rows = await getEvalRunReport(supabase, evalRunId.trim());

  const passed = rows.filter((r) => r.result === "pass").length;
  const failed = rows.filter((r) => r.result === "fail").length;
  const partial = rows.filter((r) => r.result === "partial").length;
  const total = rows.length;
  const passRate = total > 0 ? passed / total : 0;

  return NextResponse.json({
    data: {
      evalRunId: evalRunId.trim(),
      total,
      passed,
      failed,
      partial,
      passRate,
      results: rows,
    },
  });
}
