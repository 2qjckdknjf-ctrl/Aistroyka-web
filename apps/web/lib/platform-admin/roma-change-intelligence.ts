import {
  analyzeChangeImpact,
  getAffectedAreasForChange,
  getNodeById,
  getQualityGraph,
  getReleaseGateImpact,
  getRequiredTestDomainsForAffectedAreas,
  getRisksForAffectedAreas,
} from "./roma-quality-graph";
import type { RomaQualityGraphChangeInput } from "./roma-quality-graph.types";
import {
  getTestsForAffectedAreas,
  getTestsForGraphNodes,
} from "./roma-test-catalog";
import type { RomaTestCatalogDomain } from "./roma-test-catalog.types";
import type {
  RomaChangeConfidence,
  RomaChangeIntelligenceResult,
  RomaChangeReleaseImpact,
  RomaChangeRiskLevel,
  RomaChangeSetInput,
  RomaSkippedDomain,
} from "./roma-change-intelligence.types";

/** Graph test_domain node → catalog domain. */
const GRAPH_TEST_DOMAIN_TO_CATALOG: Record<string, RomaTestCatalogDomain> = {
  "td-web-e2e": "web",
  "td-backend-api": "backend",
  "td-mobile-ios": "mobile_ios",
  "td-mobile-android": "mobile_android",
  "td-ai-safety": "ai",
  "td-security-rbac": "security",
  "td-performance": "performance",
  "td-accessibility": "accessibility",
  "td-visual-design": "visual",
  "td-release-smoke": "release",
};

const MOBILE_APP_ALIASES: Record<string, string> = {
  "ios-manager": "mobile-ios-manager",
  "ios-worker": "mobile-ios-worker",
  "android-manager": "mobile-android-manager",
  "android-worker": "mobile-android-worker",
};

const ALL_CATALOG_DOMAINS: readonly RomaTestCatalogDomain[] = [
  "web",
  "backend",
  "database",
  "security",
  "ai",
  "mobile_ios",
  "mobile_android",
  "performance",
  "accessibility",
  "ux",
  "visual",
  "release",
  "pilot",
  "business_flow",
];

/** Path-triggered catalog domain requirements (V1 rules). */
const PATH_CATALOG_DOMAIN_RULES: readonly {
  match: (path: string) => boolean;
  domains: readonly RomaTestCatalogDomain[];
}[] = [
  {
    match: (p) => /api\/v1\/reports|reports\//i.test(p),
    domains: ["backend", "business_flow", "mobile_ios", "mobile_android"],
  },
  {
    match: (p) => /auth|session|middleware|login|supabase\/auth/i.test(p),
    domains: ["security", "backend", "web", "release"],
  },
  {
    match: (p) => /platform-admin|platform.owner|platform_owner/i.test(p),
    domains: ["security", "web", "release"],
  },
  {
    match: (p) => /copilot|\/ai\/|openai|llm|vision/i.test(p),
    domains: ["ai", "backend", "security"],
  },
  {
    match: (p) => /^ios\//i.test(p) || /ios\/Shared/i.test(p),
    domains: ["mobile_ios"],
  },
  {
    match: (p) => /^android\//i.test(p),
    domains: ["mobile_android"],
  },
  {
    match: (p) => /upload|storage|bucket/i.test(p),
    domains: ["backend", "business_flow"],
  },
  {
    match: (p) => /wrangler|deploy|\.github\/workflows/i.test(p),
    domains: ["release"],
  },
  {
    match: (p) => /rls|tenant.isol|migration/i.test(p),
    domains: ["database", "security"],
  },
];

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function isDocsOnlyChange(paths: readonly string[]): boolean {
  if (paths.length === 0) return false;
  return paths.every(
    (p) =>
      /^docs\//i.test(p) ||
      /\.md$/i.test(p) ||
      /^README/i.test(p) ||
      /\/audits\//i.test(p)
  );
}

function isSecurityOrReleaseDoc(paths: readonly string[]): boolean {
  return paths.some((p) => /docs\/(security|release|audits\/ROMA)/i.test(p));
}

