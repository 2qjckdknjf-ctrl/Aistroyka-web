/**
 * Pure validation mirror of jobs_protect_payload_project_tenant() trigger logic.
 * Used for unit tests and documentation parity with SQL migration.
 */

export type JobsPayloadTenantGuardResult =
  | { ok: true }
  | { ok: false; reason: "invalid_uuid" | "foreign_project" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateJobsPayloadProjectTenant(
  projectId: string | null | undefined,
  tenantId: string,
  isProjectOwnedByTenant: (projectId: string, tenantId: string) => boolean
): JobsPayloadTenantGuardResult {
  const claimed = typeof projectId === "string" ? projectId.trim() : "";
  if (!claimed) return { ok: true };
  if (!UUID_RE.test(claimed)) return { ok: false, reason: "invalid_uuid" };
  if (!isProjectOwnedByTenant(claimed, tenantId)) {
    return { ok: false, reason: "foreign_project" };
  }
  return { ok: true };
}
