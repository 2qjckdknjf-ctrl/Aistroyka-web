/** ROMA Quality Graph node types (V1). */
export type RomaQualityGraphNodeType =
  | "product_area"
  | "business_flow"
  | "app_surface"
  | "api"
  | "database"
  | "role"
  | "permission"
  | "mobile_app"
  | "ai_capability"
  | "integration"
  | "infrastructure"
  | "test_domain"
  | "risk"
  | "release_gate";

/** ROMA Quality Graph edge types (V1). */
export type RomaQualityGraphEdgeType =
  | "depends_on"
  | "exposes"
  | "used_by"
  | "validates"
  | "affected_by"
  | "blocks"
  | "mitigates"
  | "requires"
  | "owns"
  | "observes";

export type RomaQualityGraphNode = {
  id: string;
  type: RomaQualityGraphNodeType;
  label: string;
  description: string;
  /** Optional criticality for product areas and risks. */
  criticality?: "critical" | "high" | "medium" | "low";
};

export type RomaQualityGraphEdge = {
  id: string;
  type: RomaQualityGraphEdgeType;
  sourceId: string;
  targetId: string;
  label?: string;
};

export type RomaQualityGraph = {
  version: "v1";
  executionEnabled: false;
  generatedAt: string;
  nodes: readonly RomaQualityGraphNode[];
  edges: readonly RomaQualityGraphEdge[];
};

export type RomaQualityGraphChangeInput = {
  changedPaths: readonly string[];
  changedModules?: readonly string[];
  changedApis?: readonly string[];
};

export type RomaQualityGraphAffectedAnalysis = {
  productAreaIds: readonly string[];
  roleIds: readonly string[];
  apiIds: readonly string[];
  mobileAppIds: readonly string[];
  testDomainIds: readonly string[];
  riskIds: readonly string[];
  releaseGateIds: readonly string[];
  releaseConfidenceImpact: "none" | "low" | "medium" | "high";
  summary: string;
};

export type RomaQualityGraphReleaseGateImpact = {
  gateIds: readonly string[];
  blockedGates: readonly string[];
  confidenceImpact: RomaQualityGraphAffectedAnalysis["releaseConfidenceImpact"];
  notes: readonly string[];
};
