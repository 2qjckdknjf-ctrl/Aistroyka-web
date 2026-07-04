import type { RomaChangeConfidence, RomaChangeReleaseImpact, RomaChangeSetInput } from "./roma-change-intelligence.types";
import type { RomaTestCatalogDomain } from "./roma-test-catalog.types";

/** Deterministic execution phase (V1 — plan only). */
export type RomaExecutionPhaseId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RomaExecutionPhase = {
  phaseId: RomaExecutionPhaseId;
  label: string;
  description: string;
  testIds: readonly string[];
};

export type RomaPlannedTest = {
  testId: string;
  title: string;
  domain: RomaTestCatalogDomain;
  phaseId: RomaExecutionPhaseId;
  /** Always false in V1 — catalog tests disabled, no execution engine. */
  executable: false;
  releaseCritical: boolean;
  blockReason?: string;
};

export type RomaBlockedTest = {
  testId: string;
  title: string;
  reason: string;
};

export type RomaSkippedTest = {
  testId: string;
  title: string;
  reason: string;
};

export type RomaExecutionPlan = {
  version: "v1";
  executionEnabled: false;
  planId: string;
  input: RomaChangeSetInput;
  summary: string;
  releaseImpact: RomaChangeReleaseImpact;
  confidence: RomaChangeConfidence;
  requiredTestDomains: readonly string[];
  selectedTests: readonly RomaPlannedTest[];
  blockedTests: readonly RomaBlockedTest[];
  skippedTests: readonly RomaSkippedTest[];
  executionPhases: readonly RomaExecutionPhase[];
  estimatedRuntime: string;
  requiredEnvironments: readonly string[];
  requiredCredentials: readonly string[];
  requiredDevices: readonly string[];
  evidenceRequired: readonly string[];
  riskRationale: string;
  stopConditions: readonly string[];
  manualReviewRequired: boolean;
  nextSafeAction: string;
};
