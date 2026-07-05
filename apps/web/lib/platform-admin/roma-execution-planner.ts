import { analyzeChangeSet, selectTestsForChange } from "./roma-change-intelligence";
import type { RomaChangeSetInput } from "./roma-change-intelligence.types";
import { getTestById, getTestCatalog } from "./roma-test-catalog";
import type { RomaTestCatalogDomain, RomaTestCatalogItem } from "./roma-test-catalog.types";
import type {
  RomaBlockedTest,
  RomaExecutionPhase,
  RomaExecutionPhaseId,
  RomaExecutionPlan,
  RomaPlannedTest,
  RomaSkippedTest,
} from "./roma-execution-planner.types";

const PHASE_DEFINITIONS: readonly {
  phaseId: RomaExecutionPhaseId;
  label: string;
  description: string;
  domains: readonly RomaTestCatalogDomain[];
}[] = [
  {
    phaseId: 0,
    label: "Phase 0 — Static / metadata checks",
    description: "i18n, visual compliance, docs/release metadata, CI gate audits.",
    domains: ["visual", "release", "pilot"],
  },
  {
    phaseId: 1,
    label: "Phase 1 — Backend/API checks",
    description: "API contracts, auth, storage, jobs, migrations.",
    domains: ["backend", "database", "business_flow"],
  },
  {
    phaseId: 2,
    label: "Phase 2 — Web/UI checks",
    description: "Routing, forms, localization, dashboard UX.",
    domains: ["web", "ux"],
  },
  {
    phaseId: 3,
    label: "Phase 3 — Security/RBAC checks",
    description: "Platform owner gates, tenant isolation, headers, secrets.",
    domains: ["security"],
  },
  {
    phaseId: 4,
    label: "Phase 4 — Mobile checks",
    description: "iOS and Android Manager/Worker smoke and sync flows.",
    domains: ["mobile_ios", "mobile_android"],
  },
  {
    phaseId: 5,
    label: "Phase 5 — AI checks",
    description: "Provider health, prompt safety, leakage boundaries.",
    domains: ["ai"],
  },
  {
    phaseId: 6,
    label: "Phase 6 — Performance / accessibility",
    description: "CWV, API latency, axe audits.",
    domains: ["performance", "accessibility"],
  },
  {
    phaseId: 7,
    label: "Phase 7 — Release readiness review",
    description: "Deploy truth, buildStamp, release-critical catalog review.",
    domains: ["release", "pilot"],
  },
];

const CREDENTIAL_PATTERNS: readonly { pattern: RegExp; credential: string }[] = [
  { pattern: /E2E_USER|PILOT_E2E|SMOKE_/i, credential: "E2E_USER_EMAIL / PILOT_E2E_* credentials" },
  { pattern: /pilot cred|test user|worker cred|manager cred/i, credential: "Role-scoped test user credentials" },
  { pattern: /CLOUDFLARE_ACCESS|Access API/i, credential: "CLOUDFLARE_ACCESS_API_TOKEN" },
  { pattern: /AI provider|OPENAI|live provider/i, credential: "AI provider configured on staging" },
  { pattern: /service role|SUPABASE/i, credential: "SUPABASE_SERVICE_ROLE_KEY (audit only)" },
  { pattern: /GITHUB_REVIEWER|gh token/i, credential: "GITHUB_REVIEWER_TOKEN" },
];

const DEVICE_PATTERNS: readonly { pattern: RegExp; device: string }[] = [
  { pattern: /Xcode|simulator|UITest|iOS/i, device: "Xcode + iOS Simulator" },
  { pattern: /Android SDK|emulator|instrumented|Gradle/i, device: "Android SDK + Emulator" },
  { pattern: /physical device|device smoke/i, device: "Physical mobile device" },
  { pattern: /Lighthouse|browser devtools/i, device: "Desktop browser (manual perf)" },
];

/** V1 planner assumes credentials/devices unavailable — tests needing them are blocked. */
const PLANNER_HAS_CREDENTIALS = false;
const PLANNER_HAS_DEVICES = false;

