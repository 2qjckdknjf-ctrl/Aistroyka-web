/** Project milestone: delivery checkpoint. */
export interface Milestone {
  id: string;
  project_id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  target_date: string;
  status: string;
  client_visible?: boolean | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type MilestoneStatus =
  | "pending"
  | "planned"
  | "in_progress"
  | "delayed"
  | "done"
  | "completed"
  | "cancelled"
  | "archived";

export interface CreateMilestoneInput {
  project_id: string;
  title: string;
  description?: string | null;
  target_date: string;
  status?: MilestoneStatus;
  sort_order?: number;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string | null;
  target_date?: string;
  status?: MilestoneStatus;
  sort_order?: number;
}
