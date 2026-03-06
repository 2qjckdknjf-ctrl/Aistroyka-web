"use client";

import { useState, useEffect } from "react";
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

const STUCK_HOURS = 4;
const UPLOAD_STATUS_OPTIONS = [
  { value: "created", label: "Created" },
  { value: "uploaded", label: "Uploaded" },
  { value: "finalized", label: "Finalized" },
];

interface UploadRow {
  id: string;
  tenant_id: string;
  user_id: string;
  purpose: string;
  status: string;
  created_at: string;
  expires_at: string;
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

function isStuck(row: UploadRow): boolean {
  if (row.status !== "created" && row.status !== "uploaded") return false;
  const created = new Date(row.created_at).getTime();
  return Date.now() - created > STUCK_HOURS * 60 * 60 * 1000;
}

function isExpired(row: UploadRow): boolean {
  return new Date(row.expires_at) < new Date() && (row.status === "created" || row.status === "uploaded");
}

export function DashboardUploadsClient() {
  const { params, setParam } = useFilterParams();
  const [data, setData] = useState<UploadRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [workers, setWorkers] = useState<{ user_id: string }[]>([]);

  const { page, pageSize, offset, limit } = parseTablePagination(params);
  const stuckParam = params.status === "stuck";

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
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    sp.set("offset", String(offset));
    if (params.status && params.status !== "stuck") sp.set("status", params.status);
    if (stuckParam) sp.set("stuck", "1");
    if (params.worker_id) sp.set("user_id", params.worker_id);
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    fetch(`/api/v1/media/upload-sessions?${sp}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: UploadRow[]; total?: number }) => {
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, params.status, params.worker_id, params.from, params.to, stuckParam]);

  const filterBar = (
    <div className="mb-4">
      <FilterBar
        projects={projects}
        workers={workers}
        showProject={false}
        showWorker={true}
        showDateRange={true}
        showStatus={true}
        statusOptions={[{ value: "stuck", label: "Stuck >4h (created/uploaded, ≥4h old)" }, ...UPLOAD_STATUS_OPTIONS]}
        showSearch={false}
        showSavedViews={false}
      />
    </div>
  );

  if (loading && !data) {
    return (
      <>
        {filterBar}
        <Card>
          <Skeleton lines={5} />
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        {filterBar}
        <Card>
          <p className="text-aistroyka-text-secondary p-4">{error}</p>
        </Card>
      </>
    );
  }

  const exportCsv = () => {
    const headers = ["Session ID", "Status", "Owner", "Purpose", "Created", "Expires"];
    const rows = (data ?? []).slice(0, 500).map((r) => [
      r.id,
      r.status,
      r.user_id,
      r.purpose,
      new Date(r.created_at).toISOString(),
      r.expires_at,
    ]);
    exportTableToCsv(headers, rows, "upload-sessions.csv");
  };

  if (!data?.length && !loading) {
    return (
      <>
        {filterBar}
        <Card>
          <EmptyState
            icon={<span className="text-2xl">📤</span>}
            title="No upload sessions"
            subtitle="Upload sessions will appear here when workers create them."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      {filterBar}
      <Card className="p-0 overflow-hidden">
        <div className="p-2 flex justify-end">
          <Button variant="secondary" onClick={exportCsv} className="text-sm">Export CSV</Button>
        </div>
        <Table aria-label="Upload sessions">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Session</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Owner</TableHeaderCell>
            <TableHeaderCell>Purpose</TableHeaderCell>
            <TableHeaderCell>Age</TableHeaderCell>
            <TableHeaderCell>Finalized / Expires</TableHeaderCell>
            <TableHeaderCell>Alert</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data ?? []).map((r) => (
            <TableRow key={r.id} className={isStuck(r) || isExpired(r) ? "bg-[var(--aistroyka-warning)]/5" : undefined}>
              <TableCell className="font-mono text-sm">{r.id.slice(0, 8)}…</TableCell>
              <TableCell>
                <Badge variant={r.status === "finalized" ? "success" : r.status === "expired" ? "danger" : "neutral"}>{r.status}</Badge>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/workers/${r.user_id}`} className="font-mono text-aistroyka-caption text-aistroyka-accent hover:underline">{r.user_id.slice(0, 8)}…</Link>
              </TableCell>
              <TableCell>{r.purpose}</TableCell>
              <TableCell className="tabular-nums text-aistroyka-text-secondary">{formatAge(r.created_at)}</TableCell>
              <TableCell className="tabular-nums text-aistroyka-text-secondary">
                {r.status === "finalized" ? formatAge(r.created_at) : new Date(r.expires_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </TableCell>
              <TableCell>
                {isExpired(r) && <Badge variant="danger">Expired</Badge>}
                {!isExpired(r) && isStuck(r) && <Badge variant="warning">Stuck</Badge>}
                {!isExpired(r) && !isStuck(r) && "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalCount={total}
        onPageChange={(p) => setParam("page", String(p))}
      />
    </Card>
    </>
  );
}
