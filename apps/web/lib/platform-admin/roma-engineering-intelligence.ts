import type { BlockerSeverity, RomaQualityDashboard } from "./roma-quality-dashboard.types";
import type {
  ConfidenceLevel,
  EngineeringIssue,
  ReleaseDecision,
  RomaEngineeringIntelligence,
} from "./roma-engineering-intelligence.types";

function componentById(dashboard: RomaQualityDashboard, id: string) {
  return dashboard.systemComponents.find((c) => c.id === id);
}

function hasRecommendation(dashboard: RomaQualityDashboard, id: string): boolean {
  return dashboard.recommendations.some((r) => r.id === id);
}

function criticalBlockers(dashboard: RomaQualityDashboard) {
  return dashboard.blockers.filter((b) => b.severity === "critical");
}

function issue(
  partial: Omit<EngineeringIssue, "confidence"> & { confidence?: ConfidenceLevel }
): EngineeringIssue {
  return {
    confidence: partial.confidence ?? "high",
    ...partial,
  };
}

function evaluateStorageIssue(dashboard: RomaQualityDashboard): EngineeringIssue | null {
  const storage = componentById(dashboard, "storage");
  if (!storage) return null;

  if (storage.status === "healthy") return null;

  const unavailable = storage.status === "unavailable" || storage.status === "not_configured";
  return issue({
    id: "storage_impact",
    whatHappened: unavailable
      ? "Supabase storage probe did not succeed."
      : "Storage is reachable but the media bucket check is degraded.",
    whyItHappened: storage.details,
    affectedComponents: ["Storage", "Worker uploads", "Media pipeline"],
    userImpact: unavailable
      ? "Field workers may be unable to upload photos and media attachments."
      : "Upload reliability may be intermittent until the media bucket is verified.",
    businessImpact: unavailable
      ? "Pilot field evidence quality degrades; site documentation workflows are at risk."
      : "Pilot quality may be degraded until storage is fully verified.",
    releaseImpact: unavailable ? "Release not recommended until storage is healthy." : "Release with warnings — verify storage before pilot expansion.",
    severity: unavailable ? "critical" : "warning",
    confidence: storage.details.includes("Service role") ? "high" : "medium",
    recommendedAction: unavailable
      ? "Verify SUPABASE_SERVICE_ROLE_KEY, storage permissions, and the media bucket."
      : "Confirm the media bucket exists and storage policies allow worker uploads.",
    recheckConditions: "Storage component status becomes Healthy and media bucket probe passes.",
    evidence: storage.details,
  });
}

function evaluateOpenAiIssue(dashboard: RomaQualityDashboard): EngineeringIssue | null {
  const ai = componentById(dashboard, "ai");
  const openAiMissing =
    hasRecommendation(dashboard, "openai_missing") ||
    ai?.status === "not_configured" ||
    dashboard.knownRisks.some((r) => r.component === "AI" && r.title.includes("not fully configured"));

  if (!openAiMissing) return null;

  const coreHealthy =
    dashboard.platformStatus.overallHealth === "healthy" ||
    dashboard.platformStatus.overallHealth === "degraded";

  return issue({
    id: "openai_missing",
    whatHappened: "No AI provider API key is configured at runtime.",
    whyItHappened:
      dashboard.recommendations.find((r) => r.id === "openai_missing")?.evidence ??
      "Health and release-env probes report AI provider not configured.",
    affectedComponents: ["AI", "Copilot", "Vision analysis"],
    userImpact: "AI Copilot and vision-assisted workflows are unavailable.",
    businessImpact: "Core construction operations can continue; AI-assisted insights are offline.",
    releaseImpact: coreHealthy
      ? "Release allowed — AI is optional for core pilot operations."
      : "Release decision depends on resolving core health issues first.",
    severity: "warning",
    confidence: hasRecommendation(dashboard, "openai_missing") ? "high" : "medium",
    recommendedAction: "Configure OPENAI_API_KEY or an alternate vision provider key.",
    recheckConditions: "AI component shows configured and health reports aiConfigured/openaiConfigured true.",
    evidence:
      dashboard.recommendations.find((r) => r.id === "openai_missing")?.evidence ??
      ai?.details ??
      "AI probe indicates not configured.",
  });
}

