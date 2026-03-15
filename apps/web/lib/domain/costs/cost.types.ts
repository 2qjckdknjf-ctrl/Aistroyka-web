/** Project cost item: planned vs actual. */
export interface ProjectCostItem {
  id: string;
  tenant_id: string;
  project_id: string;
  category: string;
  title: string;
  planned_amount: number;
  actual_amount: number;
  currency: string;
  status: ProjectCostItemStatus;
  notes?: string | null;
  milestone_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectCostItemStatus =
  | "planned"
  | "committed"
  | "incurred"
  | "approved"
  | "archived";

export interface ProjectBudgetSummary {
  project_id: string;
  tenant_id: string;
  planned_total: number;
  actual_total: number;
  currency: string;
  over_budget: boolean;
  item_count: number;
}

export interface CreateCostItemInput {
  project_id: string;
  category: string;
  title: string;
  planned_amount: number;
  actual_amount?: number;
  currency?: string;
  status?: ProjectCostItemStatus;
  notes?: string | null;
  milestone_id?: string | null;
}

export interface UpdateCostItemInput {
  category?: string;
  title?: string;
  planned_amount?: number;
  actual_amount?: number;
  currency?: string;
  status?: ProjectCostItemStatus;
  notes?: string | null;
  milestone_id?: string | null;
}
