import { notFound } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/rpc";
import { AiActionPanel } from "@/components/ai/AiActionPanel";
import { ProjectAIHeaderClient } from "./ProjectAIHeaderClient";
import { buildDecisionContextFromProject, type ProjectAnalysisSource } from "@/lib/engine/buildContext";
import { SectionHeader } from "@/components/ui";

export default async function ProjectAiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) notFound();

  const { data: project } = await getProjectById(supabase, id);
  if (!project) notFound();

  const { data: mediaRows } = await supabase
    .from("media")
    .select("id")
    .eq("project_id", id)
    .limit(50);

  const mediaIds = (mediaRows ?? []).map((m) => m.id);
  let latestAnalysis: {
    risk_level: string | null;
    completion_percent: number | null;
    detected_issues: string[] | null;
    recommendations: string[] | null;
    stage: string | null;
  } | null = null;

  if (mediaIds.length > 0) {
    const { data: jobRow } = await supabase
      .from("analysis_jobs")
      .select("id")
      .in("media_id", mediaIds)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (jobRow) {
      const { data: analysisRow } = await supabase
        .from("ai_analysis")
        .select("risk_level, completion_percent, detected_issues, recommendations, stage")
        .eq("job_id", jobRow.id)
        .maybeSingle();

      if (analysisRow) {
        latestAnalysis = {
          risk_level: analysisRow.risk_level,
          completion_percent: analysisRow.completion_percent,
          detected_issues: analysisRow.detected_issues,
          recommendations: analysisRow.recommendations,
          stage: analysisRow.stage,
        };
      }
    }
  }

  const analysisSource: ProjectAnalysisSource | null = latestAnalysis
    ? {
        ...latestAnalysis,
        risk_level:
          latestAnalysis.risk_level === "low" ||
          latestAnalysis.risk_level === "medium" ||
          latestAnalysis.risk_level === "high"
            ? latestAnalysis.risk_level
            : null,
      }
    : null;
  const decisionContext = buildDecisionContextFromProject(analysisSource, null);

  return (
    <>
      <ProjectAIHeaderClient projectId={id} projectName={project.name} />

      <section className="mb-aistroyka-8">
        <SectionHeader
          title="AI Copilot"
          subtitle="Get AI summary, explain risk, or ask a question."
        />
        <AiActionPanel
          decisionContext={decisionContext}
          projectId={id}
          tenantId={project.tenant_id}
        />
      </section>
    </>
  );
}
