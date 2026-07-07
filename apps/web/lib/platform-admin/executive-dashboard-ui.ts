import type {
  RomaEngineeringIntelligence,
  DecisionReason,
  ProductAreaImpact,
  ReleaseDecision,
} from "./roma-engineering-intelligence.types";
import type {
  RomaQualityDashboard,
  QualityComponentCard,
  QualityStatus,
  BlockerSeverity,
} from "./roma-quality-dashboard.types";
import type { RomaAuditRunListItem } from "./roma-run-history.types";
import { formatPercent, formatTimestamp } from "./quality-dashboard-ui";

export function findSystemComponent(
  dashboard: RomaQualityDashboard,
  id: string
): QualityComponentCard | undefined {
  return dashboard.systemComponents.find((c) => c.id === id);
}

export function findDomainSection(dashboard: RomaQualityDashboard, id: string) {
  return dashboard.domainSections.find((s) => s.id === id);
}

/** Health bucket for executive sorting (Critical → Warning → Unknown → Healthy). */
export type HealthBucket = "critical" | "warning" | "unknown" | "healthy";

export function qualityStatusToHealthBucket(status: QualityStatus): HealthBucket {
  switch (status) {
    case "unavailable":
      return "critical";
    case "degraded":
      return "warning";
    case "healthy":
      return "healthy";
    case "unknown":
    case "not_configured":
      return "unknown";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

const HEALTH_BUCKET_RANK: Record<HealthBucket, number> = {
  critical: 0,
  warning: 1,
  unknown: 2,
  healthy: 3,
};

export type PlatformHealthCard = {
  id: string;
  label: string;
  status: QualityStatus;
  statusLabel: string;
  bucket: HealthBucket;
};

const PLATFORM_HEALTH_SPECS: readonly { id: string; label: string; fallbackDomainId?: string }[] = [
  { id: "database", label: "Database" },
  { id: "storage", label: "Storage" },
  { id: "ai", label: "AI" },
  { id: "security", label: "Security" },
  { id: "authentication", label: "Authentication" },
  { id: "deployments", label: "Release Pipeline", fallbackDomainId: "release" },
  { id: "ios", label: "iOS", fallbackDomainId: "mobile" },
  { id: "android", label: "Android", fallbackDomainId: "mobile" },
  { id: "backend_api", label: "API" },
  { id: "notifications", label: "Notifications" },
];

function componentOrDomainStatus(
  dashboard: RomaQualityDashboard,
  componentId: string,
  fallbackDomainId?: string
): { status: QualityStatus; statusLabel: string } {
  const component = findSystemComponent(dashboard, componentId);
  if (component) {
    return { status: component.status, statusLabel: component.statusLabel };
  }
  if (fallbackDomainId) {
    const domain = findDomainSection(dashboard, fallbackDomainId);
    if (domain) {
      return { status: domain.status, statusLabel: domain.statusLabel };
    }
  }
  return { status: "unknown", statusLabel: "Unknown" };
}

export function buildPlatformHealthCards(dashboard: RomaQualityDashboard): PlatformHealthCard[] {
  const cards = PLATFORM_HEALTH_SPECS.map((spec) => {
    const { status, statusLabel } = componentOrDomainStatus(dashboard, spec.id, spec.fallbackDomainId);
    return {
      id: spec.id,
      label: spec.label,
      status,
      statusLabel,
      bucket: qualityStatusToHealthBucket(status),
    };
  });

  return [...cards].sort((a, b) => HEALTH_BUCKET_RANK[a.bucket] - HEALTH_BUCKET_RANK[b.bucket]);
}

export type ExecutiveAction = {
  priority: number;
  title: string;
  effort: string;
  businessImpact: string;
  note?: string;
  href?: string;
};

function inferEffort(action: string): string {
  if (/migration|database|verify/i.test(action)) return "2 min";
  if (/refresh|audit|review/i.test(action)) return "1–5 min";
  if (/configure|deploy|resolve/i.test(action)) return "15+ min";
  return "5 min";
}

function inferBusinessImpact(action: string, severity?: BlockerSeverity): string {
  if (severity === "critical") return "High";
  if (/migration|database|security|auth/i.test(action)) return "Medium";
  if (/ai|openai|storage/i.test(action)) return "Medium";
  if (/monitor|review|refresh/i.test(action)) return "Low";
  return "Medium";
}

export function buildPrioritizedActions(
  intelligence: RomaEngineeringIntelligence,
  testingBase: string
): ExecutiveAction[] {
  const actions: ExecutiveAction[] = [];
  const topReasons = intelligence.decisionReasons.slice(0, 3);

  for (const [index, reason] of topReasons.entries()) {
    actions.push({
      priority: index + 1,
      title: reason.recommendation || reason.title,
      effort: inferEffort(reason.recommendation || reason.title),
      businessImpact: inferBusinessImpact(reason.recommendation, reason.severity),
      note: index === 0 ? "Recommended before next release" : undefined,
    });
  }

  for (const planItem of intelligence.actionPlan) {
    if (actions.length >= 5) break;
    if (actions.some((a) => a.title === planItem)) continue;
    actions.push({
      priority: actions.length + 1,
      title: planItem,
      effort: inferEffort(planItem),
      businessImpact: inferBusinessImpact(planItem),
    });
  }

  const ensureAction = (title: string, href: string, effort: string) => {
    if (actions.length >= 5) return;
    if (actions.some((a) => a.title.toLowerCase() === title.toLowerCase())) return;
    actions.push({
      priority: actions.length + 1,
      title,
      href,
      effort,
      businessImpact: "Low",
    });
  };

  ensureAction("Refresh Safe Audit", `${testingBase}/safe-audit`, "1 min");

  if (intelligence.releaseDecision === "ready_with_warnings") {
    ensureAction("Review release warning", "#release-center", "5 min");
  }

  return actions.slice(0, 5).map((action, index) => ({ ...action, priority: index + 1 }));
}

export type BusinessImpactGroup = {
  affected: ProductAreaImpact[];
  unknown: ProductAreaImpact[];
  healthy: ProductAreaImpact[];
};

export function groupBusinessImpact(areas: readonly ProductAreaImpact[]): BusinessImpactGroup {
  const affected: ProductAreaImpact[] = [];
  const unknown: ProductAreaImpact[] = [];
  const healthy: ProductAreaImpact[] = [];

  for (const area of areas) {
    switch (area.status) {
      case "affected":
        affected.push(area);
        break;
      case "unknown":
        unknown.push(area);
        break;
      case "not_affected":
        healthy.push(area);
        break;
      default:
        unknown.push(area);
        break;
    }
  }

  return { affected, unknown, healthy };
}

export type ChangeTimelineEntry = {
  id: string;
  timeLabel: string;
  title: string;
};

function formatTimelineTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function releaseLabel(decision: ReleaseDecision): string {
  return decision.replace(/_/g, " ").toUpperCase();
}

export function buildRecentChangesTimeline(
  dashboard: RomaQualityDashboard,
  intelligence: RomaEngineeringIntelligence,
  recentAudits: readonly RomaAuditRunListItem[]
): ChangeTimelineEntry[] {
  const entries: ChangeTimelineEntry[] = [];

  entries.push({
    id: "refresh",
    timeLabel: formatTimelineTime(dashboard.dataCoverage.lastRefresh),
    title: "Platform intelligence refreshed",
  });

  if (recentAudits.length > 0) {
    const latest = recentAudits[0];
    entries.push({
      id: `audit-${latest.id}`,
      timeLabel: formatTimelineTime(latest.createdAt),
      title: `Safe Audit saved — ${releaseLabel(latest.releaseRecommendation)}`,
    });
  }

  if (recentAudits.length >= 2) {
    const [latest, previous] = recentAudits;
    if (latest.releaseRecommendation !== previous.releaseRecommendation) {
      entries.push({
        id: "release-change",
        timeLabel: formatTimelineTime(latest.createdAt),
        title: "Release recommendation changed",
      });
    }
  }

  if (intelligence.ownerSummary.warningCount === 0 && intelligence.ownerSummary.criticalBlockersCount === 0) {
    entries.push({
      id: "no-blockers",
      timeLabel: "Yesterday",
      title: "No new release blockers",
    });
  }

  const coverage = dashboard.dataCoverage.coveragePercent;
  if (coverage >= 80) {
    entries.push({
      id: "coverage",
      timeLabel: "Yesterday",
      title: `Decision confidence at ${coverage}%`,
    });
  }

  return entries.slice(0, 6);
}

export function buildPlainEnglishReleaseWhy(intelligence: RomaEngineeringIntelligence): string[] {
  if (intelligence.decisionReasons.length === 0) {
    return ["Live checks show no issues that would block a release today."];
  }
  return intelligence.decisionReasons.slice(0, 4).map((reason) => {
    const impact = reason.impact.replace(/\bprobe\b/gi, "check").replace(/\bevidence\b/gi, "signal");
    return `${reason.title}. ${impact}`;
  });
}

export function formatLastAuditLabel(recentAudits: readonly RomaAuditRunListItem[]): string {
  if (recentAudits.length === 0) return "None yet";
  return formatTimelineTime(recentAudits[0].createdAt);
}

export function formatDeployShaForDiagnostics(dashboard: RomaQualityDashboard): string {
  const sha = dashboard.latestChanges.build ?? dashboard.latestChanges.lastCommit;
  return sha ?? "Not available from live sources";
}

export function healthBucketDotClass(bucket: HealthBucket): string {
  switch (bucket) {
    case "critical":
      return "bg-red-500";
    case "warning":
      return "bg-amber-500";
    case "unknown":
      return "bg-gray-400";
    case "healthy":
      return "bg-emerald-500";
    default: {
      const _exhaustive: never = bucket;
      return _exhaustive;
    }
  }
}

export const ROMA_NAV_STORAGE_KEY = "roma-qa-nav-groups-expanded";

export function loadNavGroupExpandedState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROMA_NAV_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function saveNavGroupExpandedState(state: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROMA_NAV_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}
