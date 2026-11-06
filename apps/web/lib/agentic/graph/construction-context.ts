/**
 * Construction Context mapping: existing production tables vs extensible graph types.
 * Graph is NOT a second system of record.
 */

export type ConstructionEntityType =
  | "COMPANY"
  | "PROJECT"
  | "BUILDING"
  | "FLOOR"
  | "ZONE"
  | "ROOM"
  | "WORK_PACKAGE"
  | "MILESTONE"
  | "TASK"
  | "ISSUE"
  | "INSPECTION"
  | "REPORT"
  | "WORKER"
  | "MANAGER"
  | "CONTRACTOR"
  | "SUPPLIER"
  | "MATERIAL"
  | "PURCHASE_REQUEST"
  | "PURCHASE_ORDER"
  | "DELIVERY"
  | "INVOICE"
  | "PAYMENT"
  | "DOCUMENT"
  | "MEDIA"
  | "EVIDENCE"
  | "DECISION"
  | "RISK";

export type ConstructionSourceType =
  | "tenants"
  | "accounts"
  | "projects"
  | "project_milestones"
  | "worker_tasks"
  | "project_defects"
  | "project_issues"
  | "worker_reports"
  | "project_documents"
  | "media"
  | "upload_sessions"
  | "project_risks"
  | "project_members"
  | "project_client_requests"
  | "project_commercial_items"
  | "graph_native";

export type ConstructionMappingStatus = "exists" | "partial" | "extensible_type";

export interface ConstructionContextMappingRow {
  entityType: ConstructionEntityType;
  status: ConstructionMappingStatus;
  sourceType: ConstructionSourceType;
  notes: string;
}

export const CONSTRUCTION_CONTEXT_MAPPING: ConstructionContextMappingRow[] = [
  { entityType: "COMPANY", status: "exists", sourceType: "tenants", notes: "tenants + accounts" },
  { entityType: "PROJECT", status: "exists", sourceType: "projects", notes: "canonical project row" },
  { entityType: "BUILDING", status: "extensible_type", sourceType: "graph_native", notes: "no physical table yet" },
  { entityType: "FLOOR", status: "extensible_type", sourceType: "graph_native", notes: "no physical table yet" },
  { entityType: "ZONE", status: "extensible_type", sourceType: "graph_native", notes: "no physical table yet" },
  { entityType: "ROOM", status: "extensible_type", sourceType: "graph_native", notes: "no physical table yet" },
  { entityType: "WORK_PACKAGE", status: "extensible_type", sourceType: "graph_native", notes: "milestones are checkpoints, not WBS" },
  { entityType: "MILESTONE", status: "exists", sourceType: "project_milestones", notes: "" },
  { entityType: "TASK", status: "exists", sourceType: "worker_tasks", notes: "system of record" },
  { entityType: "ISSUE", status: "partial", sourceType: "project_defects", notes: "punch list; field observations in project_issues" },
  { entityType: "INSPECTION", status: "extensible_type", sourceType: "graph_native", notes: "entitlement exists, no table" },
  { entityType: "REPORT", status: "exists", sourceType: "worker_reports", notes: "" },
  { entityType: "WORKER", status: "partial", sourceType: "project_members", notes: "role, not person table" },
  { entityType: "MANAGER", status: "partial", sourceType: "project_members", notes: "role, not person table" },
  { entityType: "CONTRACTOR", status: "partial", sourceType: "project_members", notes: "plus tenant_contractor_profiles" },
  { entityType: "SUPPLIER", status: "extensible_type", sourceType: "graph_native", notes: "deferred to procurement slices" },
  { entityType: "MATERIAL", status: "partial", sourceType: "project_commercial_items", notes: "cost category, not SKU" },
  { entityType: "PURCHASE_REQUEST", status: "extensible_type", sourceType: "graph_native", notes: "deferred" },
  { entityType: "PURCHASE_ORDER", status: "extensible_type", sourceType: "graph_native", notes: "deferred" },
  { entityType: "DELIVERY", status: "extensible_type", sourceType: "graph_native", notes: "deferred" },
  { entityType: "INVOICE", status: "partial", sourceType: "project_commercial_items", notes: "kind=invoice" },
  { entityType: "PAYMENT", status: "partial", sourceType: "project_commercial_items", notes: "customer-facing only" },
  { entityType: "DOCUMENT", status: "exists", sourceType: "project_documents", notes: "" },
  { entityType: "MEDIA", status: "exists", sourceType: "media", notes: "" },
  { entityType: "EVIDENCE", status: "partial", sourceType: "media", notes: "composite: media + report media + uploads" },
  { entityType: "DECISION", status: "partial", sourceType: "project_client_requests", notes: "plus document review" },
  { entityType: "RISK", status: "exists", sourceType: "project_risks", notes: "" },
];

export const CONSTRUCTION_RELATION_TYPES = [
  "LOCATED_IN",
  "DEPENDS_ON",
  "BLOCKS",
  "ASSIGNED_TO",
  "PERFORMED_BY",
  "SUPPORTED_BY",
  "EVIDENCED_BY",
  "REQUIRES",
  "USES_MATERIAL",
  "SUPPLIED_BY",
  "CREATED_FROM",
  "RESOLVES",
  "VERIFIES",
  "AFFECTS",
  "PART_OF",
] as const;

export type ConstructionRelationType = (typeof CONSTRUCTION_RELATION_TYPES)[number];
