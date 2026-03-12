import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/rpc";
import { UploadMediaForm } from "../UploadMediaForm";
import { ProjectPollingSection } from "../ProjectPollingSection";
import { ExecutiveOverviewBlock } from "../ExecutiveOverviewBlock";
import { TrendSummaryBlock } from "../TrendSummaryBlock";
import { LatestAnalysisBlock } from "../LatestAnalysisBlock";
import { RiskPersistenceAnalysis } from "../RiskPersistenceAnalysis";
import { EvidenceOverview } from "../EvidenceOverview";
import { DecisionSimulation } from "../DecisionSimulation";
import { SystemStabilityOverview } from "../SystemStabilityOverview";
import { NextActions } from "../NextActions";
import { SectionHeader, Card } from "@/components/ui";
import { Collapsible } from "@/components/ui-lite";
import { AiActionPanel } from "@/components/ai/AiActionPanel";
import { buildDecisionContextFromProject } from "@/lib/engine/buildContext";
import { buildEvidencePack } from "@/lib/intelligence/evidence";
import { computeProjection } from "@/lib/intelligence/projection";
import { computeGovernance } from "@/lib/intelligence/governance";
import { computeStrategicRisk } from "@/lib/intelligence/strategicRisk";
import { computeTimeWeighted } from "@/lib/intelligence/timeWeighted";
import { computeHealthScore } from "@/lib/intelligence/healthScore";
import { runSimulation } from "@/lib/intelligence/simulation";
import { validateAnalysisResult } from "@/lib/api/validateAnalysisResult";
import type { MediaWithJob } from "@/lib/types";
import type { AnalysisSnapshot } from "@/lib/intelligence/metrics";

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes, UI-only

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("projectDetail");
  const tProjects = await getTranslations("projects");
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) notFound();

  const { data: project } = await getProjectById(supabase, id);
  if (!project) notFound();

  const { data: mediaRows } = await supabase
    .from("media")
    .select("id, project_id, type, file_url, uploaded_at")
    .eq("project_id", id)
    .order("uploaded_at", { ascending: false });

  const mediaList = mediaRows ?? [];
  const mediaIds = mediaList.map((m) => m.id);

  const { data: jobsRows } =
    mediaIds.length > 0
      ? await supabase
          .from("analysis_jobs")
          .select("id, media_id, status, started_at, finished_at, error_message")
          .in("media_id", mediaIds)
          .order("started_at", { ascending: false })
      : {
          data: [] as {
            id: string;
            media_id: string;
            status: string;
            started_at: string;
            finished_at: string | null;
            error_message: string | null;
          }[],
        };

  const jobs = jobsRows ?? [];
  const jobIds = jobs.map((j) => j.id);

  const { data: analysisRows } =
    jobIds.length > 0
      ? await supabase
          .from("ai_analysis")
          .select(
            "id, job_id, media_id, stage, completion_percent, risk_level, detected_issues, recommendations, created_at"
          )
          .in("job_id", jobIds)
      : { data: [] };

  const analyses = (analysisRows ?? []) as MediaWithJob["analysis"][];
  const analysisByJobId = new Map<string, NonNullable<MediaWithJob["analysis"]>>();
  for (const a of analyses) {
    if (a?.job_id) analysisByJobId.set(a.job_id, a);
  }

  const now = Date.now();
  const mediaWithJobs: MediaWithJob[] = mediaList.map((m) => {
    const mediaJobs = jobs.filter((j) => j.media_id === m.id);
    const job = mediaJobs.length > 0
      ? mediaJobs.sort(
          (a, b) =>
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )[0]
      : null;
    const timedOut =
      job?.status === "processing" &&
      now - new Date(job.started_at).getTime() > PROCESSING_TIMEOUT_MS;
    const jobRow = job
      ? {
          id: job.id,
          media_id: job.media_id,
          status: job.status as import("@/lib/types").JobStatus,
          started_at: job.started_at,
          finished_at: job.finished_at,
          error_message: job.error_message,
          ...(timedOut && { timedOut: true }),
        }
      : null;
    const analysis = job ? analysisByJobId.get(job.id) ?? null : null;
    return {
      media: {
        id: m.id,
        project_id: m.project_id,
        type: m.type as "image" | "video",
        file_url: m.file_url,
        uploaded_at: m.uploaded_at,
      },
      job: jobRow,
      analysis,
    };
  });

  const hasActiveJobs = mediaWithJobs.some((mw) => {
    if (!mw.job) return false;
    if (mw.job.timedOut) return false;
    const s = mw.job.status;
    return s === "pending" || s === "queued" || s === "processing";
  });

  const hasTimedOutJobs = mediaWithJobs.some((mw) => mw.job?.timedOut === true);

  const analysisHistory: AnalysisSnapshot[] = (analyses ?? [])
    .filter((a): a is NonNullable<MediaWithJob["analysis"]> => a != null)
    .map((a) => ({
      created_at: a.created_at,
      stage: a.stage,
      completion_percent: a.completion_percent,
      risk_level: a.risk_level,
    }))
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  const previousByMediaId: Record<
    string,
    { completion_percent: number; created_at: string }
  > = {};
  const byMedia = new Map<
    string,
    Array<{ completion_percent: number; created_at: string }>
  >();
  for (const a of analyses ?? []) {
    if (!a?.media_id) continue;
    const list = byMedia.get(a.media_id) ?? [];
    list.push({
      completion_percent: a.completion_percent,
      created_at: a.created_at,
    });
    byMedia.set(a.media_id, list);
  }
  byMedia.forEach((list, mediaId) => {
    list.sort(
      (x, y) =>
        new Date(x.created_at).getTime() - new Date(y.created_at).getTime()
    );
    if (list.length >= 2) {
      previousByMediaId[mediaId] = list[list.length - 2];
    }
  });

  const analysesByTime = [...(analyses ?? [])].filter(
    (a): a is NonNullable<MediaWithJob["analysis"]> => a != null
  );
  analysesByTime.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const latestAnalysis =
    analysesByTime.length > 0 ? analysesByTime[analysesByTime.length - 1] : null;
  const previousSnapshotForStrategic =
    analysesByTime.length >= 2
      ? {
          completion_percent: analysesByTime[analysesByTime.length - 2]
            .completion_percent,
          created_at: analysesByTime[analysesByTime.length - 2].created_at,
        }
      : null;

  const proj = computeProjection(analysisHistory);
  let confidenceBelow60 = false;
  let confidenceScore = 100;
  let regressionAnomaly = false;
  let jumpAnomaly = false;
  let logicalInconsistency = false;
  if (latestAnalysis) {
    const validation = validateAnalysisResult({
      stage: latestAnalysis.stage ?? "",
      completion_percent: latestAnalysis.completion_percent,
      risk_level: latestAnalysis.risk_level,
      detected_issues: latestAnalysis.detected_issues ?? [],
      recommendations: latestAnalysis.recommendations ?? [],
    });
    if (validation.success) {
      const gov = computeGovernance(
        { ...validation.data, created_at: latestAnalysis.created_at },
        previousSnapshotForStrategic
      );
      confidenceBelow60 = gov.confidenceScore < 60;
      confidenceScore = gov.confidenceScore;
      regressionAnomaly = gov.regressionAnomaly;
      jumpAnomaly = gov.jumpAnomaly;
      logicalInconsistency = gov.logicalInconsistency;
    }
  }
  const strategicResult = computeStrategicRisk({
    riskLevel: (latestAnalysis?.risk_level ?? "low") as "low" | "medium" | "high",
    slowdownTrend: proj.slowdownTrend,
    delayProbabilityHigh: proj.delayProbability === "high",
    confidenceBelow60,
    regressionAnomaly,
    logicalInconsistency,
  });
  const timeWeighted =
    analysisHistory.length >= 2
      ? computeTimeWeighted(analysisHistory, strategicResult.strategicRiskIndex)
      : null;
  const healthAdjustment = timeWeighted?.healthAdjustment ?? 0;

  const healthResult = computeHealthScore({
    strategicRiskIndex: strategicResult.strategicRiskIndex,
    confidenceScore,
    delayProbabilityHigh: proj.delayProbability === "high",
    slowdownTrend: proj.slowdownTrend,
    anomalyFlagCount: [regressionAnomaly, jumpAnomaly, logicalInconsistency].filter(Boolean).length,
  });
  const currentHealthScore = Math.max(
    0,
    Math.min(100, healthResult.healthScore + healthAdjustment)
  );

  const simulationResult =
    proj.effectiveVelocity != null
      ? runSimulation({
          currentCompletion: proj.currentCompletion,
          effectiveVelocity: proj.effectiveVelocity,
          currentStrategicRiskIndex: strategicResult.strategicRiskIndex,
          currentHealthScore,
          currentDelayProbabilityHigh: proj.delayProbability === "high",
          referenceDate: new Date(),
        })
      : null;

  const evidencePack =
    analysesByTime.length > 0
      ? buildEvidencePack({
          projectId: id,
          projectName: project.name,
          analysesWithId: analysesByTime.map((a) => ({
            id: a.id,
            created_at: a.created_at,
            completion_percent: a.completion_percent,
            risk_level: a.risk_level,
          })),
          riskDrivers: strategicResult.activeDrivers,
          strategicRiskIndex: strategicResult.strategicRiskIndex,
          effectiveVelocity: proj.effectiveVelocity,
          daysRemaining: proj.daysRemaining,
          forecastDate: proj.forecastDate,
          velocityTrend: proj.velocityTrend,
          riskTrajectory: proj.riskTrajectory,
          delayProbability: proj.delayProbability,
          persistentHighRisk: timeWeighted?.persistentHighRisk ?? false,
          persistentSlowdown: timeWeighted?.persistentSlowdown ?? false,
          riskDurationDays: timeWeighted?.riskDurationDays ?? 0,
          slowdownDurationIntervals:
            timeWeighted?.slowdownDurationIntervals ?? 0,
          escalationFlag: timeWeighted?.escalationFlag ?? false,
          regressionAnomaly,
          jumpAnomaly,
          logicalInconsistency,
          confidenceScore,
        })
      : null;

  const hasData = analysisHistory.length > 0 || latestAnalysis != null;
  const healthClassification = (() => {
    if (currentHealthScore >= 80) return "Healthy";
    if (currentHealthScore >= 60) return "Moderate";
    if (currentHealthScore >= 40) return "Unstable";
    return "Critical";
  })() as "Healthy" | "Moderate" | "Unstable" | "Critical";

  const lastDeltaSummary =
    proj.hasVelocity && proj.lastVelocity != null
      ? `Last velocity: ${proj.lastVelocity >= 0 ? "+" : ""}${proj.lastVelocity.toFixed(1)}%/day. ${proj.forecastDate ? `Forecast: ${proj.forecastDate}` : ""}`
      : null;

  const decisionContext = buildDecisionContextFromProject(
    latestAnalysis ?? null,
    {
      healthScore: currentHealthScore,
      delayProbability: proj.delayProbability,
      velocityTrend: proj.velocityTrend,
      forecastDate: proj.forecastDate ?? null,
    }
  );

  return (
    <>
      <div className="mb-aistroyka-6 flex flex-col gap-aistroyka-2 sm:flex-row sm:items-center sm:gap-aistroyka-4">
        <Link
          href="/projects"
          className="text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent w-fit min-h-aistroyka-touch inline-flex items-center focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-md"
        >
          ← {tProjects("backToProjects")}
        </Link>
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary break-words sm:text-aistroyka-title">
          {project.name}
        </h1>
      </div>

      {/* AI Copilot */}
      <section className="mb-aistroyka-8">
        <SectionHeader
          title="AI Copilot"
          subtitle={t("executiveOverviewSubtitle")}
        />
        <AiActionPanel
          decisionContext={decisionContext}
          projectId={id}
          tenantId={project.tenant_id}
        />
      </section>

      {/* A) Executive Overview */}
      <section className="mb-aistroyka-8">
        <SectionHeader
          title={t("executiveOverview")}
          subtitle={t("executiveOverviewSubtitle")}
        />
        <ExecutiveOverviewBlock
          completionPercent={proj.currentCompletion}
          healthScore={Math.round(currentHealthScore)}
          healthClassification={healthClassification}
          strategicRiskIndex={strategicResult.strategicRiskIndex}
          strategicClassification={strategicResult.classification}
          delayProbability={proj.delayProbability}
          executiveSummary={healthResult.executiveSummary}
          hasData={hasData}
        />
      </section>

      {/* Upload */}
      <section className="mb-aistroyka-8">
        <SectionHeader title={t("uploadImage")} subtitle={t("uploadImageSubtitle")} />
        <Card>
          <UploadMediaForm projectId={id} />
        </Card>
      </section>

      {/* B) Operations */}
      <section className="mb-aistroyka-8">
        <SectionHeader
          title={t("operations")}
          subtitle={t("operationsSubtitle")}
        />
        <div className="space-y-aistroyka-6">
          <NextActions
            history={analysisHistory}
            latestAnalysis={latestAnalysis}
            previousSnapshot={previousSnapshotForStrategic}
          />
          <TrendSummaryBlock
            hasVelocity={proj.hasVelocity}
            velocityTrend={proj.velocityTrend}
            riskTrajectory={proj.riskTrajectory}
            delayProbability={proj.delayProbability}
            lastDeltaSummary={lastDeltaSummary}
          />
          <LatestAnalysisBlock
            stage={latestAnalysis?.stage ?? null}
            completionPercent={latestAnalysis?.completion_percent ?? 0}
            riskLevel={latestAnalysis?.risk_level ?? "low"}
            detectedIssues={latestAnalysis?.detected_issues ?? []}
            recommendations={latestAnalysis?.recommendations ?? []}
            hasData={latestAnalysis != null}
          />
        </div>
      </section>

      {/* Media & polling */}
      <section className="mb-aistroyka-8">
        <SectionHeader title={t("mediaAndAnalysis")} subtitle={t("mediaAndAnalysisSubtitle")} />
        <ProjectPollingSection
          projectId={id}
          hasActiveJobs={hasActiveJobs}
          hasTimedOutJobs={hasTimedOutJobs}
          mediaWithJobs={mediaWithJobs}
          previousByMediaId={previousByMediaId}
        />
      </section>

      {/* C) Advanced (collapsible, default closed) */}
      <section>
        <SectionHeader
          title={t("advanced")}
          subtitle={t("advancedSubtitle")}
        />
        <div className="space-y-aistroyka-4">
          <Collapsible summary={t("evidenceOverview")} defaultOpen={false}>
            <EvidenceOverview pack={evidencePack} />
          </Collapsible>
          <Collapsible summary={t("decisionSimulation")} defaultOpen={false}>
            <DecisionSimulation result={simulationResult} />
          </Collapsible>
          <Collapsible summary={t("aiSystemHealth")} defaultOpen={false}>
            <SystemStabilityOverview history={analysisHistory} />
          </Collapsible>
          <Collapsible summary={t("riskPersistence")} defaultOpen={false}>
            <RiskPersistenceAnalysis
              history={analysisHistory}
              latestAnalysis={latestAnalysis}
              previousSnapshot={previousSnapshotForStrategic}
            />
          </Collapsible>
        </div>
      </section>
    </>
  );
}
