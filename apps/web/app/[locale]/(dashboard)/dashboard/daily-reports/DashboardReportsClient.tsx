"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Card,
  Skeleton,
  EmptyState,
  Badge,
  TablePagination,
  Button,
} from "@/components/ui";
import { FilterBar } from "@/components/cockpit/FilterBar";
import { useFilterParams } from "@/lib/cockpit/useFilterParams";
import { parseTablePagination } from "@/lib/cockpit/useTablePagination";
import { exportTableToCsv } from "@/lib/cockpit/csvExport";

interface ReportRow {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  project_id: string | null;
  media_count?: number;
  analysis_status?: "none" | "queued" | "running" | "success" | "failed";
}

function formatAge(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  return `${diffD}d ago`;
}

const DEFAULT_REPORTS_BASE = "/dashboard/daily-reports";
const REPORT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
];

export function DashboardReportsClient({ basePath = DEFAULT_REPORTS_BASE }: { basePath?: string }) {
  const { params, setParam } = useFilterParams();
  const [data, setData] = useState<ReportRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [workers, setWorkers] = useState<{ user_id: string }[]>([]);

  const { page, pageSize } = parseTablePagination(params);

  useEffect(() => {
    fetch("/api/v1/projects", { credentials: "include" })
      .then((res) => res.ok ? res.json() : Promise.resolve({ data: [] }))
      .then((json: { data?: { id: string; name: string }[] }) => setProjects(json.data ?? []))
      .catch(() => setProjects([]));
    fetch("/api/v1/workers", { credentials: "include" })
      .then((res) => res.ok ? res.json() : Promise.resolve({ data: [] }))
      .then((json: { data?: { user_id: string }[] }) => setWorkers(json.data ?? []))
      .catch(() => setWorkers([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const limit = 200;
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    if (params.project_id) sp.set("project_id", params.project_id);
    if (params.worker_id) sp.set("worker_id", params.worker_id);
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    if (params.status) sp.set("status", params.status);
    if (params.q.trim()) sp.set("q", params.q.trim());
    fetch(`/api/v1/reports?${sp}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: ReportRow[] }) => {
        setData(json.data ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [params.project_id, params.worker_id, params.from, params.to, params.status, params.q]);

  const pageData = useMemo(() => {
    if (!data) return { rows: [], total: 0 };
    const total = data.length;
    const start = (page - 1) * pageSize;
    return { rows: data.slice(start, start + pageSize), total };
  }, [data, page, pageSize]);

  if (loading && !data) {
    return (
      <Card>
        <Skeleton lines={5} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary p-4">{error}</p>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title="No reports yet"
          subtitle="Daily reports will appear here once workers submit them."
        />
      </Card>
    );
  }

  const exportCsv = () => {
    const headers = ["Report ID", "Status", "Worker", "Project", "AI", "Media", "Age", "Created"];
    const rows = data.slice(0, 500).map((r) => [
      r.id,
      r.status,
      r.user_id,
      r.project_id ?? "",
      r.analysis_status ?? "",
      String(r.media_count ?? 0),
      formatAge(r.created_at),
      new Date(r.created_at).toISOString(),
    ]);
    exportTableToCsv(headers, rows, "reports.csv");
  };

  return (
    <>
      <div className="mb-4">
        <FilterBar
          projects={projects}
          workers={workers}
          showProject={true}
          showWorker={true}
          showDateRange={true}
          showStatus={true}
          statusOptions={REPORT_STATUS_OPTIONS}
          showSearch={true}
          searchPlaceholder="Report or worker ID…"
          showSavedViews={true}
        />
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="p-2 flex justify-end">
          <Button variant="secondary" onClick={exportCsv} className="text-sm">Export CSV</Button>
        </div>
        <Table aria-label="Reports">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Report</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Worker</TableHeaderCell>
            <TableHeaderCell>Project</TableHeaderCell>
            <TableHeaderCell>AI</TableHeaderCell>
            <TableHeaderCell>Media</TableHeaderCell>
            <TableHeaderCell>Age</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pageData.rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link href={`${basePath}/${r.id}`} className="font-mono text-aistroyka-caption text-aistroyka-accent hover:underline truncate max-w-[100px] block" title={r.id}>
                  {r.id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={r.status === "submitted" ? "success" : "neutral"}>{r.status}</Badge>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/workers/${r.user_id}`} className="font-mono text-aistroyka-caption text-aistroyka-accent hover:underline" title={r.user_id}>
                  {r.user_id.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>
                {r.project_id ? (
                  <Link href={`/dashboard/projects/${r.project_id}`} className="font-mono text-aistroyka-caption text-aistroyka-accent hover:underline" title={r.project_id}>
                    {r.project_id.slice(0, 8)}…
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {r.analysis_status && r.analysis_status !== "none" ? (
                  <Badge variant={r.analysis_status === "success" ? "success" : r.analysis_status === "failed" ? "danger" : "warning"}>{r.analysis_status}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="tabular-nums">{r.media_count ?? 0}</TableCell>
              <TableCell className="text-aistroyka-text-secondary tabular-nums">{formatAge(r.created_at)}</TableCell>
              <TableCell>
                <Link href={`${basePath}/${r.id}`} className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded">
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalCount={pageData.total}
        onPageChange={(p) => setParam("page", String(p))}
      />
    </Card>
    </>
  );
}
