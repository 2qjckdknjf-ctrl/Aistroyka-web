"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  SectionHeader,
  Tabs,
  Tab,
  TabPanel,
  Skeleton,
  EmptyState,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TablePagination,
  Button,
} from "@/components/ui";
import { ProjectIntelligenceClient } from "./ProjectIntelligenceClient";
import { ProjectSchedulePanel } from "./ProjectSchedulePanel";
import { ProjectDocumentsPanel } from "./ProjectDocumentsPanel";
import { ProjectCostsPanel } from "./ProjectCostsPanel";
import { ProjectEstimatePanel } from "./ProjectEstimatePanel";
import { ProjectDecisionsPanel } from "./ProjectDecisionsPanel";
import { TelegramConnectCard } from "@/components/integrations/TelegramConnectCard";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { downloadProjectReportsExport } from "@/components/projects/reports-export-ui";
import {
  DEFAULT_PROJECT_DETAIL_TAB,
  PROJECT_COMMAND_TAB_ORDER,
  resolveProjectDetailTab,
  type ProjectCommandTab,
} from "./project-detail-tabs";

const TAB_LABEL_KEYS: Record<ProjectCommandTab, string> = {
  overview: "overview",
  reports: "reports",
  documents: "documents",
  schedule: "schedule",
  decisions: "decisions",
  workers: "workers",
  contractors: "contractors",
  costs: "costs",
  estimate: "estimate",
  intelligence: "intelligence",
  ai: "ai",
  uploads: "uploads",
};

const OVERVIEW_QUICK_TABS: ProjectCommandTab[] = [
  "reports",
  "schedule",
  "decisions",
  "workers",
  "documents",
  "intelligence",
];

const PAGE_SIZE = 10;

interface Project {
  id: string;
  name: string;
  tenant_id: string;
  created_at?: string;
}

interface Summary {
  activeWorkers: number;
  openReports: number;
  aiAnalyses: number;
}

