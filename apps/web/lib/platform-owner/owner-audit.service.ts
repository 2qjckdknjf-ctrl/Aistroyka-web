import type { SupabaseClient } from "@supabase/supabase-js";

export type OwnerAuditInput = {
  user_id: string | null;
  action: string;
  entity?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

/**
 * Append-only owner audit (service role). Fails closed to logs only if admin unavailable.
 */
export async function insertPlatformOwnerAudit(
  admin: SupabaseClient | null,
  row: OwnerAuditInput
): Promise<void> {
  if (!admin) {
    console.warn(
      JSON.stringify({ type: "owner_audit_skip", reason: "no_admin_client", action: row.action })
    );
    return;
  }
  const { error } = await admin.from("platform_owner_audit_log").insert({
    user_id: row.user_id,
    action: row.action,
    entity: row.entity ?? null,
    entity_id: row.entity_id ?? null,
    metadata: row.metadata ?? null,
    ip: row.ip ?? null,
  });
  if (error) {
    console.error(
      JSON.stringify({
        type: "owner_audit_insert_failed",
        message: error.message,
        action: row.action,
      })
    );
  }
}
