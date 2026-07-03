export type QualityStatus =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "unknown"
  | "not_configured";

export type ReadinessLevel = "ready" | "partial" | "blocked" | "unknown";

export type BlockerSeverity = "critical" | "warning" | "information" | "unknown";

export type QualityComponentCard = {
  id: string;
  name: string;
  status: QualityStatus;
  statusLabel: string;
  lastCheck: string;
  details: string;
};

export type ReadinessCategory = {
  id: string;
  label: string;
  level: ReadinessLevel;
  percent: number | null;
  summary: string;
};

export type QualityBlocker = {
  title: string;
  component: string;
  severity: BlockerSeverity;
  recommendation: string;
};

export type LatestChanges = {
  lastDeploy: string | null;
  lastCommit: string | null;
  branch: string | null;
  build: string | null;
  timestamp: string | null;
};

export type RomaMaturityItem = {
  id: string;
  label: string;
  level: ReadinessLevel;
  summary: string;
  source: "live" | "configuration" | "governance_baseline" | "unavailable";
};

export type KnownReportRef = {
  label: string;
  path: string;
  note: string;
  href: string | null;
};

export type RomaQualityDashboard = {
  pageMode: "read_only";
  testExecutionEnabled: false;
  generatedAt: string;
  environment: {
    label: string;
    appUrl: string | null;
    nodeEnv: string | null;
    preferredAdminHost: string;
    adminHostDeployed: boolean | null;
  };
  platformStatus: {
    overallHealth: QualityStatus;
    overallHealthLabel: string;
    releaseReadiness: ReadinessLevel;
    releaseReadinessPercent: number | null;
    lastUpdated: string;
  };
  systemComponents: QualityComponentCard[];
  releaseReadiness: ReadinessCategory[];
  blockers: QualityBlocker[];
  latestChanges: LatestChanges;
  romaStatus: RomaMaturityItem[];
  knownReports: KnownReportRef[];
  dataSources: {
    available: string[];
    unavailable: string[];
  };
};
