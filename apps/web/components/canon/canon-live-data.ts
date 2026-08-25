import type { PortfolioControlResult, PortfolioProjectControlRow } from "@/lib/domain/portfolio/portfolio-control.types";
import type { ProjectSummary } from "@/lib/domain/projects/project-summary.repository";

export type PortfolioControlData = PortfolioControlResult;

export async function fetchPortfolioControl(): Promise<PortfolioControlData | null> {
  const res = await fetch("/api/v1/portfolio/control", { credentials: "include" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function fetchProjectSummary(projectId: string): Promise<ProjectSummary | null> {
  const res = await fetch(`/api/v1/projects/${projectId}/summary`, { credentials: "include" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function fetchProjectSummaries(projectIds: string[]): Promise<Record<string, ProjectSummary>> {
  const entries = await Promise.all(
    projectIds.map(async (id) => {
      const summary = await fetchProjectSummary(id);
      return [id, summary] as const;
    }),
  );
  const out: Record<string, ProjectSummary> = {};
  for (const [id, summary] of entries) {
    if (summary) out[id] = summary;
  }
  return out;
}

export type ProjectMilestoneRow = {
  id: string;
  title: string;
  target_date: string;
  status: string;
};

export async function fetchProjectMilestones(projectId: string): Promise<ProjectMilestoneRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/milestones`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export type ProjectMediaRow = {
  id: string;
  file_url: string;
  type: string;
  uploaded_at?: string;
};

export async function fetchProjectMedia(projectId: string, limit = 6): Promise<ProjectMediaRow[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/media?limit=${limit}`, { credentials: "include" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export type ProjectIntelligenceSlice = {
  topRisks: string[];
  healthLevel: string | null;
};

export async function fetchProjectIntelligenceSlice(projectId: string): Promise<ProjectIntelligenceSlice> {
  const res = await fetch(`/api/v1/projects/${projectId}/intelligence`, { credentials: "include" });
  if (!res.ok) return { topRisks: [], healthLevel: null };
  const json = await res.json();
  const risks = (json.risk?.top_risks ?? json.data?.risk?.top_risks ?? []) as Array<{ title?: string; summary?: string }>;
  const health = json.health?.level ?? json.data?.health?.level ?? null;
  return {
    topRisks: risks
      .map((r) => r.title ?? r.summary ?? "")
      .filter(Boolean)
      .slice(0, 3),
    healthLevel: typeof health === "string" ? health : null,
  };
}

export function portfolioStateToRisk(state: PortfolioProjectControlRow["portfolioState"]): "high" | "medium" | "low" {
  if (state === "critical") return "high";
  if (state === "attention") return "medium";
  return "low";
}

export function taskProgressPct(summary: ProjectSummary | null | undefined): number {
  if (!summary || summary.tasksTotal <= 0) return 0;
  return Math.round((summary.tasksDone / summary.tasksTotal) * 100);
}

export function aggregatePortfolioBudget(summaries: ProjectSummary[]): {
  planned: number;
  actual: number;
  currency: string;
  utilizationPct: number;
} {
  let planned = 0;
  let actual = 0;
  let currency = "EUR";
  for (const s of summaries) {
    planned += s.budgetPlannedTotal;
    actual += s.budgetActualTotal;
    if (s.budgetCurrency) currency = s.budgetCurrency;
  }
  const utilizationPct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
  return { planned, actual, currency, utilizationPct };
}

export function averageTaskProgress(summaries: ProjectSummary[]): number {
  if (summaries.length === 0) return 0;
  const total = summaries.reduce((acc, s) => acc + taskProgressPct(s), 0);
  return Math.round(total / summaries.length);
}

export interface OpsOverviewCanon {
  kpis: {
    activeProjects: number;
    tasks_completed_today?: number;
    tasks_assigned_today?: number;
    tasks_open_today?: number;
    tasks_overdue?: number;
    reportsToday: number;
  };
  queues: {
    reportsPendingReview: { id: string; created_at: string }[];
    tasksOverdue?: { id: string; title: string; due_date: string }[];
    tasksOpenToday?: { id: string; title: string; due_date: string }[];
    stuckUploads: { id: string; created_at: string }[];
    aiFailed: { id: string; created_at: string }[];
  };
}

export async function fetchOpsOverviewCanon(limit = 8): Promise<OpsOverviewCanon | null> {
  const res = await fetch(`/api/v1/ops/overview?limit=${limit}`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}