function evaluateCriticalEnvIssues(dashboard: RomaQualityDashboard): EngineeringIssue[] {
  const envRecs = dashboard.recommendations.filter(
    (r) => r.id.startsWith("env_missing_") || r.id.startsWith("env_forbidden_") || r.id === "cron_not_configured"
  );
  return envRecs.map((rec) =>
    issue({
      id: rec.id,
      whatHappened: rec.title,
      whyItHappened: rec.evidence,
      affectedComponents: ["Platform", "Security", rec.component],
      userImpact: "Users may experience auth failures, startup errors, or unsafe debug behavior.",
      businessImpact: "Platform startup and operational stability are at risk.",
      releaseImpact: "Release blocked until critical environment issues are resolved.",
      severity: "critical",
      confidence: "high",
      recommendedAction: rec.title.includes("missing")
        ? `Set the required environment variable documented in docs/ENVIRONMENT-VARIABLES.md.`
        : "Disable debug flags and satisfy production cron secret requirements.",
      recheckConditions: "Release environment validation returns PASS with no criticalMissing or forbiddenInProdSet.",
      evidence: rec.evidence,
    })
  );
}

function evaluateMigrationIssue(dashboard: RomaQualityDashboard): EngineeringIssue | null {
  const migrationRec = dashboard.recommendations.find(
    (r) => r.id === "migration_probe_failed" || r.id === "migration_probe_blocked" || r.id === "migration_empty"
  );
  const migrationTimeline = dashboard.platformTimeline.find((e) => e.id === "last_migration");
  const migrationUnavailable =
    migrationTimeline?.displayValue === "Unavailable" ||
    Boolean(migrationRec);

  if (!migrationUnavailable) return null;

  const blocked = migrationRec?.id === "migration_probe_failed" || migrationRec?.id === "migration_empty";

  return issue({
    id: "migration_review",
    whatHappened: blocked
      ? "Database migration state could not be confirmed or appears empty."
      : "Migration inventory probe was skipped.",
    whyItHappened: migrationRec?.evidence ?? migrationTimeline?.displayValue ?? "Migration probe unavailable.",
    affectedComponents: ["Database", "Schema", "API compatibility"],
    userImpact: "Features depending on recent schema changes may fail unpredictably.",
    businessImpact: "Schema mismatch risk during pilot — data integrity and feature availability uncertain.",
    releaseImpact: "Manual review required before release.",
    severity: blocked ? "warning" : "information",
    confidence: migrationRec ? "high" : "low",
    recommendedAction: blocked
      ? "Reconcile repo migrations with supabase_migrations.schema_migrations before promoting."
      : "Provide SUPABASE_SERVICE_ROLE_KEY to enable migration inventory probe.",
    recheckConditions: "Migration probe connected and latest migration version matches expected repo head.",
    evidence: migrationRec?.evidence ?? migrationTimeline?.displayValue ?? "Insufficient migration evidence.",
  });
}

function evaluateCoreHealthIssue(dashboard: RomaQualityDashboard): EngineeringIssue | null {
  if (dashboard.platformStatus.overallHealth === "healthy") return null;

  const healthComponent = componentById(dashboard, "backend_api");
  const unavailable = dashboard.platformStatus.overallHealth === "unavailable";

  return issue({
    id: "core_health_degraded",
    whatHappened: `Overall platform health is ${dashboard.platformStatus.overallHealthLabel}.`,
    whyItHappened: healthComponent?.details ?? dashboard.platformStatus.overallHealth,
    affectedComponents: ["Backend API", "Website", "Web Dashboard"],
    userImpact: unavailable
      ? "Users may be unable to access core platform features."
      : "Some platform features may be slow or partially unavailable.",
    businessImpact: unavailable
      ? "Pilot operations should pause until core health recovers."
      : "Pilot confidence reduced; monitor closely during operations.",
    releaseImpact: unavailable ? "Release blocked." : "Release not recommended until health stabilizes.",
    severity: unavailable ? "critical" : "warning",
    confidence: healthComponent ? "high" : "medium",
    recommendedAction: "Inspect /api/v1/health, Supabase connectivity, and recent deploy changes.",
    recheckConditions: "Overall health returns Healthy and core API probe succeeds.",
    evidence: healthComponent?.details ?? dashboard.platformStatus.overallHealthLabel,
  });
}