function toGraphInput(input: RomaChangeSetInput): RomaQualityGraphChangeInput {
  const extraPaths: string[] = [];
  for (const app of input.changedMobileApps ?? []) {
    const key = app.toLowerCase();
    if (key.includes("ios")) extraPaths.push("ios/");
    if (key.includes("android")) extraPaths.push("android/");
    if (key.includes("manager")) extraPaths.push("manager");
    if (key.includes("worker")) extraPaths.push("reports");
  }
  for (const env of input.changedEnv ?? []) {
    if (/wrangler|cloudflare|deploy/i.test(env)) extraPaths.push(".github/workflows");
  }
  return {
    changedPaths: [...input.changedPaths, ...extraPaths],
    changedModules: input.changedModules,
    changedApis: input.changedApis,
  };
}

function resolveMobileAppIds(input: RomaChangeSetInput, graphMobileIds: readonly string[]): string[] {
  const fromInput = (input.changedMobileApps ?? [])
    .map((app) => MOBILE_APP_ALIASES[app.toLowerCase()] ?? app)
    .filter((id) => getNodeById(id)?.type === "mobile_app");
  return uniqueStrings([...graphMobileIds, ...fromInput]);
}

function collectSurfacesForAreas(areaIds: readonly string[]): string[] {
  const graph = getQualityGraph();
  const surfaces: string[] = [];
  for (const e of graph.edges) {
    if (e.type === "exposes" && areaIds.includes(e.targetId)) {
      surfaces.push(e.sourceId);
    }
  }
  return uniqueStrings(surfaces);
}

function catalogDomainsFromGraphTestDomains(testDomainIds: readonly string[]): RomaTestCatalogDomain[] {
  const domains: RomaTestCatalogDomain[] = [];
  for (const id of testDomainIds) {
    const mapped = GRAPH_TEST_DOMAIN_TO_CATALOG[id];
    if (mapped) domains.push(mapped);
  }
  return uniqueStrings(domains) as RomaTestCatalogDomain[];
}

function catalogDomainsFromPaths(paths: readonly string[]): RomaTestCatalogDomain[] {
  const domains: RomaTestCatalogDomain[] = [];
  for (const path of paths) {
    for (const rule of PATH_CATALOG_DOMAIN_RULES) {
      if (rule.match(path)) domains.push(...rule.domains);
    }
    if (/auth|rbac|middleware/i.test(path)) domains.push("security");
  }
  return uniqueStrings(domains) as RomaTestCatalogDomain[];
}

function computeRequiredCatalogDomains(
  input: RomaChangeSetInput,
  testDomainIds: readonly string[],
  areaIds: readonly string[]
): { domains: RomaTestCatalogDomain[]; skipped: RomaSkippedDomain[] } {
  const skipped: RomaSkippedDomain[] = [];
  const domains = uniqueStrings([
    ...catalogDomainsFromGraphTestDomains(testDomainIds),
    ...catalogDomainsFromPaths(input.changedPaths),
  ]) as RomaTestCatalogDomain[];

  if (isDocsOnlyChange(input.changedPaths)) {
    const filtered: RomaTestCatalogDomain[] = isSecurityOrReleaseDoc(input.changedPaths)
      ? domains.filter((d) => d === "security" || d === "release")
      : [];
    for (const d of ALL_CATALOG_DOMAINS) {
      if (!filtered.includes(d)) {
        skipped.push({ domain: d, reason: "Docs-only change — domain not required unless security/release doc" });
      }
    }
    return { domains: filtered, skipped };
  }

  for (const d of ALL_CATALOG_DOMAINS) {
    if (!domains.includes(d)) {
      skipped.push({ domain: d, reason: "No graph or path rule matched this domain" });
    }
  }
  return { domains, skipped };
}

