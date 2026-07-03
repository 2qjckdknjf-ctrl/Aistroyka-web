import type { BlockerSeverity, RomaQualityDashboard } from "./roma-quality-dashboard.types";
import type {
  ConfidenceLevel,
  DecisionReason,
  EngineeringIssue,
  OwnerOperatorSummary,
  ProductAreaImpact,
  ReleaseDecision,
  RomaEngineeringIntelligence,
} from "./roma-engineering-intelligence.types";

const PRODUCT_AREA_CATALOG: ReadonlyArray<{ id: string; label: string }> = [
  { id: "worker_reports", label: "Worker reports" },
  { id: "photo_media_upload", label: "Photo/media upload" },
  { id: "manager_review", label: "Manager review" },
  { id: "documents", label: "Documents" },
  { id: "costs", label: "Costs" },
  { id: "ai_copilot", label: "AI Copilot" },
  { id: "mobile_apps", label: "Mobile apps" },
  { id: "platform_admin", label: "Platform admin" },
  { id: "tenant_isolation", label: "Tenant isolation" },
  { id: "release_pipeline", label: "Release pipeline" },
] as const;

function componentById(dashboard: RomaQualityDashboard, id: string) {
  return dashboard.systemComponents.find((c) => c.id === id);
}

function hasRecommendation(dashboard: RomaQualityDashboard, id: string): boolean {
  return dashboard.recommendations.some((r) => r.id === id);
}