function evaluateDatabaseIssue(dashboard: RomaQualityDashboard): EngineeringIssue | null {
  const db = componentById(dashboard, "database");
  if (!db || db.status === "healthy") return null;

  const unavailable = db.status === "unavailable" || db.status === "not_configured";
  return issue({
    id: "database_unavailable",
    whatHappened: `Database probe status: ${db.statusLabel}.`,
    whyItHappened: db.details,
    affectedComponents: ["Database", "Supabase", "Web Dashboard", "Authentication"],
    userImpact: "Login, project data, and dashboard operations may fail.",
    businessImpact: "Platform is not operationally reliable for pilot or production use.",
    releaseImpact: "Release blocked.",
    severity: "critical",
    confidence: "high",
    recommendedAction: "Verify NEXT_PUBLIC_SUPABASE_URL, anon key, and database reachability.",
    recheckConditions: "Database component status becomes Healthy.",
    evidence: db.details,
  });
}

function evaluateBillingFlagIssue(dashboard: RomaQualityDashboard): EngineeringIssue | null {
  const rec = dashboard.recommendations.find((r) => r.id === "billing_flag_inconsistent");
  if (!rec) return null;

  return issue({
    id: "billing_flag_inconsistent",
    whatHappened: "Stripe billing feature flag is enabled but configuration is invalid.",
    whyItHappened: rec.evidence,
    affectedComponents: ["Billing", "Checkout", "Entitlements"],
    userImpact: "Billing flows may fall back to sandbox or fail at checkout.",
    businessImpact: "Revenue and subscription flows are unreliable until config is aligned.",
    releaseImpact: "Release with warnings — billing is not production-ready.",
    severity: "warning",
    confidence: "high",
    recommendedAction: "Align ENABLE_STRIPE_BILLING_PROVIDER with valid STRIPE_SECRET_KEY and webhook secrets.",
    recheckConditions: "Billing diagnostics report configValid true with consistent adapter kind.",
    evidence: rec.evidence,
  });
}

function evaluateLowCoverageIssue(dashboard: RomaQualityDashboard): EngineeringIssue | null {
  if (dashboard.dataCoverage.coveragePercent >= 50) return null;

  return issue({
    id: "low_data_coverage",
    whatHappened: `Live data coverage is ${dashboard.dataCoverage.coveragePercent}% (${dashboard.dataCoverage.connectedCount}/${dashboard.dataCoverage.totalCatalogCount} sources).`,
    whyItHappened: "Multiple probes unavailable — often missing service role or external deployment context.",
    affectedComponents: ["Observability", "Release decision confidence"],
    userImpact: "No direct user impact; operator visibility is reduced.",
    businessImpact: "Engineering conclusions may miss hidden risks due to incomplete telemetry.",
    releaseImpact: "Manual review recommended — automated confidence is reduced.",
    severity: "information",
    confidence: "low",
    recommendedAction: "Increase probe connectivity (service role, deployment env, GitHub metadata) before relying on release decision.",
    recheckConditions: "Data coverage reaches at least 50% with critical probes (health, DB, release env) connected.",
    evidence: `Connected: ${dashboard.dataCoverage.available.map((s) => s.label).join(", ") || "none"}.`,
  });
}

function collectIssues(dashboard: RomaQualityDashboard): EngineeringIssue[] {
  const issues: EngineeringIssue[] = [];

  const candidates = [
    evaluateCoreHealthIssue(dashboard),
    evaluateDatabaseIssue(dashboard),
    evaluateStorageIssue(dashboard),
    evaluateOpenAiIssue(dashboard),
    evaluateMigrationIssue(dashboard),
    evaluateBillingFlagIssue(dashboard),
    evaluateLowCoverageIssue(dashboard),
    ...evaluateCriticalEnvIssues(dashboard),
  ];

  for (const item of candidates) {
    if (item) issues.push(item);
  }

  return issues;
}

