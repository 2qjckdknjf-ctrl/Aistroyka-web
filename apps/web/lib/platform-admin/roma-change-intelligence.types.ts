/** ROMA Change Intelligence Engine input (V1). */
export type RomaChangeSetInput = {
  changedPaths: readonly string[];
  changedModules?: readonly string[];
  changedApis?: readonly string[];
  changedMobileApps?: readonly string[];
  changedEnv?: readonly string[];
};

export type RomaChangeConfidence = "high" | "medium" | "low" | "unknown";

export type RomaChangeReleaseImpact = "none" | "low" | "medium" | "high";

export type RomaChangeRiskLevel = "critical" | "high" | "medium" | "low" | "unknown";

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
