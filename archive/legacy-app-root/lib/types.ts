export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Project {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
}

export interface Job {
  id: string;
  project_id: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
}

export interface AiAnalysis {
  id: string;
  job_id: string;
  stage: string;
  completion_percent: number;
  risk_level: "low" | "medium" | "high";
  detected_issues: string[];
  recommendations: string[];
  created_at: string;
}

export interface MediaItem {
  id: string;
  project_id: string;
  job_id: string | null;
  path: string;
  created_at: string;
}

/** Job with nested ai_analysis (from Supabase select with relation) */
export interface JobWithAnalysis extends Job {
  ai_analysis: AiAnalysis[] | null;
}
