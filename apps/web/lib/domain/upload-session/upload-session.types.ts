export type UploadSessionPurpose = "report_before" | "report_after" | "project_media";
export type UploadSessionStatus = "created" | "uploaded" | "finalized" | "expired";

export interface UploadSession {
  id: string;
  tenant_id: string;
  user_id: string;
  purpose: string;
  status: UploadSessionStatus;
  object_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  expires_at: string;
}
