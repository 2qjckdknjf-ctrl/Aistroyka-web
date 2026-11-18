export type CustomerIntakeStatus = "draft" | "submitted" | "withdrawn";

export type CustomerIntakeLocation = {
  precision: "address" | "city" | "region" | "coordinates";
  label?: string;
  lat?: number;
  lng?: number;
};

export type CustomerIntakeMediaRef = {
  kind: "image" | "video" | "document";
  url?: string;
  media_id?: string;
};

export type CustomerIntakeDraft = {
  id: string;
  tenant_id: string;
  project_id: string | null;
  title: string;
  description: string;
  site_context: string | null;
  location: CustomerIntakeLocation;
  requested_work_type: string | null;
  budget_range: string | null;
  desired_start: string | null;
  desired_end: string | null;
  media_refs: CustomerIntakeMediaRef[];
  questions: string[];
  status: CustomerIntakeStatus;
  created_at: string;
  updated_at: string;
};

export type CreateCustomerIntakeInput = {
  title: string;
  description: string;
  project_id?: string | null;
  site_context?: string | null;
  location?: CustomerIntakeLocation;
  requested_work_type?: string | null;
  budget_range?: string | null;
  desired_start?: string | null;
  desired_end?: string | null;
  media_refs?: CustomerIntakeMediaRef[];
  questions?: string[];
};
