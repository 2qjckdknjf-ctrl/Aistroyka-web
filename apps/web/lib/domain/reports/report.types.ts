export interface Report {
  id: string;
  tenant_id: string;
  user_id: string;
  project_id?: string;
  status: string;
  started_at?: string;
  submitted_at?: string;
  created_at?: string;
}
