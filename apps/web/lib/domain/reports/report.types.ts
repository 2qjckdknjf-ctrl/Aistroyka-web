export interface Report {
  id: string;
  tenant_id: string;
  user_id: string;
  day_id?: string | null;
  status: string;
  created_at?: string;
  submitted_at?: string | null;
}