async function fetchProject(projectId: string): Promise<Project> {
  const res = await fetch(`/api/v1/projects/${projectId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Not found");
  const json = await res.json();
  return json.data;
}

async function fetchSummary(projectId: string): Promise<Summary> {
  const res = await fetch(`/api/v1/projects/${projectId}/summary`, { credentials: "include" });
  if (!res.ok) return { activeWorkers: 0, openReports: 0, aiAnalyses: 0 };
  const json = await res.json();
  return json.data ?? { activeWorkers: 0, openReports: 0, aiAnalyses: 0 };
}

async function fetchProjectWorkers(projectId: string, page: number): Promise<{ data: { user_id: string; role: string; status: string; created_at: string }[]; total: number }> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/workers?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
    { credentials: "include" }
  );
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

async function fetchProjectContractors(projectId: string, page: number): Promise<{ data: { user_id: string; role: string; status: string; created_at: string }[]; total: number }> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/workers?role=contractor&limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
    { credentials: "include" }
  );
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

async function fetchProjectReports(projectId: string, page: number): Promise<{ data: { id: string; user_id: string; status: string; created_at: string; submitted_at: string | null }[]; total: number }> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/reports?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
    { credentials: "include" }
  );
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

async function fetchProjectUploads(projectId: string, page: number): Promise<{ data: { id: string; user_id: string; status: string; created_at: string }[]; total: number }> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/uploads?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
    { credentials: "include" }
  );
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

async function fetchProjectAi(projectId: string, page: number): Promise<{ data: { id: string; media_id: string; status: string; created_at: string }[]; total: number }> {
  const res = await fetch(
    `/api/v1/projects/${projectId}/ai?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
    { credentials: "include" }
  );
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

export function DashboardProjectDetailClient({
  projectId,
  canExportReports = false,
}: {
  projectId: string;
  canExportReports?: boolean;
}) {
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(() => resolveProjectDetailTab(tabParam));

  const selectTab = (tab: ProjectCommandTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (tab === DEFAULT_PROJECT_DETAIL_TAB) {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  useEffect(() => {
    setActiveTab(resolveProjectDetailTab(tabParam));
  }, [tabParam]);
  const [workersPage, setWorkersPage] = useState(1);
  const [contractorsPage, setContractorsPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const [uploadsPage, setUploadsPage] = useState(1);
  const [aiPage, setAiPage] = useState(1);

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });
  const summaryQuery = useQuery({
    queryKey: ["project-summary", projectId],
    queryFn: () => fetchSummary(projectId),
    enabled: !!projectId,
  });
  const workersQuery = useQuery({
    queryKey: ["project-workers", projectId, workersPage],
    queryFn: () => fetchProjectWorkers(projectId, workersPage),
    enabled: !!projectId && activeTab === "workers",
  });
  const contractorsQuery = useQuery({
    queryKey: ["project-contractors", projectId, contractorsPage],
    queryFn: () => fetchProjectContractors(projectId, contractorsPage),
    enabled: !!projectId && activeTab === "contractors",
  });
  const reportsQuery = useQuery({
    queryKey: ["project-reports", projectId, reportsPage],
    queryFn: () => fetchProjectReports(projectId, reportsPage),
    enabled: !!projectId && activeTab === "reports",
  });
  const uploadsQuery = useQuery({
    queryKey: ["project-uploads", projectId, uploadsPage],
    queryFn: () => fetchProjectUploads(projectId, uploadsPage),
    enabled: !!projectId && activeTab === "uploads",
  });
  const aiQuery = useQuery({
    queryKey: ["project-ai", projectId, aiPage],
    queryFn: () => fetchProjectAi(projectId, aiPage),
    enabled: !!projectId && activeTab === "ai",
  });

  const project = projectQuery.data;
  const summary = summaryQuery.data ?? { activeWorkers: 0, openReports: 0, aiAnalyses: 0 };
  const loading = projectQuery.isPending && !project;
  const error = projectQuery.isError || projectQuery.error;

  if (loading && !project) {
    return (
      <DashboardGlassCard>
        <Skeleton lines={4} />
      </DashboardGlassCard>
    );
  }

  if (error || !project) {
    return (
      <DashboardGlassCard>
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title={tDetail("projectNotFound")}
          subtitle={projectQuery.error instanceof Error ? projectQuery.error.message : tDetail("youMayNotHaveAccess")}
          action={
            <Link href="/dashboard/projects" className="text-aistroyka-accent hover:underline">
              {tDetail("backToProjects")}
            </Link>
          }
        />
      </DashboardGlassCard>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/dashboard/projects"
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
        >
          {tDetail("projects")}
        </Link>
      </div>
      <SectionHeader title={project.name} subtitle={tPage("projectOverviewSubtitle")} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6" aria-label={tDetail("projectSummary")}>
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("activeWorkers")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.activeWorkers}</p>
        </DashboardGlassCard>
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("openReports")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.openReports}</p>
        </DashboardGlassCard>
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-success">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("aiAnalyses")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.aiAnalyses}</p>
        </DashboardGlassCard>
        <DashboardGlassCard className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">{tDetail("pendingUploads")}</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">—</p>
        </DashboardGlassCard>
      </section>

      <TelegramConnectCard className="mb-6" />

      <DashboardGlassCard contentClassName="p-0">
        <Tabs aria-label={tDetail("projectSections")}>
          {PROJECT_COMMAND_TAB_ORDER.map((tab) => (
            <Tab
              key={tab}
              id={`tab-${tab}`}
              selected={activeTab === tab}
              onSelect={() => selectTab(tab)}
              aria-controls={`panel-${tab}`}
            >
              {tDetail(TAB_LABEL_KEYS[tab])}
            </Tab>
          ))}
        </Tabs>

        <TabPanel id="panel-overview" selected={activeTab === "overview"} aria-labelledby="tab-overview">
          <ProjectOverviewPanel projectId={projectId} onSelectTab={selectTab} />
        </TabPanel>
        <TabPanel id="panel-workers" selected={activeTab === "workers"} aria-labelledby="tab-workers">
          <ProjectWorkersPanel
            projectId={projectId}
            query={workersQuery}
            page={workersPage}
            onPageChange={setWorkersPage}
          />
        </TabPanel>
        <TabPanel id="panel-contractors" selected={activeTab === "contractors"} aria-labelledby="tab-contractors">
          <ProjectContractorsPanel
            projectId={projectId}
            query={contractorsQuery}
            page={contractorsPage}
            onPageChange={setContractorsPage}
          />
        </TabPanel>
        <TabPanel id="panel-reports" selected={activeTab === "reports"} aria-labelledby="tab-reports">
          <ProjectReportsPanel
            projectId={projectId}
            query={reportsQuery}
            page={reportsPage}
            onPageChange={setReportsPage}
            canExportReports={canExportReports}
          />
        </TabPanel>
        <TabPanel id="panel-uploads" selected={activeTab === "uploads"} aria-labelledby="tab-uploads">
          <ProjectUploadsPanel
            query={uploadsQuery}
            page={uploadsPage}
            onPageChange={setUploadsPage}
          />
        </TabPanel>
        <TabPanel id="panel-ai" selected={activeTab === "ai"} aria-labelledby="tab-ai">
          <ProjectAiPanel
            query={aiQuery}
            page={aiPage}
            onPageChange={setAiPage}
          />
        </TabPanel>
        <TabPanel id="panel-intelligence" selected={activeTab === "intelligence"} aria-labelledby="tab-intelligence">
          <ProjectIntelligenceClient projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-schedule" selected={activeTab === "schedule"} aria-labelledby="tab-schedule">
          <ProjectSchedulePanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-documents" selected={activeTab === "documents"} aria-labelledby="tab-documents">
          <ProjectDocumentsPanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-decisions" selected={activeTab === "decisions"} aria-labelledby="tab-decisions">
          <ProjectDecisionsPanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-costs" selected={activeTab === "costs"} aria-labelledby="tab-costs">
          <ProjectCostsPanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-estimate" selected={activeTab === "estimate"} aria-labelledby="tab-estimate">
          <ProjectEstimatePanel projectId={projectId} />
        </TabPanel>
      </DashboardGlassCard>
    </>
  );
}

function ProjectOverviewPanel({
  projectId,
  onSelectTab,
}: {
  projectId: string;
  onSelectTab: (tab: ProjectCommandTab) => void;
}) {
  const tDetail = useTranslations("dashboardDetail");

  return (
    <div className="space-y-4 p-4">
      <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{tDetail("projectSummary")}</p>
      <div className="flex flex-wrap gap-2">
        {OVERVIEW_QUICK_TABS.map((tab) => (
          <Button key={tab} variant="secondary" size="sm" onClick={() => onSelectTab(tab)}>
            {tDetail(TAB_LABEL_KEYS[tab])}
          </Button>
        ))}
      </div>
      <Link
        href={`/dashboard/tasks?project_id=${encodeURIComponent(projectId)}`}
        className="inline-flex text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
      >
        {tDetail("viewTasks")}
      </Link>
    </div>
  );
}

function ProjectWorkersPanel({
  projectId,
  query,
  page,
  onPageChange,
}: {
  projectId: string;
  query: { data?: { data: { user_id: string; role: string; status: string; created_at: string }[]; total: number }; isPending: boolean; isError: boolean };
  page: number;
  onPageChange: (p: number) => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadWorkers")}</p>;
  const { data: rows = [], total } = query.data ?? { data: [], total: 0 };
  if (rows.length === 0 && total === 0) {
    return <EmptyState icon={<span className="text-2xl">👷</span>} title={tDetail("workers")} subtitle={tDetail("noProjectMembersYet")} />;
  }
  return (
    <div className="p-4">
      <Table aria-label={tDetail("projectWorkers")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("userId")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("role")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.user_id}>
              <TableCell>
                <Link href={`/dashboard/workers/${r.user_id}`} className="text-aistroyka-accent hover:underline font-mono text-sm">
                  {r.user_id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>{r.role}</TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={total}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function ProjectContractorsPanel({
  projectId,
  query,
  page,
  onPageChange,
}: {
  projectId: string;
  query: { data?: { data: { user_id: string; role: string; status: string; created_at: string }[]; total: number }; isPending: boolean; isError: boolean };
  page: number;
  onPageChange: (p: number) => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadContractors")}</p>;
  const { data: rows = [], total } = query.data ?? { data: [], total: 0 };
  if (rows.length === 0 && total === 0) {
    return (
      <EmptyState
        icon={<span className="text-2xl">📋</span>}
        title={tDetail("contractors")}
        subtitle={tDetail("noContractorsInProject")}
      />
    );
  }
  return (
    <div className="p-4">
      <p className="text-aistroyka-caption text-aistroyka-text-secondary mb-3">
        {tDetail("contractorsHintPrefix")} <strong>{tDetail("contractor").toLowerCase()}</strong>. {tDetail("contractorsHintSuffix")}
      </p>
      <Table aria-label={tDetail("projectContractors")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("contractor")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("actions")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.user_id}>
              <TableCell>
                <Link href={`/dashboard/workers/${r.user_id}`} className="text-aistroyka-accent hover:underline font-mono text-sm">
                  {r.user_id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/tasks?worker_id=${encodeURIComponent(r.user_id)}&project_id=${encodeURIComponent(projectId)}`}
                  className="text-aistroyka-caption text-aistroyka-accent hover:underline"
                >
                  {tDetail("viewTasks")}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={total}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function ProjectReportsPanel({
  projectId,
  query,
  page,
  onPageChange,
  canExportReports,
}: {
  projectId: string;
  query: { data?: { data: { id: string; user_id: string; status: string; created_at: string; submitted_at: string | null }[]; total: number }; isPending: boolean; isError: boolean };
  page: number;
  onPageChange: (p: number) => void;
  canExportReports: boolean;
}) {
  const tDetail = useTranslations("dashboardDetail");
  if (query.isPending) {
    return (
      <div className="p-4">
        <ProjectReportsExportAction projectId={projectId} canExportReports={canExportReports} />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadReports")}</p>;
  const { data: rows = [], total } = query.data ?? { data: [], total: 0 };
  if (rows.length === 0 && total === 0) {
    return (
      <div className="p-4">
        <ProjectReportsExportAction projectId={projectId} canExportReports={canExportReports} />
        <EmptyState icon={<span className="text-2xl">📋</span>} title={tDetail("reports")} subtitle={tDetail("noReportsForProjectYet")} />
      </div>
    );
  }
  return (
    <div className="p-4">
      <ProjectReportsExportAction projectId={projectId} canExportReports={canExportReports} />
      <Table aria-label={tDetail("projectReports")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("report")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("worker")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link href={`/dashboard/daily-reports/${r.id}`} className="text-aistroyka-accent hover:underline font-mono text-sm">
                  {r.id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/workers/${r.user_id}`} className="text-aistroyka-accent hover:underline font-mono text-sm">
                  {r.user_id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination page={page} pageSize={PAGE_SIZE} totalCount={total} onPageChange={onPageChange} />
    </div>
  );
}

function ProjectReportsExportAction({
  projectId,
  canExportReports,
}: {
  projectId: string;
  canExportReports: boolean;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedHint, setStartedHint] = useState(false);

  if (!canExportReports) return null;

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setStartedHint(false);
    const result = await downloadProjectReportsExport(projectId);
    setExporting(false);
    if (!result.ok) {
      setError(result.error || tDetail("exportProjectReportsFailed"));
      return;
    }
    setStartedHint(true);
    window.setTimeout(() => setStartedHint(false), 3000);
  };

  return (
    <div className="mb-3 flex w-full flex-col items-stretch gap-2 sm:items-end">
      <Button
        variant="secondary"
        size="sm"
        loading={exporting}
        disabled={exporting}
        onClick={handleExport}
        data-testid="project-reports-export"
        aria-label={tDetail("exportProjectReportsCsv")}
        className="w-full sm:w-auto sm:self-end"
      >
        {tDetail("exportProjectReportsCsvShort")}
      </Button>
      {error ? (
        <p role="alert" className="text-right text-sm text-aistroyka-error sm:max-w-xs">
          {error}
        </p>
      ) : null}
      {startedHint ? (
        <p role="status" className="text-right text-sm text-aistroyka-text-secondary sm:max-w-xs">
          {tDetail("exportProjectReportsStarted")}
        </p>
      ) : null}
    </div>
  );
}

function ProjectUploadsPanel({
  query,
  page,
  onPageChange,
}: {
  query: { data?: { data: { id: string; user_id: string; status: string; created_at: string }[]; total: number }; isPending: boolean; isError: boolean };
  page: number;
  onPageChange: (p: number) => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadUploads")}</p>;
  const { data: rows = [], total } = query.data ?? { data: [], total: 0 };
  if (rows.length === 0 && total === 0) {
    return <EmptyState icon={<span className="text-2xl">📤</span>} title={tDetail("uploads")} subtitle={tDetail("noUploadSessionsForProjectYet")} />;
  }
  return (
    <div className="p-4">
      <Table aria-label={tDetail("projectUploads")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("session")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("user")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-sm">{r.id.slice(0, 8)}…</TableCell>
              <TableCell>
                <Link href={`/dashboard/workers/${r.user_id}`} className="text-aistroyka-accent hover:underline font-mono text-sm">
                  {r.user_id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination page={page} pageSize={PAGE_SIZE} totalCount={total} onPageChange={onPageChange} />
    </div>
  );
}

function ProjectAiPanel({
  query,
  page,
  onPageChange,
}: {
  query: { data?: { data: { id: string; media_id: string; status: string; created_at: string }[]; total: number }; isPending: boolean; isError: boolean };
  page: number;
  onPageChange: (p: number) => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadAiJobs")}</p>;
  const { data: rows = [], total } = query.data ?? { data: [], total: 0 };
  if (rows.length === 0 && total === 0) {
    return <EmptyState icon={<span className="text-2xl">🤖</span>} title={tDetail("ai")} subtitle={tDetail("noAiJobsForProjectYet")} />;
  }
  return (
    <div className="p-4">
      <Table aria-label={tDetail("projectAiJobs")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("jobId")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("media")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-sm">{r.id.slice(0, 8)}…</TableCell>
              <TableCell className="font-mono text-sm">{r.media_id.slice(0, 8)}…</TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination page={page} pageSize={PAGE_SIZE} totalCount={total} onPageChange={onPageChange} />
    </div>
  );
}
