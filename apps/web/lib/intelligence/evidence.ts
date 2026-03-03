/**
 * Deterministic evidence pack generator.
 * Structured evidence per project with traceable linking.
 * Web-only; no backend schema changes.
 */

export type EvidenceCategory =
  | "Risk"
  | "Forecast"
  | "Trend"
  | "Persistence"
  | "Governance";

/** Single evidence item with deterministic traceability. */
export interface EvidenceItem {
  category: EvidenceCategory;
  analysisDate: string;
  metricUsed: string;
  deltaUsed: string | null;
  driverTriggered: string;
}

/** One timeline delta between two analyses. */
export interface TimelineDelta {
  fromDate: string;
  toDate: string;
  fromId: string;
  toId: string;
  completionDelta: number;
  riskDelta: string;
}

/** Anomaly reference: type and which analysis (id + date). */
export interface AnomalyReference {
  type: string;
  analysisId: string;
  analysisDate: string;
}

/** Forecast justification for evidence. */
export interface ForecastJustification {
  effectiveVelocity: number | null;
  daysRemaining: number | null;
  forecastDate: string | null;
  reasoning: string;
}

/** Persistence duration from time-weighted. */
export interface PersistenceDuration {
  riskDurationDays: number;
  slowdownDurationIntervals: number;
}

export interface EvidencePack {
  projectId: string;
  projectName: string;
  riskDrivers: string[];
  supportingAnalysisIds: string[];
  timelineDeltas: TimelineDelta[];
  anomalyReferences: AnomalyReference[];
  forecastJustification: ForecastJustification;
  persistenceDuration: PersistenceDuration;
  evidenceByCategory: {
    risk: EvidenceItem[];
    forecast: EvidenceItem[];
    trend: EvidenceItem[];
    persistence: EvidenceItem[];
    governance: EvidenceItem[];
  };
  /** Escalation path: ordered list of driver/flag descriptions. */
  escalationPath: string[];
  /** Confidence context: latest governance confidence. */
  confidenceScore: number;
}

/** Analysis row with id for evidence linking. */
export interface AnalysisWithId {
  id: string;
  created_at: string;
  completion_percent: number;
  risk_level: string;
}

/** Inputs required to build the evidence pack. */
export interface EvidencePackInputs {
  projectId: string;
  projectName: string;
  analysesWithId: AnalysisWithId[];
  riskDrivers: string[];
  strategicRiskIndex: number;
  effectiveVelocity: number | null;
  daysRemaining: number | null;
  forecastDate: string | null;
  velocityTrend: string;
  riskTrajectory: string;
  delayProbability: string;
  persistentHighRisk: boolean;
  persistentSlowdown: boolean;
  riskDurationDays: number;
  slowdownDurationIntervals: number;
  escalationFlag: boolean;
  regressionAnomaly: boolean;
  jumpAnomaly: boolean;
  logicalInconsistency: boolean;
  confidenceScore: number;
}

/**
 * Build structured evidence pack from computed inputs.
 * Deterministic; no AI. Each item links to analysis date, metric, delta, driver.
 */
