import { PLATFORM_ADMIN_BASE_PATH } from "./constants";
import type { RomaQaCenterSectionId } from "./roma-qa-center.types";

const TESTING_BASE = `${PLATFORM_ADMIN_BASE_PATH}/testing`;

/** Platform domain overview sections — canonical `[section]` routes. */
export const ROMA_QA_CENTER_PLATFORM_SECTION_IDS = [
  "web",
  "mobile",
  "backend",
  "ai",
  "security",
] as const satisfies readonly RomaQaCenterSectionId[];

export type RomaQaCenterPlatformSectionId = (typeof ROMA_QA_CENTER_PLATFORM_SECTION_IDS)[number];

/** Legacy V1 section slugs → canonical module routes (permanent redirects). */
export const ROMA_QA_CENTER_LEGACY_REDIRECTS: Readonly<
  Record<string, `${typeof TESTING_BASE}${string}`>
> = {
  audits: `${TESTING_BASE}/safe-audit`,
  history: `${TESTING_BASE}/audit-runs`,
  regression: `${TESTING_BASE}/change-intelligence`,
  coverage: `${TESTING_BASE}/quality-graph`,
  performance: TESTING_BASE,
  reports: TESTING_BASE,
} as const;

export function getRomaLegacyRedirectTarget(section: string): string | undefined {
  return ROMA_QA_CENTER_LEGACY_REDIRECTS[section];
}

export function isRomaQaCenterPlatformSectionId(value: string): value is RomaQaCenterPlatformSectionId {
  return (ROMA_QA_CENTER_PLATFORM_SECTION_IDS as readonly string[]).includes(value);
}

/** Canonical feature routes (one route per ROMA feature). */
export const ROMA_QA_CENTER_CANONICAL_ROUTES = {
  dashboard: TESTING_BASE,
  safeAudit: `${TESTING_BASE}/safe-audit`,
  auditHistory: `${TESTING_BASE}/audit-runs`,
  qualityGraph: `${TESTING_BASE}/quality-graph`,
  testCatalog: `${TESTING_BASE}/test-catalog`,
  changeIntelligence: `${TESTING_BASE}/change-intelligence`,
  executionPlanner: `${TESTING_BASE}/execution-planner`,
  executionEngine: `${TESTING_BASE}/execution-engine`,
  platformWeb: `${TESTING_BASE}/web`,
  platformMobile: `${TESTING_BASE}/mobile`,
  platformBackend: `${TESTING_BASE}/backend`,
  platformAi: `${TESTING_BASE}/ai`,
  platformSecurity: `${TESTING_BASE}/security`,
} as const;
