/** Assignable work item for Worker Lite. */
export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: string;
  assigned_to?: string;
  due_date?: string;
  created_at?: string;
}
