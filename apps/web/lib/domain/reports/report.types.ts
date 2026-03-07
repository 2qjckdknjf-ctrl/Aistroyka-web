export interface Report {
  id: string;
  tenant_id: string;
  user_id: string;
  day_id?: string | null;
  status: string;
  created_at?: string;
  submitted_at?: string | null;
  /** Phase 7.6: optional link to worker_tasks */
  task_id?: string | null;
  /** Phase 4: manager review */
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  manager_note?: string | null;
}