export function buildEvidencePack(inputs: EvidencePackInputs): EvidencePack {
  const sorted = [...inputs.analysesWithId].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const supportingAnalysisIds = sorted.map((a) => a.id);
  const latestDate =
    sorted.length > 0 ? sorted[sorted.length - 1].created_at : "";
  const latestId = sorted.length > 0 ? sorted[sorted.length - 1].id : "";

  const timelineDeltas: TimelineDelta[] = [];
  const riskNumeric: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const compDelta = b.completion_percent - a.completion_percent;
    const rA = riskNumeric[a.risk_level] ?? 1;
    const rB = riskNumeric[b.risk_level] ?? 1;
    const riskDrift = rB - rA;
    const riskDeltaStr =
      riskDrift > 0 ? `+${riskDrift}` : riskDrift < 0 ? `${riskDrift}` : "0";
    timelineDeltas.push({
      fromDate: a.created_at,
      toDate: b.created_at,
      fromId: a.id,
      toId: b.id,
      completionDelta: compDelta,
      riskDelta: riskDeltaStr,
    });
  }

  const anomalyReferences: AnomalyReference[] = [];
  if (inputs.regressionAnomaly && latestId)
    anomalyReferences.push({
      type: "Regression anomaly",
      analysisId: latestId,
      analysisDate: latestDate,
    });
  if (inputs.jumpAnomaly && latestId)
    anomalyReferences.push({
      type: "Jump anomaly",
      analysisId: latestId,
      analysisDate: latestDate,
    });
  if (inputs.logicalInconsistency && latestId)
    anomalyReferences.push({
      type: "Logical inconsistency",
      analysisId: latestId,
      analysisDate: latestDate,
    });

  const forecastReasoning =
    inputs.effectiveVelocity != null && inputs.effectiveVelocity > 0
      ? `Velocity ${inputs.effectiveVelocity.toFixed(1)} %/day, ${inputs.daysRemaining?.toFixed(0) ?? "—"} days to completion.`
      : "Insufficient velocity or data for forecast.";
  const forecastJustification: ForecastJustification = {
    effectiveVelocity: inputs.effectiveVelocity,
    daysRemaining: inputs.daysRemaining,
    forecastDate: inputs.forecastDate,
    reasoning: forecastReasoning,
  };

  const persistenceDuration: PersistenceDuration = {
    riskDurationDays: inputs.riskDurationDays,
    slowdownDurationIntervals: inputs.slowdownDurationIntervals,
  };

  const riskEvidence: EvidenceItem[] = inputs.riskDrivers.map((d) => ({
    category: "Risk",
    analysisDate: latestDate,
    metricUsed: "strategic_risk_index",
    deltaUsed: null,
    driverTriggered: d,
  }));

  const forecastEvidence: EvidenceItem[] = [
    {
      category: "Forecast",
      analysisDate: latestDate,
      metricUsed: "effective_velocity",
      deltaUsed:
        inputs.effectiveVelocity != null
          ? `${inputs.effectiveVelocity.toFixed(1)} %/day`
          : null,
      driverTriggered: "Completion forecast",
    },
  ];

  const trendEvidence: EvidenceItem[] = [
    {
      category: "Trend",
      analysisDate: latestDate,
      metricUsed: "velocity_trend",
      deltaUsed: inputs.velocityTrend,
      driverTriggered: "Velocity trend",
    },
    {
      category: "Trend",
      analysisDate: latestDate,
      metricUsed: "risk_trajectory",
      deltaUsed: inputs.riskTrajectory,
      driverTriggered: "Risk trajectory",
    },
  ];

  const persistenceEvidence: EvidenceItem[] = [];
  if (inputs.persistentHighRisk) {
    persistenceEvidence.push({
      category: "Persistence",
      analysisDate: latestDate,
      metricUsed: "risk_duration_days",
      deltaUsed: `${inputs.riskDurationDays.toFixed(0)} days`,
      driverTriggered: "Persistent high risk",
    });
  }
  if (inputs.persistentSlowdown) {
    persistenceEvidence.push({
      category: "Persistence",
      analysisDate: latestDate,
      metricUsed: "slowdown_duration_intervals",
      deltaUsed: `${inputs.slowdownDurationIntervals} intervals`,
      driverTriggered: "Persistent slowdown",
    });
  }

  const governanceEvidence: EvidenceItem[] = [
    {
      category: "Governance",
      analysisDate: latestDate,
      metricUsed: "confidence_score",
      deltaUsed: `${inputs.confidenceScore}`,
      driverTriggered: "Governance confidence",
    },
  ];
  anomalyReferences.forEach((ref) => {
    governanceEvidence.push({
      category: "Governance",
      analysisDate: ref.analysisDate,
      metricUsed: "anomaly",
      deltaUsed: ref.type,
      driverTriggered: ref.type,
    });
  });

  const escalationPath: string[] = [];
  if (inputs.riskDrivers.length > 0)
    escalationPath.push(...inputs.riskDrivers);
  if (inputs.delayProbability === "high")
    escalationPath.push("High delay probability");
  if (inputs.escalationFlag) escalationPath.push("Time-weighted escalation");
  if (inputs.riskTrajectory === "rising")
    escalationPath.push("Risk trajectory rising");

  return {
    projectId: inputs.projectId,
    projectName: inputs.projectName,
    riskDrivers: inputs.riskDrivers,
    supportingAnalysisIds,
    timelineDeltas,
    anomalyReferences,
    forecastJustification,
    persistenceDuration,
    evidenceByCategory: {
      risk: riskEvidence,
      forecast: forecastEvidence,
      trend: trendEvidence,
      persistence: persistenceEvidence,
      governance: governanceEvidence,
    },
    escalationPath,
    confidenceScore: inputs.confidenceScore,
  };
}
