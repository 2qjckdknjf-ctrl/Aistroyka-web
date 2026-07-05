/** Client-safe ROMA audit run history constants (no server/crypto imports). */

export const ROMA_AUDIT_RUN_HISTORY_META = {
  persistenceEnabled: true,
  autoSaveEnabled: false,
  listLimit: 20,
  saveApiPath: "/api/v1/platform/testing/safe-audit/save",
  listApiPath: "/api/v1/platform/testing/safe-audit/runs",
} as const;
