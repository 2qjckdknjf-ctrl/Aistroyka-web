import { Link } from "@/i18n/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { listProjectsForUser } from "@/lib/supabase/rpc";
import {
  getProjectMetrics,
  computePortfolio,
  type ProjectMetrics,
  type AnalysisRow,
} from "@/lib/intelligence/portfolio";
import { PortfolioOverview } from "./PortfolioOverview";
import { Card } from "@/components/ui";

export default async function PortfolioPage() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) return null;

  const { data: projectsData } = await listProjectsForUser(supabase);
  const projects = projectsData ?? [];
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return (
      <>
        <Card className="border-l-4 border-l-aistroyka-accent">
          <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">Portfolio</h1>
          <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
            No projects. Create projects and run analyses to see portfolio intelligence.
          </p>
        </Card>
      </>
    );
  }

  const { data: mediaRows } = await supabase
    .from("media")
    .select("id, project_id")
    .in("project_id", projectIds);
  const mediaList = mediaRows ?? [];
  const mediaIds = mediaList.map((m) => m.id);
  const mediaToProject = new Map(mediaList.map((m) => [m.id, m.project_id]));

  const { data: jobsRows } =
    mediaIds.length > 0
      ? await supabase
          .from("analysis_jobs")
          .select("id, media_id")
          .in("media_id", mediaIds)
      : { data: [] as { id: string; media_id: string }[] };
  const jobs = jobsRows ?? [];
  const jobIds = jobs.map((j) => j.id);
  const jobToMedia = new Map(jobs.map((j) => [j.id, j.media_id]));

  const { data: analysisRows } =
    jobIds.length > 0
      ? await supabase
          .from("ai_analysis")
          .select(
            "job_id, stage, completion_percent, risk_level, detected_issues, recommendations, created_at"
          )
          .in("job_id", jobIds)
      : { data: [] };

  const analyses = (analysisRows ?? []) as Array<{
    job_id: string;
    stage: string | null;
    completion_percent: number;
    risk_level: string;
    detected_issues: string[] | null;
    recommendations: string[] | null;
    created_at: string;
  }>;

  const analysesByProject = new Map<string, AnalysisRow[]>();
  for (const p of projectIds) {
    analysesByProject.set(p, []);
  }
  for (const a of analyses) {
    const mediaId = jobToMedia.get(a.job_id);
    const projectId = mediaId ? mediaToProject.get(mediaId) : undefined;
    if (projectId) {
      const list = analysesByProject.get(projectId) ?? [];
      list.push({
        stage: a.stage,
        completion_percent: a.completion_percent,
        risk_level: a.risk_level,
        detected_issues: a.detected_issues,
        recommendations: a.recommendations,
        created_at: a.created_at,
      });
      analysesByProject.set(projectId, list);
    }
  }

  const projectMetricsList: ProjectMetrics[] = [];
  for (const p of projects) {
    const projectAnalyses = analysesByProject.get(p.id) ?? [];
    const metrics = getProjectMetrics(p.id, p.name, projectAnalyses);
    projectMetricsList.push(metrics);
  }

  const portfolio = computePortfolio(projectMetricsList);

  return (
    <>
      <Link href="/projects" className="mb-aistroyka-6 inline-block text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-md">
        ← Projects
      </Link>
      <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">Portfolio</h1>
      </Card>
      <PortfolioOverview portfolio={portfolio} />
    </>
  );
}
