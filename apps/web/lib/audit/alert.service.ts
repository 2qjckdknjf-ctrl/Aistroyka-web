/**
 * Platform alert recording (workflow, AI brain, copilot).
 * Uses existing alerts table; severity mapped to SRE-compatible values.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type PlatformAlertSeverity = "low" | "medium" | "high";
export type PlatformAlertSource = "workflow" | "ai_brain" | "copilot";

export interface RecordAlertParams {
  tenantId: string;
  projectId?: string | null;
  type: string;
  severity: PlatformAlertSeverity;
  title: string;
  body?: string | null;
  reason?: string | null;
  source: PlatformAlertSource;
  resourceType?: string | null;
  resourceId?: string | null;
}

const severityMap: Record<PlatformAlertSeverity, "info" | "warn" | "critical"> = {
  low: "info",
  medium: "warn",
  high: "critical",
};

/** Record a platform alert (workflow/AI/copilot). Best-effort; does not throw. */
export async function recordAlert(
  supabase: SupabaseClient,
  params: RecordAlertParams
): Promise<void> {
  try {
    const message = params.body ? `${params.title}\n${params.body}` : params.title;
    await supabase.from("alerts").insert({
      tenant_id: params.tenantId,
      severity: severityMap[params.severity],
      type: params.source,
      message,
    });
    // TODO: if alerts table gains project_id, reason, resource_type/id columns, persist them
  } catch {
    // Best-effort
  }
}
