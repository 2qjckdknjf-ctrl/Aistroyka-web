/** Wave 4 Step 20 — cross-project governance / escalation (finite case model). */

export type GovernanceCaseStatus =
  | "open"
  | "under_review"
  | "decision_required"
  | "decided"
  | "resolved"
  | "archived";

export type GovernanceSeverity = "medium" | "high" | "critical";

export type GovernanceCaseEventKind = "created" | "status_change" | "decision_recorded" | "updated";

export interface GovernanceCaseRow {
  id: string;
  tenant_id: string;
  title: string;
  rationale: string | null;
  status: GovernanceCaseStatus;
  severity: GovernanceSeverity;
  decision_required: string;
  decision_outcome: string | null;
  created_by: string;
  owned_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GovernanceCaseProjectRow {
  governance_case_id: string;
  tenant_id: string;
  project_id: string;
  note: string | null;
}

export interface GovernanceCaseWithProjects extends GovernanceCaseRow {
  projects: Array<{ project_id: string; project_name: string; note: string | null }>;
}

export interface GovernanceCaseListFilters {
  status?: GovernanceCaseStatus | GovernanceCaseStatus[];
  severity?: GovernanceSeverity;
  limit?: number;
}

export interface CreateGovernanceCaseInput {
  title: string;
  rationale?: string | null;
  severity: GovernanceSeverity;
  decision_required: string;
  owned_by?: string | null;
  project_ids: string[];
  project_notes?: Record<string, string | undefined>;
}

export interface UpdateGovernanceCaseInput {
  title?: string;
  rationale?: string | null;
  status?: GovernanceCaseStatus;
  severity?: GovernanceSeverity;
  decision_required?: string;
  decision_outcome?: string | null;
  owned_by?: string | null;
  /** When recording a decision */
  decided_by?: string | null;
  decided_at?: string | null;
  resolved_at?: string | null;
  project_ids?: string[];
  project_notes?: Record<string, string | undefined>;
}
