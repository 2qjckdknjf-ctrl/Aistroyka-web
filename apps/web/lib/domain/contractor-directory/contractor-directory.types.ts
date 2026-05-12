export type TenantContractorProfileRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  company_name: string;
  specializations: string[];
  phone: string;
  email: string;
  status: "active" | "inactive" | "archived";
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ContractorQualityMetrics = {
  tasks_completed: number;
  tasks_in_progress: number;
  reports_submitted: number;
  reports_approved: number;
  reports_rejected: number;
  reports_changes_requested: number;
  active_projects: number;
  /** 0..1 */
  rejection_rate: number;
  /** changes_requested / reviewed reports */
  missing_evidence_rate: number;
  /** Mean days late for done tasks with due_date (negative = early); null if none */
  average_delay_days: number | null;
  /** 0..100 internal heuristic */
  quality_score: number;
};

export type ContractorDirectoryListItem = {
  user_id: string;
  profile: TenantContractorProfileRow | null;
  metrics: ContractorQualityMetrics;
};

export type ContractorDirectoryDetail = ContractorDirectoryListItem & {
  /** Same as list metrics; reserved for extensions */
};
