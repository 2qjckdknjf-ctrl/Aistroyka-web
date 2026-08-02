/**
 * POST /api/v1/ai/evals/run — AI Brain Phase D eval execution.
 * Runs eval suite. Auth: tenant.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { runEvalSuite } from "@/lib/ai-brain/phase-d/eval/eval-runner.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  let body: { mode?: string; caseIds?: string[]; useFixtures?: boolean } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const supabase = await createClientFromRequest(request);
  const summary = await runEvalSuite(supabase, {
    mode: body.mode,
    caseIds: body.caseIds,
    useFixtures: body.useFixtures ?? true,
  });

  return NextResponse.json({
    data: {
      evalRunId: summary.evalRunId,
      totalCases: summary.totalCases,
      passed: summary.passed,
      failed: summary.failed,
      partial: summary.partial,
      skipped: summary.skipped,
      passRate: summary.passRate,
      durationMs: summary.durationMs,
      results: summary.results.map((r) => ({
        caseId: r.caseId,
        caseTitle: r.caseTitle,
        result: r.result,
        scores: r.scores,
        warnings: r.warnings,
      })),
    },
  });
}
