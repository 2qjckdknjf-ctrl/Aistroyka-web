"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
  Skeleton,
  EmptyState,
  TablePagination,
  Button,
} from "@/components/ui";
import { exportTableToCsv } from "@/lib/cockpit/csvExport";

interface JobRow {
  id: string;
  type: string;
  status: string;
  last_error: string;
  created_at: string;
}

export function AdminJobsClient() {
  const tDetail = useTranslations("dashboardDetail");
  const [data, setData] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [allJobs, setAllJobs] = useState<JobRow[]>([]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/v1/admin/jobs?${params}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "Forbidden" : res.statusText);
        return res.json();
      })
      .then((json: { data?: JobRow[] }) => {
        setAllJobs(json.data ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : tDetail("failedLoad"));
        setAllJobs([]);
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const total = allJobs.length;
  const start = (page - 1) * pageSize;
  const pageData = allJobs.slice(start, start + pageSize);

  if (error) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary">{error}</p>
      </Card>
    );
  }

  if (loading && allJobs.length === 0) {
    return (
      <Card>
        <Skeleton lines={6} />
      </Card>
    );
  }

  const exportCsv = () => {
    const headers = ["ID", tDetail("type"), tDetail("status"), tDetail("lastError"), tDetail("created")];
    const rows = allJobs.slice(0, 500).map((r) => [
      r.id,
      r.type,
      r.status,
      r.last_error ?? "",
      new Date(r.created_at).toISOString(),
    ]);
    exportTableToCsv(headers, rows, "admin-jobs.csv");
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aistroyka-border-subtle px-4 py-3">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{tDetail("failedJobs")}</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportCsv} className="text-sm">{tDetail("exportCsv")}</Button>
          <select
          aria-label={tDetail("filterByStatus")}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption"
        >
          <option value="">{tDetail("allFailedDead")}</option>
          <option value="failed">{tDetail("failed")}</option>
          <option value="dead">{tDetail("dead")}</option>
        </select>
        </div>
      </div>
      {pageData.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<span className="text-2xl">✓</span>}
            title={tDetail("noFailedJobs")}
            subtitle={tDetail("noFailedOrDeadJobs")}
          />
        </div>
      ) : (
        <>
          <Table aria-label={tDetail("failedJobs")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{tDetail("id")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("type")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("lastError")}</TableHeaderCell>
                <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageData.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(r.id)}
                      className="font-mono text-aistroyka-caption text-aistroyka-accent hover:underline truncate max-w-[100px] block text-left"
                      title={r.id}
                    >
                      {r.id.slice(0, 8)}…
                    </button>
                  </TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell><Badge variant="danger">{r.status}</Badge></TableCell>
                  <TableCell>
                    <span className="max-w-[200px] truncate block text-aistroyka-text-secondary" title={r.last_error}>{r.last_error || "—"}</span>
                  </TableCell>
                  <TableCell className="tabular-nums text-aistroyka-text-secondary">
                    {new Date(r.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            pageSizeOptions={[25, 50, 100]}
          />
        </>
      )}
    </Card>
  );
}
