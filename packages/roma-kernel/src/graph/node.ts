import type { RomaEntityId } from "../shared";
import type { RomaRiskLevel } from "../risk/risk-level";

export type RomaGraphNodeType =
  | "product_area"
  | "business_flow"
  | "app_surface"
  | "api"
  | "database"
  | "role"
  | "mobile_app"
  | "ai_capability"
  | "test_domain"
  | "risk"
  | "release_gate";

export type RomaGraphEdgeType =
  | "depends_on"
  | "exposes"
  | "requires_test"
  | "mitigates"
  | "blocks_release"
  | "affects";

export type RomaGraphNode = {
  id: RomaEntityId;
  type: RomaGraphNodeType;
  label: string;
  criticality?: RomaRiskLevel;
};

export type RomaGraphEdge = {
  id: RomaEntityId;
  type: RomaGraphEdgeType;
  sourceId: RomaEntityId;
  targetId: RomaEntityId;
};

export type RomaQualityGraphOntology = {
  version: "1";
  nodes: readonly RomaGraphNode[];
  edges: readonly RomaGraphEdge[];
};
