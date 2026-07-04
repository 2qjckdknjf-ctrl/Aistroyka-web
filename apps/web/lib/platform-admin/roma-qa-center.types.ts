/** ROMA QA Center section identifiers (V1 information architecture). */
export type RomaQaCenterSectionId =
  | "dashboard"
  | "audits"
  | "web"
  | "mobile"
  | "backend"
  | "ai"
  | "security"
  | "performance"
  | "regression"
  | "coverage"
  | "history"
  | "reports";

export type RomaQaCenterSectionStatus = "available" | "coming_soon" | "unknown";

export type RomaQaCenterMaturity = "live" | "partial" | "planned";

export type RomaQaCenterRelatedReport = {
  label: string;
  /** Repo-relative doc path — reference only, not an execution artifact. */
  path: string;
};

export type RomaQaCenterSection = {
  id: RomaQaCenterSectionId;
  title: string;
  status: RomaQaCenterSectionStatus;
  maturity: RomaQaCenterMaturity;
  sourceAvailability: string;
  description: string;
  currentCapability: string;
  futureCapability: string;
  blockers: readonly string[];
  relatedReports: readonly RomaQaCenterRelatedReport[];
  /** Optional sub-areas (e.g. mobile apps, audit types). */
  subAreas?: readonly { id: string; label: string; status: RomaQaCenterSectionStatus; note: string }[];
};

export type RomaQaCenterModel = {
  version: "v1";
  executionEnabled: false;
  generatedAt: string;
  sections: readonly RomaQaCenterSection[];
};
