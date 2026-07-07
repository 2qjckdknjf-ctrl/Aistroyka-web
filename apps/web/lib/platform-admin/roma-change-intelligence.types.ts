import type {
  RomaConfidence,
  RomaReleaseImpact,
  RomaRiskLevel,
} from "@aistroyka/roma-kernel";

export type RomaChangeConfidence = RomaConfidence;
export type RomaChangeRiskLevel = RomaRiskLevel;
export type RomaChangeReleaseImpact = RomaReleaseImpact;

/** ROMA Change Intelligence Engine input (V1). */
export type RomaChangeSetInput = {
  changedPaths: readonly string[];
  changedModules?: readonly string[];
  changedApis?: readonly string[];
  changedMobileApps?: readonly string[];
  changedEnv?: readonly string[];
};

export type RomaSkippedDomain = {
  domain: string;
  reason: string;
};

export type RomaChangeIntelligenceResult = {
  version: "v1";
  executionEnabled: false;
  affectedAreas: readonly string[];
  affectedRoles: readonly string[];
  affectedSurfaces: readonly string[];
  affectedApis: readonly string[];
  affectedMobileApps: readonly string[];
  affectedRisks: readonly string[];
  requiredTestDomains: readonly string[];
  recommendedCatalogTests: readonly string[];
  releaseImpact: RomaChangeReleaseImpact;
  confidence: RomaChangeConfidence;
  riskLevel: RomaChangeRiskLevel;
  explanation: string;
  skippedDomains: readonly RomaSkippedDomain[];
  graphNodeIds: readonly string[];
};

export type RomaChangeIntelligenceEngine = {
  version: "v1";
  executionEnabled: false;
};
