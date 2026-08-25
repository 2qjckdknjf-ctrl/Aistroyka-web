"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  TabPanel,
  Skeleton,
  EmptyState,
  SectionHeader,
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
import { ProjectScheduleCanonPanel } from "@/components/canon/ProjectScheduleCanonPanel";
import { ProjectDocumentsCanonPanel } from "@/components/canon/ProjectDocumentsCanonPanel";
import { ProjectCostsPanel } from "./ProjectCostsPanel";
import { ProjectEstimatePanel } from "./ProjectEstimatePanel";
import { ProjectDecisionsPanel } from "./ProjectDecisionsPanel";
import { DefectsProjectTab } from "./DefectsProjectTab";
import { ChangeOrdersManagerPanel } from "./ChangeOrdersManagerPanel";
import { HandoverManagerPanel } from "./HandoverManagerPanel";
import { ProjectReviewPackPanel } from "./ProjectReviewPackPanel";
import { TelegramConnectCard } from "@/components/integrations/TelegramConnectCard";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { AiActionPanel } from "@/components/ai/AiActionPanel";
import {
  CanonPageHeader,
  CanonProjectTabBar,
  ProjectCommandCenterOverview,
} from "@/components/canon";
import { ProjectVideoDailyAnalysisPanel } from "../../../projects/ProjectVideoDailyAnalysisPanel";
import { downloadProjectReportsExport } from "@/components/projects/reports-export-ui";
import {
  DEFAULT_PROJECT_DETAIL_TAB,
  resolveProjectDetailTab,
  type ProjectCommandTab,
} from "./project-detail-tabs";

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
  const t = useTranslations("canon");
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
    <div className="space-y-6">
      <nav className="text-sm text-[var(--canon-text-muted)]">
        <Link href="/dashboard/projects" className="hover:text-[var(--canon-cyan)]">
          {tDetail("projects")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--canon-text-secondary)]">{project.name}</span>
      </nav>

      <CanonPageHeader
        title={t("projectCommandCenter")}
        subtitle={t("screen03Label")}
        actions={
          <>
            <span className="canon-risk-badge canon-risk-badge--low">{t("statusInProgress")}</span>
            <button type="button" className="canon-ghost-btn" aria-label={t("moreActions")}>⋯</button>
            <Link
              href={`/dashboard/tasks?project_id=${encodeURIComponent(projectId)}`}
              className="canon-gold-btn"
            >
              {t("createTask")}
            </Link>
          </>
        }
      />

      <div className="canon-glass overflow-hidden">
        <CanonProjectTabBar
          projectId={projectId}
          activeTab={activeTab}
          onSelectTab={selectTab}
        />

        <TabPanel id="panel-overview" selected={activeTab === "overview"} aria-labelledby="tab-overview">
          <ProjectCommandCenterOverview
            projectId={projectId}
            projectName={project.name}
            summary={summary}
          />
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
            projectId={projectId}
            tenantId={project.tenant_id}
            query={aiQuery}
            page={aiPage}
            onPageChange={setAiPage}
          />
        </TabPanel>
        <TabPanel id="panel-intelligence" selected={activeTab === "intelligence"} aria-labelledby="tab-intelligence">
          <ProjectIntelligenceClient projectId={projectId} skin="canon" />
        </TabPanel>
        <TabPanel id="panel-schedule" selected={activeTab === "schedule"} aria-labelledby="tab-schedule">
          <ProjectScheduleCanonPanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-documents" selected={activeTab === "documents"} aria-labelledby="tab-documents">
          <ProjectDocumentsCanonPanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-decisions" selected={activeTab === "decisions"} aria-labelledby="tab-decisions">
          <ProjectDecisionsPanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-defects" selected={activeTab === "defects"} aria-labelledby="tab-defects">
          <DefectsProjectTab projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-change-orders" selected={activeTab === "change-orders"} aria-labelledby="tab-change-orders">
          <ChangeOrdersManagerPanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-handover" selected={activeTab === "handover"} aria-labelledby="tab-handover">
          <HandoverManagerPanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-review-pack" selected={activeTab === "review-pack"} aria-labelledby="tab-review-pack">
          <ProjectReviewPackPanel projectId={projectId} />
        </TabPanel>
        <TabPanel id="panel-costs" selected={activeTab === "costs"} aria-labelledby="tab-costs">
          <ProjectCostsPanel projectId={projectId} skin="canon" />
        </TabPanel>
        <TabPanel id="panel-estimate" selected={activeTab === "estimate"} aria-labelledby="tab-estimate">
          <ProjectEstimatePanel projectId={projectId} skin="canon" />
        </TabPanel>
      </div>

      {activeTab === "overview" ? (
        <TelegramConnectCard className="mt-4 opacity-80" />
      ) : null}
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
  projectId,
  tenantId,
  query,
  page,
  onPageChange,
}: {
  projectId: string;
  tenantId: string;
  query: { data?: { data: { id: string; media_id: string; status: string; created_at: string }[]; total: number }; isPending: boolean; isError: boolean };
  page: number;
  onPageChange: (p: number) => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const tPage = useTranslations("dashboardPageMeta");
  const tProject = useTranslations("projectDetail");

  return (
    <div className="space-y-aistroyka-6 p-4">
      <section>
        <SectionHeader title={tPage("aiCopilotTitle")} subtitle={tPage("aiCopilotSubtitle")} />
        <AiActionPanel projectId={projectId} tenantId={tenantId} />
      </section>

      <section>
        <SectionHeader title={tProject("videoDailyTitle")} subtitle={tProject("videoDailySubtitle")} />
        <DashboardGlassCard>
          <ProjectVideoDailyAnalysisPanel projectId={projectId} />
        </DashboardGlassCard>
      </section>

      <section>
        <SectionHeader title={tDetail("ai")} subtitle={tDetail("projectAiJobs")} />
        {query.isPending ? (
          <Skeleton className="h-48" />
        ) : query.isError ? (
          <p className="text-aistroyka-text-secondary p-4">{tDetail("failedLoadAiJobs")}</p>
        ) : (query.data?.total ?? 0) === 0 && (query.data?.data?.length ?? 0) === 0 ? (
          <EmptyState icon={<span className="text-2xl">🤖</span>} title={tDetail("ai")} subtitle={tDetail("noAiJobsForProjectYet")} />
        ) : (
          <div>
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
                {(query.data?.data ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.id.slice(0, 8)}…</TableCell>
                    <TableCell className="font-mono text-sm">{r.media_id.slice(0, 8)}…</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={page} pageSize={PAGE_SIZE} totalCount={query.data?.total ?? 0} onPageChange={onPageChange} />
          </div>
        )}
      </section>
    </div>
  );
}
