/**
 * AI Brain Phase D — Run record types.
 */

export interface AiVersionRef {
  layer: string;
  version: string;
  ref?: string;
}

export interface AiRunRecord {
  id?: string;
  runId: string;
  tenantId: string;
  projectId: string | null;
  userId: string | null;
  route: string;
  mode: string;
  truthSnapshotRef: string | null;
  actionPlanRefs: string[];
  memoryRefs: string[];
  outputContractType: string;
  degradedFlags: string[];
  executionTimingMs: number | null;
  validationResult: "ok" | "partial" | "fail" | null;
  versionRefs: AiVersionRef[];
  createdAt: string;
}
