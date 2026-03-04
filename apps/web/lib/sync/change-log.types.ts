export type ChangeLogResourceType = "task" | "report" | "media" | "assignment" | "project" | "upload_session";

export type ChangeLogChangeType = "created" | "updated" | "deleted";

export interface ChangeLogEntry {
  id: number;
  tenant_id: string;
  resource_type: string;
  resource_id: string;
  change_type: ChangeLogChangeType;
  changed_by: string | null;
  ts: string;
  payload: Record<string, unknown>;
}

export interface ChangeLogEmitParams {
  tenant_id: string;
  resource_type: ChangeLogResourceType;
  resource_id: string;
  change_type: ChangeLogChangeType;
  changed_by?: string | null;
  payload?: Record<string, unknown>;
}
