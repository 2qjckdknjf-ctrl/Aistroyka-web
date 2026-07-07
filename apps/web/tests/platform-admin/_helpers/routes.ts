import { ROMA_QA_CENTER_CANONICAL_ROUTES } from "../../../lib/platform-admin/roma-qa-center-routes";

export const PLATFORM_ADMIN_LOCALE = process.env.E2E_LOCALE ?? "en";

/** Locale-prefixed Operations Center routes for Playwright navigation. */
export const ROMA_VISUAL_ROUTES = [
  { id: "dashboard", label: "Executive Dashboard", path: ROMA_QA_CENTER_CANONICAL_ROUTES.dashboard },
  { id: "safe-audit", label: "Safe Audit", path: ROMA_QA_CENTER_CANONICAL_ROUTES.safeAudit },
  { id: "audit-history", label: "Audit History", path: ROMA_QA_CENTER_CANONICAL_ROUTES.auditHistory },
  { id: "quality-graph", label: "Quality Graph", path: ROMA_QA_CENTER_CANONICAL_ROUTES.qualityGraph },
  {
    id: "change-intelligence",
    label: "Change Intelligence",
    path: ROMA_QA_CENTER_CANONICAL_ROUTES.changeIntelligence,
  },
  {
    id: "execution-planner",
    label: "Execution Planner",
    path: ROMA_QA_CENTER_CANONICAL_ROUTES.executionPlanner,
  },
  {
    id: "execution-engine",
    label: "Execution Engine",
    path: ROMA_QA_CENTER_CANONICAL_ROUTES.executionEngine,
  },
] as const;

export function localePlatformAdminPath(routePath: string): string {
  const normalized = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `/${PLATFORM_ADMIN_LOCALE}${normalized}`;
}

export function absolutePlatformAdminUrl(baseURL: string, routePath: string): string {
  return `${baseURL.replace(/\/$/, "")}${localePlatformAdminPath(routePath)}`;
}
