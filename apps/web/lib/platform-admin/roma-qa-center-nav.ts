import { PLATFORM_ADMIN_BASE_PATH } from "./constants";
import type { RomaQaCenterSectionId } from "./roma-qa-center.types";

export type RomaQaCenterNavId =
  | RomaQaCenterSectionId
  | "quality-graph"
  | "test-catalog"
  | "change-intelligence"
  | "execution-planner"
  | "execution-engine"
  | "safe-audit"
  | "audit-runs";

export type RomaQaCenterNavItem = {
  id: RomaQaCenterNavId;
  href: string;
  label: string;
  exact?: boolean;
};

const TESTING_BASE = `${PLATFORM_ADMIN_BASE_PATH}/testing`;

/** ROMA QA Center left/sub navigation (V1). */
export const ROMA_QA_CENTER_NAV_ITEMS: readonly RomaQaCenterNavItem[] = [
  { id: "dashboard", href: TESTING_BASE, label: "Dashboard", exact: true },
  { id: "quality-graph", href: `${TESTING_BASE}/quality-graph`, label: "Quality Graph", exact: true },
  { id: "test-catalog", href: `${TESTING_BASE}/test-catalog`, label: "Test Catalog", exact: true },
  { id: "change-intelligence", href: `${TESTING_BASE}/change-intelligence`, label: "Change Intelligence", exact: true },
  { id: "execution-planner", href: `${TESTING_BASE}/execution-planner`, label: "Execution Planner", exact: true },
  { id: "execution-engine", href: `${TESTING_BASE}/execution-engine`, label: "Execution Engine", exact: true },
  { id: "safe-audit", href: `${TESTING_BASE}/safe-audit`, label: "Safe Audit", exact: true },
  { id: "audit-runs", href: `${TESTING_BASE}/audit-runs`, label: "Audit Runs", exact: true },
  { id: "audits", href: `${TESTING_BASE}/audits`, label: "Audits" },
  { id: "web", href: `${TESTING_BASE}/web`, label: "Web" },
  { id: "mobile", href: `${TESTING_BASE}/mobile`, label: "Mobile" },
  { id: "backend", href: `${TESTING_BASE}/backend`, label: "Backend" },
  { id: "ai", href: `${TESTING_BASE}/ai`, label: "AI Review" },
  { id: "security", href: `${TESTING_BASE}/security`, label: "Security" },
  { id: "performance", href: `${TESTING_BASE}/performance`, label: "Performance" },
  { id: "regression", href: `${TESTING_BASE}/regression`, label: "Regression" },
  { id: "coverage", href: `${TESTING_BASE}/coverage`, label: "Coverage" },
  { id: "history", href: `${TESTING_BASE}/history`, label: "History" },
  { id: "reports", href: `${TESTING_BASE}/reports`, label: "Reports" },
] as const;

export function isRomaQaCenterNavPath(pathWithoutLocale: string): boolean {
  return (
    pathWithoutLocale === `${PLATFORM_ADMIN_BASE_PATH}/testing` ||
    pathWithoutLocale.startsWith(`${PLATFORM_ADMIN_BASE_PATH}/testing/`)
  );
}