function severityRank(severity: BlockerSeverity): number {
  switch (severity) {
    case "critical":
      return 3;
    case "warning":
      return 2;
    case "information":
      return 1;
    case "unknown":
      return 0;
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}

function isReleaseBlocking(issue: EngineeringIssue): boolean {
  const impact = issue.releaseImpact.toLowerCase();
  return (
    issue.severity === "critical" &&
    (impact.includes("blocked") || impact.includes("not recommended"))
  );
}

function deriveReleaseDecision(issues: EngineeringIssue[]): ReleaseDecision {
  if (issues.some(isReleaseBlocking)) {
    return "not_ready";
  }
  if (
    issues.some(
      (i) =>
        i.severity === "warning" ||
        i.releaseImpact.toLowerCase().includes("warnings") ||
        i.releaseImpact.toLowerCase().includes("manual review")
    )
  ) {
    return "ready_with_warnings";
  }
  if (issues.length > 0) {
    return "ready_with_warnings";
  }
  return "ready";
}

function releaseDecisionLabel(decision: ReleaseDecision): string {
  switch (decision) {
    case "ready":
      return "READY";
    case "not_ready":
      return "NOT READY";
    case "ready_with_warnings":
      return "READY WITH WARNINGS";
    default: {
      const _exhaustive: never = decision;
      return _exhaustive;
    }
  }
}

function computeConfidence(dashboard: RomaQualityDashboard, issues: EngineeringIssue[]): {
  level: ConfidenceLevel;
  percent: number | null;
} {
  const coverage = dashboard.dataCoverage.coveragePercent;
  const lowConfidenceIssues = issues.filter((i) => i.confidence === "low").length;
  const hasCriticalProbeGaps =
    !dashboard.dataCoverage.available.some((s) => s.id === "core_health") ||
    !dashboard.dataCoverage.available.some((s) => s.id === "supabase_db");

  if (coverage < 40 || lowConfidenceIssues > 0 || hasCriticalProbeGaps) {
    return { level: "low", percent: Math.min(coverage, 40) };
  }
  if (coverage < 70 || issues.some((i) => i.confidence === "medium")) {
    return { level: "medium", percent: coverage };
  }
  return { level: "high", percent: coverage };
}

function buildReasoning(issues: EngineeringIssue[]): string[] {
  const chains: string[] = [];
  for (const item of issues.slice(0, 6)) {
    chains.push(
      `${item.whatHappened} → ${item.userImpact} → ${item.releaseImpact}`
    );
  }
  if (chains.length === 0) {
    chains.push("Live probes show no material engineering issues — core platform appears operational.");
  }
  return chains;
}

function buildActionPlan(issues: EngineeringIssue[]): string[] {
  const actions = issues
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .map((i) => i.recommendedAction);
  return [...new Set(actions)].slice(0, 8);
}

function buildRecommendations(issues: EngineeringIssue[]): string[] {
  return [...new Set(issues.map((i) => i.recommendedAction))].slice(0, 8);
}

function aggregateBusinessImpact(issues: EngineeringIssue[]): string {
  if (issues.length === 0) {
    return "No material business impact detected from current live probes.";
  }
  const critical = issues.filter((i) => i.severity === "critical");
  if (critical.length > 0) {
    return critical.map((i) => i.businessImpact).join(" ");
  }
  return issues[0]?.businessImpact ?? "Business impact requires manual review.";
}

function buildRiskAnalysis(issues: EngineeringIssue[]): string {
  if (issues.length === 0) return "No top risks identified from probe evidence.";
  const top = [...issues].sort((a, b) => severityRank(b.severity) - severityRank(a.severity)).slice(0, 3);
  return top.map((i) => `${i.whatHappened} (${i.severity})`).join("; ");
}

function buildEngineeringAssessment(dashboard: RomaQualityDashboard, issues: EngineeringIssue[]): string {
  const decision = deriveReleaseDecision(issues);
  const health = dashboard.platformStatus.overallHealthLabel;
  const coverage = dashboard.dataCoverage.coveragePercent;
  if (issues.length === 0) {
    return `Platform health is ${health} with ${coverage}% probe coverage. No blocking engineering issues detected.`;
  }
  const top = issues.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0];
  return `Platform health is ${health} (${coverage}% coverage). Primary concern: ${top?.whatHappened ?? "unknown"}. Release posture: ${releaseDecisionLabel(decision)}.`;
}

export function buildRomaEngineeringIntelligence(
  dashboard: RomaQualityDashboard
): RomaEngineeringIntelligence {
  const issues = collectIssues(dashboard);
  const releaseDecision = deriveReleaseDecision(issues);
  const confidence = computeConfidence(dashboard, issues);
  const topRisks = [...issues]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 5);

  return {
    engineeringAssessment: buildEngineeringAssessment(dashboard, issues),
    releaseDecision,
    releaseDecisionLabel: releaseDecisionLabel(releaseDecision),
    riskAnalysis: buildRiskAnalysis(issues),
    businessImpact: aggregateBusinessImpact(issues),
    actionPlan: buildActionPlan(issues),
    confidenceScore: confidence.level,
    confidencePercent: confidence.percent,
    engineeringSummary: buildEngineeringAssessment(dashboard, issues),
    topRisks,
    recommendations: buildRecommendations(issues),
    reasoning: buildReasoning(issues),
  };
}
