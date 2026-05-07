export type DefectStatus = "open" | "in_progress" | "ready_for_verification" | "resolved" | "closed";

/** Optional punch-list severity tier (commercial / operational; not internal finance). */
export type DefectSeverity = "low" | "medium" | "high" | "critical";

export interface DefectRow {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: DefectStatus;
  is_blocking: boolean;
  assigned_to: string | null;
  due_date: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  linked_milestone_id: string | null;
  linked_document_id: string | null;
  linked_discussion_id: string | null;
  linked_request_id: string | null;
  severity: DefectSeverity | null;
  photo_before_report_media_id: string | null;
  photo_after_report_media_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DefectListItem {
  id: string;
  title: string;
  status: DefectStatus;
  is_blocking: boolean;
  due_date: string | null;
  updated_at: string;
}

export interface DefectEventRow {
  id: string;
  defect_id: string;
  from_status: string | null;
  to_status: string;
  actor_user_id: string;
  note: string | null;
  created_at: string;
}

export interface DefectPublicDetail {
  id: string;
  title: string;
  description: string | null;
  status: DefectStatus;
  is_blocking: boolean;
  due_date: string | null;
  has_assignee: boolean;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}