function computeConfidence(
  input: RomaChangeSetInput,
  areaIds: readonly string[],
  docsOnly: boolean
): RomaChangeConfidence {
  if (docsOnly) return "low";
  if (areaIds.length === 0) return "unknown";
  const hasExplicitSignal =
    (input.changedApis?.length ?? 0) > 0 ||
    (input.changedModules?.length ?? 0) > 0 ||
    (input.changedMobileApps?.length ?? 0) > 0;
  const pathMatches = input.changedPaths.some((p) =>
    PATH_CATALOG_DOMAIN_RULES.some((r) => r.match(p))
  );
  if (areaIds.length >= 2 || (hasExplicitSignal && pathMatches)) return "high";
  if (areaIds.length >= 1 && pathMatches) return "medium";
  if (areaIds.length >= 1) return "medium";
  return "unknown";
}

function computeRiskLevel(riskIds: readonly string[], areaIds: readonly string[]): RomaChangeRiskLevel {
  if (areaIds.length === 0) return "unknown";
  const graph = getQualityGraph();
  const riskNodes = riskIds.map((id) => graph.nodes.find((n) => n.id === id)).filter(Boolean);
  if (riskNodes.some((n) => n?.criticality === "critical")) return "critical";
  if (riskNodes.some((n) => n?.criticality === "high")) return "high";
  const criticalAreas = areaIds.filter((id) => getNodeById(id)?.criticality === "critical");
  if (criticalAreas.length >= 2) return "high";
  if (criticalAreas.length === 1) return "medium";
  return "low";
}

export function getAffectedGraphNodes(input: RomaChangeSetInput): readonly string[] {
  const graphInput = toGraphInput(input);
  const impact = analyzeChangeImpact(graphInput);
  return uniqueStrings([
    ...impact.productAreaIds,
    ...impact.roleIds,
    ...impact.apiIds,
    ...impact.mobileAppIds,
    ...impact.testDomainIds,
    ...impact.riskIds,
    ...impact.releaseGateIds,
    ...collectSurfacesForAreas(impact.productAreaIds),
  ]);
}

export function selectTestsForChange(input: RomaChangeSetInput): readonly string[] {
  const graphInput = toGraphInput(input);
  const areaIds = getAffectedAreasForChange(graphInput);
  const graphNodeIds = getAffectedGraphNodes(input);

  const fromAreas = getTestsForAffectedAreas(areaIds);
  const fromNodes = getTestsForGraphNodes(graphNodeIds);
  const merged = new Map<string, (typeof fromAreas)[0]>();
  for (const test of [...fromAreas, ...fromNodes]) {
    merged.set(test.testId, test);
  }

  let tests = [...merged.values()];

  if (isDocsOnlyChange(input.changedPaths) && !isSecurityOrReleaseDoc(input.changedPaths)) {
    tests = tests.filter((t) => !t.releaseCritical);
  }

  return uniqueStrings(tests.map((t) => t.testId)).sort();
}

export function calculateChangeRisk(input: RomaChangeSetInput): RomaChangeRiskLevel {
  const graphInput = toGraphInput(input);
  const areaIds = getAffectedAreasForChange(graphInput);
  const riskIds = getRisksForAffectedAreas(areaIds);
  return computeRiskLevel(riskIds, areaIds);
}

export function explainChangeImpact(input: RomaChangeSetInput): string {
  const result = analyzeChangeSet(input);
  const areaLabels = result.affectedAreas
    .map((id) => getNodeById(id)?.label ?? id)
    .join(", ");
  const parts = [
    result.explanation,
    result.affectedAreas.length > 0
      ? `Affected product areas: ${areaLabels}.`
      : "No product areas mapped — path rules did not match known modules.",
    `Release impact: ${result.releaseImpact}. Confidence: ${result.confidence}. Risk: ${result.riskLevel}.`,
    result.recommendedCatalogTests.length > 0
      ? `${result.recommendedCatalogTests.length} catalog test(s) recommended (disabled — registry only).`
      : "No catalog tests recommended for this change set.",
  ];
  return parts.join(" ");
}

