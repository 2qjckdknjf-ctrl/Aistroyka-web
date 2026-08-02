/**
 * Phase 3D route / API inventories — source of truth for contract tests.
 * Keep in sync with app/[locale]/(platform-admin) and app/api/v1/platform.
 */

import { ROMA_QA_CENTER_CANONICAL_ROUTES, ROMA_QA_CENTER_LEGACY_REDIRECTS } from "./roma-qa-center-routes";
import { OWNER_READONLY_ALLOWED_POST_PATH } from "@/lib/platform-owner/owner-capabilities";

export const PHASE3D_PLATFORM_CABINET_PATHS = [
  "/platform-admin",
  "/platform-admin/billing",
  "/platform-admin/leads",
] as const;

export const PHASE3D_OPERATIONS_CENTER_PATHS = Object.values(ROMA_QA_CENTER_CANONICAL_ROUTES);

export const PHASE3D_LEGACY_ROMA_REDIRECTS = ROMA_QA_CENTER_LEGACY_REDIRECTS;

/** Read APIs used by required Phase 3D browser proof (GET only). */
export const PHASE3D_REQUIRED_READ_APIS = [
  "/api/v1/platform/overview",
  "/api/v1/platform/health",
  "/api/v1/platform/billing/provider-status",
  "/api/v1/platform/leads",
  "/api/v1/platform/testing/quality",
  "/api/v1/platform/testing/safe-audit/runs",
] as const;

/** Mutations that required Phase 3D E2E must never invoke. */
export const PHASE3D_FORBIDDEN_MUTATION_PATH_PATTERNS = [
  "/api/v1/platform/testing/safe-audit/save",
  "/api/v1/platform/billing/process-pending-events",
  "/api/v1/platform/billing/reprocess-event",
  "/api/v1/platform/billing/reprocess-workspace-events",
  "/api/v1/platform/billing/pilot-workspaces",
  "/api/v1/platform/critical/",
  "/api/v1/platform/leads/bulk",
  "/api/v1/admin/flags",
] as const;

export const PHASE3D_SAFE_AUDIT_REFRESH_PATH = OWNER_READONLY_ALLOWED_POST_PATH;

export const PHASE3D_SAFE_AUDIT_SAVE_PATH = "/api/v1/platform/testing/safe-audit/save" as const;

export type Phase3dMutationClass = "read" | "write" | "critical" | "read_mode_post_exception";

export function classifyPlatformApiPath(pathname: string, method: string): Phase3dMutationClass {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return "read";
  if (pathname === PHASE3D_SAFE_AUDIT_REFRESH_PATH && m === "POST") return "read_mode_post_exception";
  if (pathname.includes("/critical/")) return "critical";
  return "write";
}
