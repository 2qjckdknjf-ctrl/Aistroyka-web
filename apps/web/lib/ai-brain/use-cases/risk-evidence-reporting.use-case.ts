/**
 * Use cases: getRiskOverview, getEvidenceCoverage, getReportingDiscipline, getActionRecommendations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskSignal } from "@/lib/ai-brain/domain";
import {
  getRiskSignals,
  getRiskOverview,
  getReportSignals,
  getEvidenceSignals,
  getActionRecommendations,
} from "@/lib/ai-brain/services";

export async function getRiskOverviewForProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<{ high: number; medium: number; low: number; signals: RiskSignal[] }> {
  const signals = await getRiskSignals(supabase, projectId, tenantId);
  return { ...getRiskOverview(signals), signals };
}

export async function getEvidenceCoverageForProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<{ signals: Awaited<ReturnType<typeof getEvidenceSignals>> }> {
  const signals = await getEvidenceSignals(supabase, projectId, tenantId);
  return { signals };
}

export async function getReportingDisciplineForProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<{ signals: Awaited<ReturnType<typeof getReportSignals>> }> {
  const signals = await getReportSignals(supabase, projectId, tenantId);
  return { signals };
}

export async function getActionRecommendationsForProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
) {
  return getActionRecommendations(supabase, projectId, tenantId);
}
