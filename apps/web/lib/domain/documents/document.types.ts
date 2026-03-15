/** Project document: act, contract, or generic document. */
export interface ProjectDocument {
  id: string;
  tenant_id: string;
  project_id: string;
  type: ProjectDocumentType;
  title: string;
  description?: string | null;
  status: ProjectDocumentStatus;
  object_path?: string | null;
  created_by?: string | null;
  report_id?: string | null;
  task_id?: string | null;
  milestone_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectDocumentType = "document" | "act" | "contract";

export type ProjectDocumentStatus =
  | "draft"
  | "uploaded"
  | "under_review"
  | "approved"
  | "rejected"
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
  object_path?: string | null;
  report_id?: string | null;
  task_id?: string | null;
  milestone_id?: string | null;
}
