export type PushPlatform = "ios" | "android";

export type PushMessageType = "job_done" | "report_ready" | "task_assigned";

export interface PushOutboxRow {
  id: string;
  tenant_id: string;
  user_id: string;
  platform: string;
  type: string;
  payload: Record<string, unknown> | null;
  status: string;
  attempts: number;
  created_at: string;
}
