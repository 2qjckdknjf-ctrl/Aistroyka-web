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

/** Explainable pressure signal (no ML / forecasts). */
export interface CostPressureSignal {
  id: string;
  severity: "warning" | "critical";
  /** Plain language, manager-safe. */
  reason: string;
}

export interface ProjectBudgetSummary {
  project_id: string;
  tenant_id: string;
  planned_total: number;
  actual_total: number;
  variance_amount: number;
  currency: string;
  over_budget: boolean;
  item_count: number;
  /** actual_total / planned_total when planned_total > 0; else 0. */
  utilization_ratio: number;
  /** True when not over_budget but actual ≥ 90% of planned (project-level). */
  nearing_budget_limit: boolean;
  /** Non-archived lines where actual > planned. */
  item_overrun_count: number;
  /** Subset of overruns that have milestone_id set. */
  milestone_linked_overrun_count: number;
  /** Derived list for API and UI. */
  signals: CostPressureSignal[];
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
