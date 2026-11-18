/** Photo requirements e.g. { before: 1, after: 1 }. */
export type RequiredPhotos = Record<string, number>;

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export function parseTaskPriority(value: unknown): TaskPriority | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }
  return undefined;
}

/** Assignable work item for Worker Lite. */
export interface Task {
  id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  status: string;
  assigned_to?: string | null;
  due_date?: string | null;
  milestone_id?: string | null;
  required_photos?: RequiredPhotos | null;
  report_required?: boolean;
  priority?: TaskPriority | null;
  created_at?: string;
  updated_at?: string;
  /** Phase 7.6: linked report when worker has submitted or has draft for this task */
  report_id?: string | null;
  report_status?: string | null;
}

/** Payload for creating a task (manager). */
export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string | null;
  due_at?: string | null;
  milestone_id?: string | null;
  required_photos?: RequiredPhotos | null;
  report_required?: boolean;
  priority?: TaskPriority;
}

/** Payload for updating a task (manager). */
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  due_at?: string | null;
  milestone_id?: string | null;
  status?: string;
  required_photos?: RequiredPhotos | null;
  report_required?: boolean;
  priority?: TaskPriority;
}
