export interface Project {
  id: string;
  name: string;
  tenant_id: string;
  created_at?: string;
  client_portal_enabled?: boolean | null;
  client_show_budget_summary?: boolean | null;
}
