export type JobStatus =
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export interface Project {
  id: string;
  name: string;
  created_at: string;
  tenant_id?: string;
}

export interface AnalysisJob {
  id: string;
  media_id: string;
  status: JobStatus;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
}

/** AnalysisJob with optional UI-only timeout (processing > 5 min). */
export interface AnalysisJobWithTimeout extends AnalysisJob {
  timedOut?: boolean;
}

export interface AiAnalysis {
  id: string;
  job_id: string | null;
  media_id: string;
  stage: string | null;
  completion_percent: number;
  risk_level: "low" | "medium" | "high";
  detected_issues: string[];
  recommendations: string[];
  created_at: string;
}

/** Engine: media has file_url, type; no job_id on media. */
export interface MediaItem {
  id: string;
  project_id: string;
  type: "image" | "video";
  file_url: string;
  uploaded_at: string;
}

/** Media with optional active job and latest analysis result. */
export interface MediaWithJob {
  media: MediaItem;
  job: AnalysisJobWithTimeout | null;
  analysis: AiAnalysis | null;
}
