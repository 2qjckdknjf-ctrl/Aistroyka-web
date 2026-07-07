import type {
  RomaProbeConnectionStatus,
  RomaReadinessLevel,
  RomaSeverity,
} from "@aistroyka/roma-kernel";

export type BlockerSeverity = RomaSeverity;
export type LiveSourceStatus = RomaProbeConnectionStatus;
export type ReadinessLevel = RomaReadinessLevel;

export type LiveDataSource = {
  id: string;
  label: string;
  category: string;
  status: LiveSourceStatus;
  summary: string;
  checkedAt: string;
};

export type DataCoverage = {
  lastRefresh: string;
  coveragePercent: number;
  connectedCount: number;
  totalCatalogCount: number;
  available: LiveDataSource[];
  unavailable: LiveDataSource[];
};

export type PlatformTimelineEvent = {
  id: string;
  label: string;
  timestamp: string | null;
  displayValue: string;
  source: string;
};

export type QualityRecommendation = {
  id: string;
  title: string;
  component: string;
  severity: BlockerSeverity;
  evidence: string;
};

export type DomainSection = {
  id: string;
  label: string;
  status: QualityStatus;
  statusLabel: string;
  summary: string;
  highlights: string[];
};

/** Module view — aligns with RomaHealthStatus; migrate new code to @aistroyka/roma-kernel. */
export type QualityStatus =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "unknown"
  | "not_configured";

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

export type PlatformOverviewMetrics = {
  evidenceStatus: "live" | "unavailable" | "not_configured";
  summary: string;
  totalTenants: number | null;
  activeUsers: number | null;
  totalProjects: number | null;
  pendingInvites: number | null;
  openSupportEvents: number | null;
  pushPending: number | null;
  pushFailed: number | null;
  pushSent24h: number | null;
  entitlementsRows: number | null;
  billingCustomers: number | null;
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
  domainSections: DomainSection[];
  systemComponents: QualityComponentCard[];
  releaseReadiness: ReadinessCategory[];
  knownRisks: QualityBlocker[];
  blockers: QualityBlocker[];
  recommendations: QualityRecommendation[];
  latestChanges: LatestChanges;
  platformTimeline: PlatformTimelineEvent[];
  dataCoverage: DataCoverage;
  platformOverview: PlatformOverviewMetrics;
  romaStatus: RomaMaturityItem[];
  knownReports: KnownReportRef[];
  /** @deprecated use dataCoverage.available */
  dataSources: {
    available: string[];
    unavailable: string[];
  };
};
