/**
 * POST /api/v1/ai/optimizations/experiments/run — AI Brain Phase E.
 * Run optimization experiment. Auth: tenant.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { runOptimizationExperiment } from "@/lib/ai-brain/phase-e/experiment/experiment.service";
import { validateExecutionMode } from "@/lib/ai-brain/phase-e/experiment/experiment.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);

  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  let body: { packageId?: string; executionMode?: string; datasetRef?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const packageId = body.packageId?.trim();
  if (!packageId) {
    return NextResponse.json({ error: "packageId required" }, { status: 400 });
  }

  const mode = body.executionMode ?? "offline";
  if (!validateExecutionMode(mode)) {
    return NextResponse.json({ error: "Invalid executionMode" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const result = await runOptimizationExperiment(supabase, packageId, mode, {
    datasetRef: body.datasetRef?.trim(),
    useFixtures: true,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    data: {
      experimentId: result.experimentId,
      comparisonId: result.comparisonId,
    },
  });
}
