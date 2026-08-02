/**
 * Operations Center read vs persist taxonomy (Phase 3D).
 * Tenant/business state is never mutated by Operations Center probes.
 */

export const SAFE_AUDIT_REFRESH_SEMANTICS = {
  path: "/api/v1/platform/testing/safe-audit/refresh",
  persistsRomaAuditRuns: false,
  mutatesTenantBusinessState: false,
  mode: "read" as const,
  label: "non-persistent live probe recompute",
} as const;

export const SAFE_AUDIT_SAVE_SEMANTICS = {
  path: "/api/v1/platform/testing/safe-audit/save",
  persistsRomaAuditRuns: true,
  mutatesTenantBusinessState: false,
  mode: "write" as const,
  label: "controlled audit-artifact persistence",
} as const;

export function isSafeAuditRefreshPath(pathname: string): boolean {
  return pathname === SAFE_AUDIT_REFRESH_SEMANTICS.path;
}

export function isSafeAuditSavePath(pathname: string): boolean {
  return pathname === SAFE_AUDIT_SAVE_SEMANTICS.path;
}

export function describeOperationsCenterMutationPolicy(): {
  tenantBusinessMutations: false;
  refreshPersistsHistory: false;
  savePersistsHistory: true;
  requiredE2eMayCallSave: false;
} {
  return {
    tenantBusinessMutations: false,
    refreshPersistsHistory: false,
    savePersistsHistory: true,
    requiredE2eMayCallSave: false,
  };
}
