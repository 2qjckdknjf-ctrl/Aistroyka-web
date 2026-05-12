export type ProofMediaCategory = "before" | "after" | "progress" | "issue" | "document" | "other";

export interface ProofPackMedia {
  id: string;
  category: ProofMediaCategory;
  file_url: string;
  uploaded_at: string | null;
}

export interface ProofPackDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  updated_at: string;
}

export interface ProofPackDecision {
  id: string;
  title: string;
  status: string;
  requested_at: string;
}

export interface ProofPackCommercialReference {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
}

export interface ProjectProofPack {
  generated_at: string;
  project: {
    id: string;
    name: string;
  };
  progress: {
    tasks_done: number;
    tasks_total: number;
  };
  media: ProofPackMedia[];
  documents: ProofPackDocument[];
  decisions: ProofPackDecision[];
  approved_commercial_changes: ProofPackCommercialReference[];
}

export interface ProofPackShare {
  token: string;
  url: string;
  expires_at: string | null;
}
