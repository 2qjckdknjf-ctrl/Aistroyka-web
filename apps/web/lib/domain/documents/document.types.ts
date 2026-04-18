/** Project document: act, contract, or generic document. */
export interface ProjectDocument {
  id: string;
  tenant_id: string;
  project_id: string;
  type: ProjectDocumentType;
  title: string;
  description?: string | null;
  status: ProjectDocumentStatus;
  /** When true and client portal is on, metadata may appear in client view (no file URL). */
  client_visible?: boolean;
  object_path?: string | null;
  created_by?: string | null;
  report_id?: string | null;
  task_id?: string | null;
  milestone_id?: string | null;
  decision_comment?: string | null;
  decided_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type OwnerDecisionAction = "approve" | "reject" | "request_changes";

export type ProjectDocumentType = "document" | "act" | "contract";

export type ProjectDocumentStatus =
  | "draft"
  | "uploaded"
  | "under_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "archived";

export interface CreateDocumentInput {
  project_id: string;
  type: ProjectDocumentType;
  title: string;
  description?: string | null;
  status?: ProjectDocumentStatus;
  object_path?: string | null;
  report_id?: string | null;
  task_id?: string | null;
  milestone_id?: string | null;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string | null;
  status?: ProjectDocumentStatus;
  client_visible?: boolean;
  object_path?: string | null;
  report_id?: string | null;
  task_id?: string | null;
  milestone_id?: string | null;
  decision_comment?: string | null;
  decided_by?: string | null;
}
