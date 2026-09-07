export interface WorkerDay {
  id: string;
  tenant_id: string;
  user_id: string;
  day_date: string;
  project_id?: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy_m?: number | null;
}

export interface WorkerDayStartEvidence {
  project_id?: string;
  latitude?: number;
  longitude?: number;
  accuracy_m?: number;
}
