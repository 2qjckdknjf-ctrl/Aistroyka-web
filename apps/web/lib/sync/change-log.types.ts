export type ChangeResourceType = "task" | "report" | "media" | "assignment" | "project";
export type ChangeType = "created" | "updated" | "deleted";

export interface ChangeLogEntry {
  id: number;
  tenant_id: string;
  resource_type: ChangeResourceType;
  resource_id: string;
  change_type: ChangeType;
  changed_by: string | null;
  ts: string;
  payload: Record<string, unknown>;
}
