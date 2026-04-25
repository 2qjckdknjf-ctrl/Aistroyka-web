"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Badge,
  Card,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from "@/components/ui";
import { FilterBar } from "@/components/cockpit/FilterBar";
import { useFilterParams } from "@/lib/cockpit/useFilterParams";
import { parseTablePagination } from "@/lib/cockpit/useTablePagination";
import { Link } from "@/i18n/navigation";

const UPLOAD_STATUS_OPTIONS = [
  { value: "created", label: "Created" },
  { value: "uploaded", label: "Uploaded" },
  { value: "finalized", label: "Finalized" },
  { value: "expired", label: "Expired" },
];

interface UploadSessionRow {
  id: string;
  tenant_id: string;
  user_id: string;
  purpose: string;
  status: string;
  created_at: string;
  expires_at: string;
  updated_at?: string | null;
  project_id?: string | null;
  task_id?: string | null;
  report_id?: string | null;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function statusVariant(status: string): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "finalized":
      return "success";
    case "created":
    case "uploaded":
      return "warning";
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}

function purposeLabel(purpose: string): string {
  switch (purpose) {
    case "report_before":
      return "Report before";
    case "report_after":
      return "Report after";
    case "project_media":
      return "Project media";
    default:
      return purpose || "—";
  }
}

function referenceLabel(row: UploadSessionRow): string {
  if (row.report_id) return `Report ${row.report_id.slice(0, 8)}…`;
  if (row.task_id) return `Task ${row.task_id.slice(0, 8)}…`;
  if (row.project_id) return `Project ${row.project_id.slice(0, 8)}…`;
  return "—";
}

export function UploadsDashboardClient() {
  const { params, setParam } = useFilterParams();
  const searchParams = useSearchParams();
  const [data, setData] = useState<UploadSessionRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { page, pageSize, offset, limit } = parseTablePagination(params);
  const stuck = searchParams.get("stuck") === "1" || searchParams.get("stuck") === "true";

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    sp.set("offset", String(offset));
    if (params.status) sp.set("status", params.status);
    if (params.worker_id) sp.set("worker_id", params.worker_id);
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    if (stuck) sp.set("stuck", "1");

    fetch(`/api/v1/media/upload-sessions?${sp}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || "Failed to load upload sessions");
        return res.json();
      })
      .then((json: { data?: UploadSessionRow[]; total?: number }) => {
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load upload sessions");
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [limit, offset, params.status, params.worker_id, params.from, params.to, stuck]);

  const filterBar = (
    <div className="mb-4">
      <FilterBar
        projects={[]}
        workers={[]}
        showProject={false}
        showWorker={false}
        showDateRange={true}
        showStatus={true}
        statusOptions={UPLOAD_STATUS_OPTIONS}
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
          <p className="p-4 text-aistroyka-text-secondary">{error}</p>
        </Card>
      </>
    );
  }

  if (!data?.length && !loading && total === 0) {
    return (
      <>
        {filterBar}
        <Card>
          <EmptyState
            icon={<span className="text-2xl">⇧</span>}
            title={stuck ? "No stuck upload sessions" : "No upload sessions"}
            subtitle={
              stuck
                ? "Upload sessions older than the stuck threshold will appear here."
                : "Worker and manager upload sessions will appear here when media is created."
            }
          />
        </Card>
      </>
    );
  }

  return (
    <>
      {filterBar}
      {stuck && (
        <Card className="mb-4 border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
            Showing stuck upload sessions
          </p>
          <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
            Clear the URL filter to return to all upload sessions.
          </p>
        </Card>
      )}
      <Card className="overflow-hidden p-0">
        <Table aria-label="Upload sessions">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Session</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Purpose</TableHeaderCell>
              <TableHeaderCell>Worker</TableHeaderCell>
              <TableHeaderCell>Reference</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell>Updated / expires</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="font-mono text-aistroyka-caption" title={row.id}>
                    {row.id.slice(0, 8)}…
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                </TableCell>
                <TableCell>{purposeLabel(row.purpose)}</TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/workers/${row.user_id}`}
                    className="font-mono text-aistroyka-caption text-aistroyka-accent hover:underline"
                    title={row.user_id}
                  >
                    {row.user_id.slice(0, 8)}…
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-aistroyka-caption text-aistroyka-text-secondary">
                  {referenceLabel(row)}
                </TableCell>
                <TableCell className="tabular-nums text-aistroyka-text-secondary">
                  {formatDate(row.created_at)}
                </TableCell>
                <TableCell className="tabular-nums text-aistroyka-text-secondary">
                  {row.updated_at ? formatDate(row.updated_at) : formatDate(row.expires_at)}
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
