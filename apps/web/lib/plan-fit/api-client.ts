/**
 * Thin client for plan-fit API. No orchestration logic; only fetch wrappers.
 * Decisions come from server; client branches on response.
 */

import type { PlanFitRecommendRequest } from "@/lib/platform/plan-fit/plan-fit-api.schema";
import type { PlanFitOrchestrationResponse } from "@/lib/platform/plan-fit/plan-fit-api.schema";
import type { PlanSurfaceViewModel } from "@/lib/platform/plan-fit/plan-surface.types";

const BASE = "/api/v1/plan-fit";

export async function fetchOrchestration(): Promise<PlanFitOrchestrationResponse> {
  const res = await fetch(`${BASE}/orchestration`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Orchestration failed: ${res.status}`);
  }
  return res.json();
}

export async function submitRecommendation(
  input: PlanFitRecommendRequest
): Promise<{ id: string; recommendedPlanCode: string; alternativePlanCodes: string[]; enterpriseSignal: boolean; reasoningCodes: string[]; createdAt: string }> {
  const res = await fetch(`${BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Recommendation failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchLatestRecommendation(): Promise<{
  recommendation: {
    id: string;
    recommendedPlanCode: string;
    alternativePlanCodes: string[];
    enterpriseSignal: boolean;
    reasoningCodes: string[];
    createdAt: string;
  } | null;
}> {
  const res = await fetch(`${BASE}/recommend/latest`, { credentials: "include" });
  if (!res.ok) throw new Error(`Latest recommendation failed: ${res.status}`);
  return res.json();
}

export async function selectPlan(params: {
  canonicalPlanCode: string;
  sourceKind?: string;
  addOnCodes?: string[];
}): Promise<{ tenantId: string; canonicalPlanCode: string; sourceKind: string; selectedAt: string }> {
  const res = await fetch(`${BASE}/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Select plan failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchCurrentPlan(): Promise<{
  current: {
    tenantId: string;
    canonicalPlanCode: string;
    sourceKind: string;
    selectedByUserId: string | null;
    selectedAt: string;
    addOnCodes: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
}> {
  const res = await fetch(`${BASE}/current`, { credentials: "include" });
  if (!res.ok) throw new Error(`Current plan failed: ${res.status}`);
  return res.json();
}

export type PlanSurfaceResponse = {
  surface: PlanSurfaceViewModel;
  fallback?: boolean;
  error?: string;
};

export async function fetchPlanSurface(): Promise<PlanSurfaceResponse> {
  const res = await fetch(`${BASE}/surface`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `Plan surface failed: ${res.status}`);
  }
  return res.json();
}
