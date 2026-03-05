import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job } from "../job.types";
import { emitAudit } from "@/lib/observability/audit.service";

/**
 * Retention cleanup: for tenant, apply data_retention_policies (archive old upload_sessions).
 * No hard-delete; set archived_at. Emit audit.
 */
export async function handleRetentionCleanup(supabase: SupabaseClient, job: Job): Promise<void> {
  const payload = job.payload as { tenant_id?: string };
  const tenantId = payload?.tenant_id ?? job.tenant_id;
  if (!tenantId) return;

  const { data: policy } = await supabase
    .from("data_retention_policies")
    .select("media_retention_days")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const days = (policy as { media_retention_days?: number } | null)?.media_retention_days;
  if (days == null || days <= 0) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const { data: updated } = await supabase
    .from("upload_sessions")
    .update({ archived_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .lt("created_at", cutoffStr)
    .is("archived_at", null)
    .select("id");

  const count = (updated ?? []).length;
  await emitAudit(supabase, {
    tenant_id: tenantId,
    action: "retention_cleanup",
    resource_type: "upload_sessions",
    details: { archived_count: count, retention_days: days },
  });
}
