export type TaskMessageKind = "text" | "voice" | "image" | "video";

export interface TaskMessage {
  id: string;
  tenant_id: string;
  project_id: string;
  task_id: string;
  sender_user_id: string;
  kind: TaskMessageKind;
  body: string | null;
  upload_session_id: string | null;
  duration_ms: number | null;
  client_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  /** Joined from upload_sessions when present. */
  mime_type?: string | null;
  object_path?: string | null;
  /** Finalized upload size in bytes (from upload_sessions). */
  size_bytes?: number | null;
  /** Short-lived signed URL for chat media playback (when available). */
  media_url?: string | null;
}

export interface CreateTaskMessageInput {
  kind: TaskMessageKind;
  body?: string | null;
  mediaId?: string | null;
  durationMs?: number | null;
  clientId?: string | null;
}

export interface ListTaskMessagesResult {
  data: TaskMessage[];
  nextCursor: string | null;
}