function hasCriticalProbeGaps(dashboard: RomaQualityDashboard): boolean {
  const connected = dashboard.dataCoverage.available.map((s) => s.id);
  return !connected.includes("core_health") || !connected.includes("supabase_db");
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
  if (!storage || storage.status === "healthy") return null;

  const unavailable = storage.status === "unavailable";
  const notConfigured = storage.status === "not_configured";

  if (notConfigured) {
    return issue({
      id: "storage_impact",
      whatHappened: "Storage probe was not run — service role not configured.",
      whyItHappened: storage.details,
      affectedComponents: ["Storage", "Observability"],
      userImpact: "Upload status cannot be confirmed from this dashboard.",
      businessImpact: "Field media workflow impact is unknown until storage is probed.",
      releaseImpact: "Manual storage verification required before relying on upload flows.",
      severity: "information",
      confidence: "medium",
      recommendedAction: "Configure SUPABASE_SERVICE_ROLE_KEY and re-check storage probe.",
      recheckConditions: "Storage component reports Healthy with media bucket present.",
      evidence: storage.details,
    });
  }

  return issue({
    id: "storage_impact",
    whatHappened: "Supabase storage probe failed.",
    whyItHappened: storage.details,
    affectedComponents: ["Storage", "Worker uploads", "Media pipeline"],
    userImpact: "Field workers may be unable to upload photos and media attachments.",
    businessImpact: "Pilot field evidence quality may degrade; site documentation workflows are at risk.",
    releaseImpact: unavailable ? "Release not recommended until storage is healthy." : "Release with warnings — verify storage before pilot expansion.",
    severity: unavailable ? "critical" : "warning",
    confidence: "high",
    recommendedAction: "Verify storage permissions and the media bucket.",
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

  return issue({
    id: "openai_missing",
    whatHappened: "No AI provider API key is configured at runtime.",
    whyItHappened:
      dashboard.recommendations.find((r) => r.id === "openai_missing")?.evidence ??
      "Health and release-env probes report AI provider not configured.",
    affectedComponents: ["AI", "Copilot", "Vision analysis"],
    userImpact: "AI Copilot and vision-assisted workflows are unavailable.",
    businessImpact: "Core construction operations can continue; AI-assisted insights are offline.",
    releaseImpact: "Release allowed with warnings — AI is optional for core pilot operations.",
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
        ? "Set the required environment variable documented in docs/ENVIRONMENT-VARIABLES.md."
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
    migrationTimeline?.displayValue === "Unavailable" || Boolean(migrationRec);

  if (!migrationUnavailable) return null;

  const probeBlocked = migrationRec?.id === "migration_probe_blocked";
  const probeFailed = migrationRec?.id === "migration_probe_failed" || migrationRec?.id === "migration_empty";

  return issue({
    id: "migration_review",
    whatHappened: probeFailed
      ? "Database migration state could not be confirmed or appears empty."
      : probeBlocked
        ? "Migration inventory probe was skipped."
        : "Migration version is unavailable from live probes.",
    whyItHappened: migrationRec?.evidence ?? migrationTimeline?.displayValue ?? "Migration probe unavailable.",
    affectedComponents: ["Database", "Schema", "API compatibility"],
    userImpact: probeFailed
      ? "Features depending on recent schema changes may fail unpredictably."
      : "Schema drift cannot be ruled out without migration inventory.",
    businessImpact: probeFailed
      ? "Schema mismatch risk during pilot — manual review required."
      : "Release confidence reduced until migration state is verified.",
    releaseImpact: "Manual review required before release.",
    severity: probeFailed ? "warning" : "information",
    confidence: migrationRec ? "high" : "low",
    recommendedAction: probeBlocked
      ? "Provide SUPABASE_SERVICE_ROLE_KEY to enable migration inventory probe."
      : "Reconcile repo migrations with supabase_migrations.schema_migrations before promoting.",
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

  return issue({
    id: "database_unavailable",
    whatHappened: `Database probe status: ${db.statusLabel}.`,
    whyItHappened: db.details,
    affectedComponents: ["Database", "Supabase", "Web Dashboard", "Authentication"],
    userImpact: "Login, project data, and dashboard operations may fail.",
    businessImpact: "Platform is not operationally reliable for pilot or production use.",
    releaseImpact: "Release blocked.",
    severity: "critical",
    confidence: db.status === "unknown" ? "low" : "high",
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
    releaseImpact: "Decision confidence reduced — manual review recommended.",
    severity: "information",
    confidence: "low",
    recommendedAction:
      "Increase probe connectivity (service role, deployment env, GitHub metadata) before relying on release decision.",
    recheckConditions: "Data coverage reaches at least 50% with critical probes (health, DB, release env) connected.",
    evidence: `Connected: ${dashboard.dataCoverage.available.map((s) => s.label).join(", ") || "none"}.`,
  });
}

function collectIssues(dashboard: RomaQualityDashboard): EngineeringIssue[] {
  const issues: EngineeringIssue[] = [];
  for (const item of [
    evaluateCoreHealthIssue(dashboard),
    evaluateDatabaseIssue(dashboard),
    evaluateStorageIssue(dashboard),
    evaluateOpenAiIssue(dashboard),
    evaluateMigrationIssue(dashboard),
    evaluateBillingFlagIssue(dashboard),
    evaluateLowCoverageIssue(dashboard),
    ...evaluateCriticalEnvIssues(dashboard),
  ]) {
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

function deriveReleaseDecision(
  issues: EngineeringIssue[],
  dashboard: RomaQualityDashboard,
  confidence: ConfidenceLevel
): ReleaseDecision {
  if (confidence === "low" && hasCriticalProbeGaps(dashboard)) {
    return "unknown";
  }

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

  if (confidence === "low") {
    return "unknown";
  }

  if (issues.some((i) => i.severity === "information")) {
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
    case "unknown":
      return "UNKNOWN";
    default: {
      const _exhaustive: never = decision;
      return _exhaustive;
    }
  }
}

function computeConfidence(
  dashboard: RomaQualityDashboard,
  issues: EngineeringIssue[]
): { level: ConfidenceLevel; percent: number | null } {
  const coverage = dashboard.dataCoverage.coveragePercent;
  const lowConfidenceIssues = issues.filter((i) => i.confidence === "low").length;
  const probeGaps = hasCriticalProbeGaps(dashboard);

  if (coverage < 40 || lowConfidenceIssues > 0 || probeGaps) {
    return { level: "low", percent: probeGaps ? Math.min(coverage, 40) : coverage };
  }
  if (coverage < 70 || issues.some((i) => i.confidence === "medium")) {
    return { level: "medium", percent: coverage };
  }
  return { level: "high", percent: coverage };
}

function buildDecisionReasons(issues: EngineeringIssue[]): DecisionReason[] {
  return [...issues]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 5)
    .map((i) => ({
      title: i.whatHappened,
      component: i.affectedComponents[0] ?? "Platform",
      severity: i.severity,
      evidence: i.evidence,
      impact: i.userImpact,
      recommendation: i.recommendedAction,
      recheckCondition: i.recheckConditions,
    }));
}

function buildAffectedProductAreas(
  dashboard: RomaQualityDashboard,
  issues: EngineeringIssue[]
): ProductAreaImpact[] {
  const issueIds = new Set(issues.map((i) => i.id));
  const db = componentById(dashboard, "database");
  const storage = componentById(dashboard, "storage");
  const ai = componentById(dashboard, "ai");
  const mobile = componentById(dashboard, "ios") ?? componentById(dashboard, "android");

  const areaEvidence: Record<string, { status: ProductAreaImpact["status"]; evidence: string | null }> = {
    worker_reports: { status: "not_affected", evidence: null },
    photo_media_upload: { status: "not_affected", evidence: null },
    manager_review: { status: "not_affected", evidence: null },
    documents: { status: "not_affected", evidence: null },
    costs: { status: "not_affected", evidence: null },
    ai_copilot: { status: "not_affected", evidence: null },
    mobile_apps: { status: "not_affected", evidence: null },
    platform_admin: { status: "not_affected", evidence: null },
    tenant_isolation: { status: "not_affected", evidence: null },
    release_pipeline: { status: "not_affected", evidence: null },
  };

  if (issueIds.has("storage_impact") && storage && storage.status === "unavailable") {
    areaEvidence.photo_media_upload = { status: "affected", evidence: storage.details };
    areaEvidence.worker_reports = { status: "affected", evidence: "Storage probe failed — field media may not persist." };
  } else if (issueIds.has("storage_impact")) {
    areaEvidence.photo_media_upload = { status: "unknown", evidence: storage?.details ?? "Storage not verified." };
  }

  if (issueIds.has("openai_missing")) {
    areaEvidence.ai_copilot = {
      status: "affected",
      evidence: issues.find((i) => i.id === "openai_missing")?.evidence ?? null,
    };
  }

  if (issueIds.has("database_unavailable") || (db && db.status !== "healthy")) {
    const ev = db?.details ?? issues.find((i) => i.id === "database_unavailable")?.evidence ?? null;
    areaEvidence.worker_reports = { status: "affected", evidence: ev };
    areaEvidence.manager_review = { status: "affected", evidence: ev };
    areaEvidence.documents = { status: "affected", evidence: ev };
    areaEvidence.platform_admin = { status: "affected", evidence: ev };
    areaEvidence.tenant_isolation = { status: "unknown", evidence: "Database unhealthy — tenant isolation impact not independently probed." };
  }

  if (issueIds.has("core_health_degraded")) {
    const ev = issues.find((i) => i.id === "core_health_degraded")?.evidence ?? null;
    for (const key of ["worker_reports", "manager_review", "platform_admin", "release_pipeline"] as const) {
      if (areaEvidence[key].status === "not_affected") {
        areaEvidence[key] = { status: "affected", evidence: ev };
      }
    }
  }

  if (issueIds.has("billing_flag_inconsistent")) {
    areaEvidence.costs = {
      status: "affected",
      evidence: issues.find((i) => i.id === "billing_flag_inconsistent")?.evidence ?? null,
    };
  }

  if (issueIds.has("migration_review")) {
    areaEvidence.release_pipeline = {
      status: "affected",
      evidence: issues.find((i) => i.id === "migration_review")?.evidence ?? null,
    };
  }

  if (mobile && (mobile.status === "unknown" || mobile.status === "unavailable")) {
    areaEvidence.mobile_apps = { status: "unknown", evidence: mobile.details };
  } else if (mobile && mobile.status === "degraded") {
    areaEvidence.mobile_apps = { status: "affected", evidence: mobile.details };
  }

  if (issueIds.has("low_data_coverage")) {
    for (const key of Object.keys(areaEvidence)) {
      if (areaEvidence[key].status === "not_affected") {
        areaEvidence[key] = { status: "unknown", evidence: "Insufficient probe coverage to confirm." };
      }
    }
  }

  return PRODUCT_AREA_CATALOG.map((area) => ({
    id: area.id,
    label: area.label,
    status: areaEvidence[area.id]?.status ?? "unknown",
    evidence: areaEvidence[area.id]?.evidence ?? null,
  }));
}

function buildCoverageExplanation(dashboard: RomaQualityDashboard): {
  explanation: string;
  blindSpots: string[];
} {
  const pct = dashboard.dataCoverage.coveragePercent;
  const connected = dashboard.dataCoverage.available.map((s) => s.label);
  const unavailable = dashboard.dataCoverage.unavailable.map((s) => s.label);

  const connectedSample = connected.slice(0, 4).join(", ") || "none";
  const unavailableSample = unavailable.slice(0, 4).join(", ") || "none";

  let explanation = `Coverage is ${pct}%. ROMA can see ${connectedSample || "no connected sources"}`;
  if (unavailable.length > 0) {
    explanation += `, but cannot see ${unavailableSample}${unavailable.length > 4 ? ", and others" : ""}.`;
  } else {
    explanation += ".";
  }

  if (pct < 50) {
    explanation +=
      " Low coverage prevents ROMA from confirming CI history, migration state, storage health, or performance telemetry.";
  } else if (pct < 80) {
    explanation += " Some blind spots remain — treat release decision as advisory.";
  }

  const blindSpots = unavailable.length > 0 ? unavailable : ["No unavailable sources recorded."];
  return { explanation, blindSpots };
}

function buildOwnerSummary(
  dashboard: RomaQualityDashboard,
  issues: EngineeringIssue[],
  releaseDecision: ReleaseDecision,
  confidence: ConfidenceLevel,
  actionPlan: string[]
): OwnerOperatorSummary {
  const readinessPercent = dashboard.platformStatus.releaseReadinessPercent;
  return {
    releaseDecisionLabel: releaseDecisionLabel(releaseDecision),
    confidenceLabel: confidence.toUpperCase(),
    readinessScoreLabel: readinessPercent !== null ? `${readinessPercent}%` : "Score unavailable",
    criticalBlockersCount: issues.filter((i) => i.severity === "critical").length,
    warningCount: issues.filter((i) => i.severity === "warning").length,
    evidenceCoveragePercent: dashboard.dataCoverage.coveragePercent,
    lastUpdated: dashboard.platformStatus.lastUpdated,
    environment: dashboard.environment.label,
    nextSafeAction:
      actionPlan[0] ??
      (releaseDecision === "ready"
        ? "Continue monitoring; no immediate action required from probe evidence."
        : "Review top decision reasons and resolve highest-severity evidence before release."),
  };
}

function buildReasoning(issues: EngineeringIssue[]): string[] {
  const chains = issues
    .slice(0, 5)
    .map((item) => `${item.whatHappened} → ${item.userImpact} → ${item.releaseImpact}`);
  if (chains.length === 0) {
    chains.push("Live probes show no material engineering issues — core platform appears operational.");
  }
  return chains;
}

function buildActionPlan(issues: EngineeringIssue[]): string[] {
  return [
    ...new Set(
      issues
        .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
        .map((i) => i.recommendedAction)
    ),
  ].slice(0, 5);
}

function buildRecommendations(issues: EngineeringIssue[]): string[] {
  return buildActionPlan(issues);
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
  return [...issues]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 3)
    .map((i) => `${i.whatHappened} (${i.severity})`)
    .join("; ");
}

function buildEngineeringAssessment(
  dashboard: RomaQualityDashboard,
  issues: EngineeringIssue[],
  decision: ReleaseDecision
): string {
  const health = dashboard.platformStatus.overallHealthLabel;
  const coverage = dashboard.dataCoverage.coveragePercent;
  if (issues.length === 0) {
    return `Platform health is ${health} with ${coverage}% probe coverage. No blocking engineering issues detected.`;
  }
  const top = [...issues].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0];
  return `Platform health is ${health} (${coverage}% coverage). Primary concern: ${top?.whatHappened ?? "unknown"}. Release posture: ${releaseDecisionLabel(decision)}.`;
}

export function buildRomaEngineeringIntelligence(
  dashboard: RomaQualityDashboard
): RomaEngineeringIntelligence {
  const issues = collectIssues(dashboard);
  const confidence = computeConfidence(dashboard, issues);
  const releaseDecision = deriveReleaseDecision(issues, dashboard, confidence.level);
  const actionPlan = buildActionPlan(issues);
  const coverage = buildCoverageExplanation(dashboard);
  const topRisks = [...issues]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 5);

  return {
    engineeringAssessment: buildEngineeringAssessment(dashboard, issues, releaseDecision),
    releaseDecision,
    releaseDecisionLabel: releaseDecisionLabel(releaseDecision),
    riskAnalysis: buildRiskAnalysis(issues),
    businessImpact: aggregateBusinessImpact(issues),
    actionPlan,
    confidenceScore: confidence.level,
    confidencePercent: confidence.percent,
    engineeringSummary: buildEngineeringAssessment(dashboard, issues, releaseDecision),
    ownerSummary: buildOwnerSummary(dashboard, issues, releaseDecision, confidence.level, actionPlan),
    decisionReasons: buildDecisionReasons(issues),
    affectedProductAreas: buildAffectedProductAreas(dashboard, issues),
    coverageExplanation: coverage.explanation,
    coverageBlindSpots: coverage.blindSpots,
    topRisks,
    recommendations: buildRecommendations(issues),
    reasoning: buildReasoning(issues),
  };
}
