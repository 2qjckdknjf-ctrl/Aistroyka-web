/**
 * GET /api/v1/plan-fit/orchestration
 * Returns plan-fit orchestration state for post-registration / first-entry.
 * Auth/tenant-safe; does not perform redirects. Ready for future onboarding UI.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getWorkspacePlanFitOrchestrationState } from "@/lib/platform/plan-fit/orchestration/orchestration.service";
import { PlanFitOrchestrationResponseSchema } from "@/lib/platform/plan-fit/plan-fit-api.schema";

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
  if (!ctx.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const state = await getWorkspacePlanFitOrchestrationState(supabase, ctx.tenantId);

  const body = {
    workspaceId: state.workspaceId,
    hasRecommendation: state.hasRecommendation,
    latestRecommendation: state.latestRecommendation,
    hasSelectedPlan: state.hasSelectedPlan,
    selectedPlanState: state.selectedPlanState
      ? {
          tenantId: state.selectedPlanState.tenantId,
          canonicalPlanCode: state.selectedPlanState.canonicalPlanCode,
          sourceKind: state.selectedPlanState.sourceKind,
          selectedByUserId: state.selectedPlanState.selectedByUserId,
          selectedAt: state.selectedPlanState.selectedAt,
          addOnCodes: state.selectedPlanState.addOnCodes,
          createdAt: state.selectedPlanState.createdAt,
          updatedAt: state.selectedPlanState.updatedAt,
        }
      : null,
    currentPlanContext: state.currentPlanContext
      ? {
          canonicalPlanCode: state.currentPlanContext.canonicalPlanCode,
          sourceKind: state.currentPlanContext.sourceKind,
        }
      : null,
    setupReadiness: state.setupReadiness,
    setup: state.setup
      ? {
          kind: state.setup.kind,
          projectCount: state.setup.projectCount,
          completedSteps: state.setup.completedSteps,
          missingSteps: state.setup.missingSteps,
          nextActionKey: state.setup.nextActionKey,
          targetRoute: state.setup.targetRoute,
          notes: state.setup.notes,
        }
      : undefined,
    orchestrationStatus: state.orchestrationStatus,
    nextStep: state.nextStep,
    canProceedToWorkspaceSetup: state.canProceedToWorkspaceSetup,
    canProceedToDashboard: state.canProceedToDashboard,
    warnings: state.warnings,
    notes: state.notes,
  };

  const parsed = PlanFitOrchestrationResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Orchestration response validation failed", details: parsed.error.flatten() },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed.data);
}
