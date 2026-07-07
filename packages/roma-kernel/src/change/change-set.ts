import type { RomaEntityId } from "../shared";
import type { RomaConfidence } from "../decision/confidence";
import type { RomaReleaseImpact } from "../release/release-decision";
import type { RomaRiskLevel } from "../risk/risk-level";

export type RomaChangeSet = {
  changeId: RomaEntityId;
  changedPaths: readonly string[];
  changedModules?: readonly string[];
  changedApis?: readonly string[];
  changedMobileApps?: readonly string[];
  changedEnv?: readonly string[];
};

export type RomaChangeAnalysis = {
  changeId: RomaEntityId;
  confidence: RomaConfidence;
  riskLevel: RomaRiskLevel;
  releaseImpact: RomaReleaseImpact;
  affectedAreaIds: readonly string[];
  explanation: string;
};
