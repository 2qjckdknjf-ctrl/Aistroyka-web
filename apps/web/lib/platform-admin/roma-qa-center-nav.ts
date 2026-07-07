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

export type RomaQaCenterNavGroup = {
  id: string;
  label: string;
  items: readonly RomaQaCenterNavItem[];
};

const TESTING_BASE = `${PLATFORM_ADMIN_BASE_PATH}/testing`;

/** Grouped ROMA system map navigation (executive IA V2). */
export const ROMA_QA_CENTER_NAV_GROUPS: readonly RomaQaCenterNavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ id: "dashboard", href: TESTING_BASE, label: "Dashboard", exact: true }],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "safe-audit", href: `${TESTING_BASE}/safe-audit`, label: "Safe Audit", exact: true },
      { id: "audit-runs", href: `${TESTING_BASE}/audit-runs`, label: "Audit History", exact: true },
    ],
  },
  {
    id: "quality",
    label: "Quality",
    items: [
      { id: "quality-graph", href: `${TESTING_BASE}/quality-graph`, label: "Quality Graph", exact: true },
      { id: "test-catalog", href: `${TESTING_BASE}/test-catalog`, label: "Test Catalog", exact: true },
      {
        id: "change-intelligence",
        href: `${TESTING_BASE}/change-intelligence`,
        label: "Change Intelligence",
        exact: true,
      },
    ],
  },
  {
    id: "execution",
    label: "Execution",
    items: [
      {
        id: "execution-planner",
        href: `${TESTING_BASE}/execution-planner`,
        label: "Planner",
        exact: true,
      },
      {
        id: "execution-engine",
        href: `${TESTING_BASE}/execution-engine`,
        label: "Engine",
        exact: true,
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      { id: "web", href: `${TESTING_BASE}/web`, label: "Web" },
      { id: "mobile", href: `${TESTING_BASE}/mobile`, label: "Mobile" },
      { id: "ai", href: `${TESTING_BASE}/ai`, label: "AI" },
      { id: "security", href: `${TESTING_BASE}/security`, label: "Security" },
    ],
  },
] as const;

/** Flat nav list (derived from groups — routes unchanged). */
export const ROMA_QA_CENTER_NAV_ITEMS: readonly RomaQaCenterNavItem[] = ROMA_QA_CENTER_NAV_GROUPS.flatMap(
  (group) => group.items
);

export function isRomaQaCenterNavPath(pathWithoutLocale: string): boolean {
  return (
    pathWithoutLocale === `${PLATFORM_ADMIN_BASE_PATH}/testing` ||
    pathWithoutLocale.startsWith(`${PLATFORM_ADMIN_BASE_PATH}/testing/`)
  );
}
