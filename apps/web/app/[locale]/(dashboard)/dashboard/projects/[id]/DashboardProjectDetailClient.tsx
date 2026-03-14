"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import {
  Card,
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
} from "@/components/ui";
import { ProjectIntelligenceClient } from "./ProjectIntelligenceClient";
import { ProjectSchedulePanel } from "./ProjectSchedulePanel";

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

export function DashboardProjectDetailClient({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "intelligence" ? "intelligence" : tabParam === "schedule" ? "schedule" : "workers"
  );

  useEffect(() => {
    if (tabParam === "intelligence") setActiveTab("intelligence");
    else if (tabParam === "schedule") setActiveTab("schedule");
  }, [tabParam]);
  const [workersPage, setWorkersPage] = useState(1);
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
      <Card>
        <Skeleton lines={4} />
      </Card>
    );
  }

  if (error || !project) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title="Project not found"
          subtitle={projectQuery.error instanceof Error ? projectQuery.error.message : "You may not have access to this project."}
          action={
            <Link href="/dashboard/projects" className="text-aistroyka-accent hover:underline">
              ← Back to projects
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/dashboard/projects"
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
        >
          ← Projects
        </Link>
      </div>
      <SectionHeader title={project.name} subtitle="Project overview and tabs." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6" aria-label="Project summary">
        <Card className="border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Active workers</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.activeWorkers}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Open reports</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.openReports}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-success">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">AI analyses</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{summary.aiAnalyses}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Pending uploads</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">—</p>
        </Card>
      </section>

      <Card>
        <Tabs aria-label="Project sections">
          <Tab id="tab-workers" selected={activeTab === "workers"} onSelect={() => setActiveTab("workers")} aria-controls="panel-workers">
            Workers
          </Tab>
          <Tab id="tab-reports" selected={activeTab === "reports"} onSelect={() => setActiveTab("reports")} aria-controls="panel-reports">
            Reports
          </Tab>
          <Tab id="tab-uploads" selected={activeTab === "uploads"} onSelect={() => setActiveTab("uploads")} aria-controls="panel-uploads">
            Uploads
          </Tab>
          <Tab id="tab-ai" selected={activeTab === "ai"} onSelect={() => setActiveTab("ai")} aria-controls="panel-ai">
            AI
          </Tab>
          <Tab id="tab-intelligence" selected={activeTab === "intelligence"} onSelect={() => setActiveTab("intelligence")} aria-controls="panel-intelligence">
            Intelligence
          </Tab>
          <Tab id="tab-schedule" selected={activeTab === "schedule"} onSelect={() => setActiveTab("schedule")} aria-controls="panel-schedule">
            Schedule
          </Tab>
        </Tabs>

        <TabPanel id="panel-workers" selected={activeTab === "workers"} aria-labelledby="tab-workers">
          <ProjectWorkersPanel
            projectId={projectId}
            query={workersQuery}
            page={workersPage}
            onPageChange={setWorkersPage}
          />
        </TabPanel>
        <TabPanel id="panel-reports" selected={activeTab === "reports"} aria-labelledby="tab-reports">
          <ProjectReportsPanel
            query={reportsQuery}
            page={reportsPage}
            onPageChange={setReportsPage}
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
      </Card>
    </>
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
  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">Failed to load workers.</p>;
  const { data: rows = [], total } = query.data ?? { data: [], total: 0 };
  if (rows.length === 0 && total === 0) {
    return <EmptyState icon={<span className="text-2xl">👷</span>} title="Workers" subtitle="No project members yet." />;
  }
  return (
    <div className="p-4">
      <Table aria-label="Project workers">
        <TableHead>
          <TableRow>
            <TableHeaderCell>User ID</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
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

function ProjectReportsPanel({
  query,
  page,
  onPageChange,
}: {
  query: { data?: { data: { id: string; user_id: string; status: string; created_at: string; submitted_at: string | null }[]; total: number }; isPending: boolean; isError: boolean };
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">Failed to load reports.</p>;
  const { data: rows = [], total } = query.data ?? { data: [], total: 0 };
  if (rows.length === 0 && total === 0) {
    return <EmptyState icon={<span className="text-2xl">📋</span>} title="Reports" subtitle="No reports for this project yet." />;
  }
  return (
    <div className="p-4">
      <Table aria-label="Project reports">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Report</TableHeaderCell>
            <TableHeaderCell>Worker</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
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

function ProjectUploadsPanel({
  query,
  page,
  onPageChange,
}: {
  query: { data?: { data: { id: string; user_id: string; status: string; created_at: string }[]; total: number }; isPending: boolean; isError: boolean };
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">Failed to load uploads.</p>;
  const { data: rows = [], total } = query.data ?? { data: [], total: 0 };
  if (rows.length === 0 && total === 0) {
    return <EmptyState icon={<span className="text-2xl">📤</span>} title="Uploads" subtitle="No upload sessions linked to this project yet." />;
  }
  return (
    <div className="p-4">
      <Table aria-label="Project uploads">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Session</TableHeaderCell>
            <TableHeaderCell>User</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
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
  if (query.isPending) return <Skeleton className="h-48" />;
  if (query.isError) return <p className="text-aistroyka-text-secondary p-4">Failed to load AI jobs.</p>;
  const { data: rows = [], total } = query.data ?? { data: [], total: 0 };
  if (rows.length === 0 && total === 0) {
    return <EmptyState icon={<span className="text-2xl">🤖</span>} title="AI" subtitle="No AI analysis jobs for this project yet." />;
  }
  return (
    <div className="p-4">
      <Table aria-label="Project AI jobs">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Job ID</TableHeaderCell>
            <TableHeaderCell>Media</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
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
