/**
 * GET /api/v1/platform/billing/workspace-status?workspaceId=...
 * Internal: workspace billing pilot diagnostics (Step 19) + E2E execution status (Step 20). Platform owner only.
 */

import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/platform-owner/require-platform-owner-api";
import { getAdminClient } from "@/lib/supabase/admin";
import { getBillingPilotWorkspaceDiagnostics } from "@/lib/platform/billing-readiness/billing-pilot-ops.service";
import {
  getBillingPilotExecutionStatus,
  getBillingPilotOperatorActions,
} from "@/lib/platform/billing-readiness/billing-pilot-execution.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePlatformOwnerApi(request, { mode: "read" });
  if (!auth.ok) return auth.response;

const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId query param required" }, { status: 400 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const diagnostics = await getBillingPilotWorkspaceDiagnostics(admin, workspaceId);
  if (!diagnostics) {
    return NextResponse.json({ error: "Failed to load diagnostics" }, { status: 500 });
  }

  const executionStatus = await getBillingPilotExecutionStatus(admin, workspaceId);
  const operatorActions = getBillingPilotOperatorActions(executionStatus);

  return NextResponse.json({
    ...diagnostics,
    executionStatus: {
      stage: executionStatus.stage,
      suggestedOperatorAction: executionStatus.suggestedOperatorAction,
      suggestedOperatorHint: executionStatus.suggestedOperatorHint,
      attentionReasons: executionStatus.attentionReasons,
      isSandbox: executionStatus.isSandbox,
    },
    operatorActions,
  });
}
