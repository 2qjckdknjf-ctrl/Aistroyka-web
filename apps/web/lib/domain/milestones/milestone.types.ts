/** Project milestone: delivery checkpoint. */
export interface Milestone {
  id: string;
  project_id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  target_date: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type MilestoneStatus = "pending" | "in_progress" | "done" | "cancelled";

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