export function analyzeChangeSet(input: RomaChangeSetInput): RomaChangeIntelligenceResult {
  const graphInput = toGraphInput(input);
  const docsOnly = isDocsOnlyChange(input.changedPaths);
  const impact = analyzeChangeImpact(graphInput);
  const releaseGate = getReleaseGateImpact(impact.productAreaIds);
  const surfaces = collectSurfacesForAreas(impact.productAreaIds);
  const mobileApps = resolveMobileAppIds(input, impact.mobileAppIds);
  const { domains: requiredDomains, skipped } = computeRequiredCatalogDomains(
    input,
    impact.testDomainIds,
    impact.productAreaIds
  );
  const recommendedTests = selectTestsForChange(input);
  const confidence = computeConfidence(input, impact.productAreaIds, docsOnly);
  const riskLevel = computeRiskLevel(impact.riskIds, impact.productAreaIds);

  let releaseImpact: RomaChangeReleaseImpact = releaseGate.confidenceImpact;
  if (docsOnly && !isSecurityOrReleaseDoc(input.changedPaths)) {
    releaseImpact = "none";
  }

  let explanation: string;
  if (docsOnly) {
    explanation = isSecurityOrReleaseDoc(input.changedPaths)
      ? "Documentation change in security/release scope — review recommended, low execution impact."
      : "Docs-only change — low release impact; no release-critical tests unless security/release docs.";
  } else if (impact.productAreaIds.length === 0) {
    explanation =
      "UNKNOWN: supplied paths did not match V1 graph rules. Manual review required before release.";
  } else {
    explanation = `Change intelligence mapped ${impact.productAreaIds.length} product area(s), ${impact.riskIds.length} risk(s), and ${requiredDomains.length} test domain(s) via Quality Graph and Test Catalog.`;
  }

  return {
    version: "v1",
    executionEnabled: false,
    affectedAreas: impact.productAreaIds,
    affectedRoles: impact.roleIds,
    affectedSurfaces: surfaces,
    affectedApis: impact.apiIds,
    affectedMobileApps: mobileApps,
    affectedRisks: impact.riskIds,
    requiredTestDomains: requiredDomains,
    recommendedCatalogTests: recommendedTests,
    releaseImpact,
    confidence,
    riskLevel,
    explanation,
    skippedDomains: skipped,
    graphNodeIds: getAffectedGraphNodes(input),
  };
}

/** Static V1 example scenarios for UI (read-only simulation — not live git). */
export const ROMA_CHANGE_INTELLIGENCE_EXAMPLES: readonly {
  label: string;
  input: RomaChangeSetInput;
}[] = [
  {
    label: "Reports API + iOS Worker sync",
    input: {
      changedPaths: ["apps/web/app/api/v1/reports/route.ts", "ios/Shared/Sync/ReportSync.swift"],
      changedApis: ["api-reports", "api-upload-storage"],
      changedMobileApps: ["ios-worker"],
    },
  },
  {
    label: "Auth middleware + session",
    input: {
      changedPaths: ["apps/web/middleware.ts", "apps/web/lib/supabase/session.ts"],
      changedModules: ["auth"],
    },
  },
  {
    label: "Platform Admin shell",
    input: {
      changedPaths: ["apps/web/lib/platform-admin/shell-nav.ts"],
      changedModules: ["platform-admin"],
    },
  },
  {
    label: "AI Copilot provider",
    input: {
      changedPaths: ["apps/web/lib/ai/copilot-handler.ts"],
      changedApis: ["api-ai"],
      changedModules: ["copilot"],
    },
  },
  {
    label: "Docs-only (launch runbook)",
    input: {
      changedPaths: ["docs/launch/P4_PROJECT_SETUP_RUNBOOK.md"],
    },
  },
  {
    label: "Unknown path",
    input: {
      changedPaths: ["tools/experimental/unknown-module.ts"],
    },
  },
];

export function getChangeIntelligenceEngine(): { version: "v1"; executionEnabled: false } {
  return { version: "v1", executionEnabled: false };
}
