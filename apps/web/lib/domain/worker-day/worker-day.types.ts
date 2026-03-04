export interface WorkerDay {
  id: string;
  tenant_id: string;
  user_id: string;
  day_date: string;
  started_at: string | null;
  ended_at: string | null;
  created_at?: string;
}
