export type ProjectHandoverStatus = "in_progress" | "handover_ready" | "handed_over" | "completed";

export interface ProjectHandoverRow {
  id: string;
  tenant_id: string;
  project_id: string;
  status: ProjectHandoverStatus;
  handover_notes: string | null;
  handed_over_at: string | null;
  handed_over_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HandoverBlocker {
  code: string;
  severity: "blocking";
  title: string;
  detail: string;
  count: number;
  /** Manager dashboard path (relative). */
  href: string | null;
}

export interface HandoverReadinessResult {
  ready: boolean;
  blockers: HandoverBlocker[];
}

export interface ProjectHandoverEventRow {
  id: string;
  handover_id: string;
  from_status: string | null;
  to_status: string;
  actor_user_id: string;
  note: string | null;
  created_at: string;
}

export interface ProjectHandoverPublicSummary {
  status: ProjectHandoverStatus;
  /** Shown when status is handed_over or completed; manager-authored, customer-safe. */
  handover_notes: string | null;
  handed_over_at: string | null;
  completed_at: string | null;
}
