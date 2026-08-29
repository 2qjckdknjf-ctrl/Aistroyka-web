/** Project issue (defect, observation) status. */
export type IssueStatus = "open" | "in_review" | "resolved" | "closed";

export interface ProjectIssue {
  id: string;
  project_id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  task_id: string | null;
  milestone_id: string | null;
  created_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  evidence_upload_session_id?: string | null;
  evidence_url?: string | null;
  /** Linked task assignee. Presentation-only; not stored on project_issues. */
  assigned_to?: string | null;
}

export interface CreateIssueInput {
  project_id: string;
  title: string;
  description?: string | null;
  task_id?: string | null;
  milestone_id?: string | null;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string | null;
  status?: IssueStatus;
  task_id?: string | null;
  milestone_id?: string | null;
  evidence_upload_session_id?: string | null;
}
