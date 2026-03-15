/**
 * Project risks repository: fetches explicit project_risks for intelligence.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskSignal } from "../domain";

export async function getExplicitProjectRisks(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<RiskSignal[]> {
  const { data } = await supabase
    .from("project_risks")
    .select("id, title, description, severity")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId);

  const at = new Date().toISOString();
  return (data ?? []).map((r) => ({
    projectId,
    source: "manual" as const,
    severity: (r.severity ?? "medium") as RiskSignal["severity"],
    title: r.title,
    description: r.description ?? undefined,
    at,
    resourceType: "project_risk",
    resourceId: r.id,
  }));
}