function isDocsOnlyInput(input: RomaChangeSetInput): boolean {
  return (
    input.changedPaths.length > 0 &&
    input.changedPaths.every(
      (p) => /^docs\//i.test(p) || /\.md$/i.test(p) || /^README/i.test(p)
    )
  );
}

function isSecurityOrReleaseDoc(paths: readonly string[]): boolean {
  return paths.some((p) => /docs\/(security|release|audits\/ROMA)/i.test(p));
}

function planIdFromInput(input: RomaChangeSetInput): string {
  const key = [...input.changedPaths].sort().join("|");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0;
  }
  return `plan-v1-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function domainToPhase(domain: RomaTestCatalogDomain): RomaExecutionPhaseId {
  for (const phase of PHASE_DEFINITIONS) {
    if (phase.domains.includes(domain)) return phase.phaseId;
  }
  return 1;
}

function parseRuntimeMinutes(runtime: string): number {
  if (!runtime || runtime === "—") return 0;
  const match = runtime.match(/(\d+)\s*m/i);
  if (match) return Number.parseInt(match[1] ?? "0", 10);
  const sec = runtime.match(/(\d+)\s*s/i);
  if (sec) return Math.ceil(Number.parseInt(sec[1] ?? "0", 10) / 60);
  return 5;
}

function formatRuntime(totalMinutes: number): string {
  if (totalMinutes === 0) return "Unknown";
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function prerequisitesNeedCredentials(prerequisites: readonly string[]): string | undefined {
  if (!PLANNER_HAS_CREDENTIALS) {
    for (const prereq of prerequisites) {
      for (const { pattern, credential } of CREDENTIAL_PATTERNS) {
        if (pattern.test(prereq)) return `Missing credential: ${credential}`;
      }
    }
  }
  return undefined;
}

function prerequisitesNeedDevice(prerequisites: readonly string[]): string | undefined {
  if (!PLANNER_HAS_DEVICES) {
    for (const prereq of prerequisites) {
      for (const { pattern, device } of DEVICE_PATTERNS) {
        if (pattern.test(prereq)) return `Missing device: ${device}`;
      }
    }
  }
  return undefined;
}

function catalogDisabledReason(): string {
  return "Catalog test disabled — execution not enabled in V1";
}

function resolveBlockReason(item: RomaTestCatalogItem): string | undefined {
  const cred = prerequisitesNeedCredentials(item.prerequisites);
  if (cred) return cred;
  const device = prerequisitesNeedDevice(item.prerequisites);
  if (device) return device;
  if (!item.enabled) return catalogDisabledReason();
  return undefined;
}

function requiresManualReview(input: RomaChangeSetInput, analysis: ReturnType<typeof analyzeChangeSet>): boolean {
  if (analysis.confidence === "unknown") return true;
  const paths = input.changedPaths.join(" ");
  if (/platform-admin|platform_owner|tenant.isol|rls|rbac|middleware|auth|security/i.test(paths)) return true;
  if (analysis.affectedAreas.some((a) => /platform-admin|tenant-isolation|authentication/.test(a))) return true;
  if (analysis.riskLevel === "critical" || analysis.riskLevel === "high") return true;
  return false;
}

function buildRiskRationale(analysis: ReturnType<typeof analyzeChangeSet>): string {
  const risks = analysis.affectedRisks.join(", ") || "none mapped";
  return `Risk level ${analysis.riskLevel}. Affected risks: ${risks}. Release impact: ${analysis.releaseImpact}. ${analysis.explanation}`;
}

function buildStopConditions(manualReview: boolean): string[] {
  const conditions = [
    "Do not mark any test PASS without recorded evidence artifacts.",
    "Do not execute against production unless PILOT_ALLOW_PRODUCTION=YES and owner-approved.",
    "Halt if platform admin access audit fails or tenant isolation probe fails.",
    "Halt if buildStamp on staging does not match intended merge SHA.",
  ];
  if (manualReview) {
    conditions.unshift("Manual review required before any future execution attempt.");
  }
  return conditions;
}

function buildNextSafeAction(plan: Pick<RomaExecutionPlan, "manualReviewRequired" | "confidence" | "blockedTests">): string {
  if (plan.manualReviewRequired) {
    return "Owner review required: validate change scope, confirm credentials/devices, then design Execution Engine run — do not execute from this planner.";
  }
  if (plan.confidence === "unknown") {
    return "Expand change mapping or manual triage — paths did not match V1 rules.";
  }
  if (plan.blockedTests.length > 0) {
    return "Provision missing credentials/devices listed in plan, then re-plan — execution remains disabled in V1.";
  }
  return "Plan complete — ready for Execution Engine design review (no runs from V1 planner).";
}

export function groupTestsIntoPhases(testIds: readonly string[]): RomaExecutionPhase[] {
  const byPhase = new Map<RomaExecutionPhaseId, string[]>();
  for (const def of PHASE_DEFINITIONS) {
    byPhase.set(def.phaseId, []);
  }
  for (const testId of testIds) {
    const item = getTestById(testId);
    if (!item) continue;
    const phaseId = domainToPhase(item.domain);
    byPhase.get(phaseId)?.push(testId);
  }
  return PHASE_DEFINITIONS.map((def) => ({
    phaseId: def.phaseId,
    label: def.label,
    description: def.description,
    testIds: (byPhase.get(def.phaseId) ?? []).sort(),
  })).filter((p) => p.testIds.length > 0);
}

export function identifyRequiredEnvironments(plan: RomaExecutionPlan): readonly string[] {
  const envs = new Set<string>(["staging"]);
  for (const test of plan.selectedTests) {
    const item = getTestById(test.testId);
    if (!item) continue;
    for (const p of item.supportedPlatforms) {
      if (p === "staging" || p === "production" || p === "web" || p === "api") envs.add(p);
    }
  }
  if (plan.releaseImpact === "high") envs.add("production");
  return [...envs].sort();
}

export function identifyRequiredCredentials(plan: RomaExecutionPlan): readonly string[] {
  const creds = new Set<string>();
  for (const test of plan.selectedTests) {
    const item = getTestById(test.testId);
    if (!item) continue;
    for (const prereq of item.prerequisites) {
      for (const { pattern, credential } of CREDENTIAL_PATTERNS) {
        if (pattern.test(prereq)) creds.add(credential);
      }
    }
  }
  return [...creds].sort();
}

export function identifyRequiredDevices(plan: RomaExecutionPlan): readonly string[] {
  const devices = new Set<string>();
  for (const test of plan.selectedTests) {
    const item = getTestById(test.testId);
    if (!item) continue;
    if (item.supportedPlatforms.includes("ios")) devices.add("Xcode + iOS Simulator");
    if (item.supportedPlatforms.includes("android")) devices.add("Android SDK + Emulator");
    for (const prereq of item.prerequisites) {
      for (const { pattern, device } of DEVICE_PATTERNS) {
        if (pattern.test(prereq)) devices.add(device);
      }
    }
  }
  return [...devices].sort();
}

export function identifyBlockedTests(
  selectedTests: readonly RomaPlannedTest[]
): RomaBlockedTest[] {
  return selectedTests
    .filter((t) => t.blockReason)
    .map((t) => ({
      testId: t.testId,
      title: t.title,
      reason: t.blockReason ?? catalogDisabledReason(),
    }));
}

export function estimatePlanRuntime(plan: RomaExecutionPlan): string {
  let total = 0;
  for (const test of plan.selectedTests) {
    const item = getTestById(test.testId);
    if (item) total += parseRuntimeMinutes(item.estimatedRuntime);
  }
  return formatRuntime(total);
}

function buildPlannedTests(testIds: readonly string[]): RomaPlannedTest[] {
  const planned: RomaPlannedTest[] = [];
  for (const testId of testIds) {
    const item = getTestById(testId);
    if (!item) continue;
    const blockReason = resolveBlockReason(item);
    planned.push({
      testId: item.testId,
      title: item.title,
      domain: item.domain,
      phaseId: domainToPhase(item.domain),
      executable: false,
      releaseCritical: item.releaseCritical,
      blockReason,
    });
  }
  return planned;
}

function buildSkippedTests(
  analysis: ReturnType<typeof analyzeChangeSet>,
  selectedIds: readonly string[]
): RomaSkippedTest[] {
  const selectedSet = new Set(selectedIds);
  const skipped: RomaSkippedTest[] = [];

  for (const entry of analysis.skippedDomains) {
    skipped.push({
      testId: `domain:${entry.domain}`,
      title: `Domain skipped: ${entry.domain}`,
      reason: entry.reason,
    });
  }

  const allCatalog = getTestCatalog().items;
  for (const item of allCatalog) {
    if (selectedSet.has(item.testId)) continue;
    if (analysis.recommendedCatalogTests.includes(item.testId)) {
      skipped.push({
        testId: item.testId,
        title: item.title,
        reason: "Recommended by change intelligence but filtered from plan",
      });
    }
  }

  return skipped;
}

export function createExecutionPlan(input: RomaChangeSetInput): RomaExecutionPlan {
  const analysis = analyzeChangeSet(input);
  const docsOnly = isDocsOnlyInput(input) && !isSecurityOrReleaseDoc(input.changedPaths);
  const selectedIds = docsOnly ? [] : selectTestsForChange(input);
  const selectedTests = buildPlannedTests(selectedIds);
  const blockedTests = identifyBlockedTests(selectedTests);
  const skippedTests = buildSkippedTests(analysis, selectedIds);
  const executionPhases = groupTestsIntoPhases(selectedIds);
  const manualReviewRequired = requiresManualReview(input, analysis);

  const evidenceRequired = uniqueEvidence(selectedTests);
  const planBase: RomaExecutionPlan = {
    version: "v1",
    executionEnabled: false,
    planId: planIdFromInput(input),
    input,
    summary: `Execution plan for ${input.changedPaths.length} path(s): ${selectedTests.length} planned test(s), ${blockedTests.length} blocked, ${executionPhases.length} phase(s).`,
    releaseImpact: analysis.releaseImpact,
    confidence: analysis.confidence,
    requiredTestDomains: analysis.requiredTestDomains,
    selectedTests,
    blockedTests,
    skippedTests,
    executionPhases,
    estimatedRuntime: "pending",
    requiredEnvironments: [],
    requiredCredentials: [],
    requiredDevices: [],
    evidenceRequired,
    riskRationale: buildRiskRationale(analysis),
    stopConditions: buildStopConditions(manualReviewRequired),
    manualReviewRequired,
    nextSafeAction: "",
  };

  planBase.requiredEnvironments = identifyRequiredEnvironments(planBase);
  planBase.requiredCredentials = identifyRequiredCredentials(planBase);
  planBase.requiredDevices = identifyRequiredDevices(planBase);
  planBase.estimatedRuntime = estimatePlanRuntime(planBase);
  planBase.nextSafeAction = buildNextSafeAction(planBase);

  return planBase;
}

function uniqueEvidence(tests: readonly RomaPlannedTest[]): string[] {
  const evidence = new Set<string>();
  for (const test of tests) {
    const item = getTestById(test.testId);
    if (!item) continue;
    for (const e of item.requiredEvidence) evidence.add(e);
  }
  return [...evidence].sort();
}

export function explainExecutionPlan(plan: RomaExecutionPlan): string {
  return [
    plan.summary,
    `Plan ID: ${plan.planId}. Execution enabled: ${plan.executionEnabled}.`,
    `Phases: ${plan.executionPhases.map((p) => p.label).join(" → ")}.`,
    `Estimated runtime: ${plan.estimatedRuntime}. Manual review: ${plan.manualReviewRequired ? "YES" : "NO"}.`,
    plan.nextSafeAction,
  ].join(" ");
}

/** Static V1 example inputs (read-only UI — not live git). */
export const ROMA_EXECUTION_PLANNER_EXAMPLES: readonly {
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
    label: "AI Copilot provider",
    input: {
      changedPaths: ["apps/web/lib/ai/copilot-handler.ts"],
      changedApis: ["api-ai"],
    },
  },
  {
    label: "Docs-only (launch runbook)",
    input: { changedPaths: ["docs/launch/P4_PROJECT_SETUP_RUNBOOK.md"] },
  },
  {
    label: "Unknown path",
    input: { changedPaths: ["tools/experimental/unknown-module.ts"] },
  },
];

export function getExecutionPlannerMeta(): { version: "v1"; executionEnabled: false } {
  return { version: "v1", executionEnabled: false };
}
