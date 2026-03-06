/** Photo requirements e.g. { before: 1, after: 1 }. */
export type RequiredPhotos = Record<string, number>;

/** Assignable work item for Worker Lite. */
export interface Task {
  id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  status: string;
  assigned_to?: string | null;
  due_date?: string | null;
  required_photos?: RequiredPhotos | null;
  report_required?: boolean;
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
  required_photos?: RequiredPhotos | null;
  report_required?: boolean;
}

/** Payload for updating a task (manager). */
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  due_at?: string | null;
  status?: string;
  required_photos?: RequiredPhotos | null;
  report_required?: boolean;
}
