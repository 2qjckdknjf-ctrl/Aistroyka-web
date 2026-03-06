"use client";

import { useState, useEffect } from "react";
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

interface OutboxRow {
  id: string;
  tenant_id: string;
  user_id: string;
  platform: string;
  type: string;
  status: string;
  attempts: number;
  last_error: string | null;
  next_retry_at: string | null;
  created_at: string;
}

export function AdminPushOutboxClient() {
  const [data, setData] = useState<OutboxRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/v1/admin/push/outbox?${params}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "Forbidden" : res.statusText);
        return res.json();
      })
      .then((json: { data?: OutboxRow[]; total?: number }) => {
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
  }, [page, pageSize, statusFilter]);

  if (error) {
    return (
      <Card>
        <p className="text-aistroyka-text-secondary">{error}</p>
      </Card>
    );
  }

  if (loading && data.length === 0) {
    return (
      <Card>
        <Skeleton lines={6} />
      </Card>
    );
  }

  const exportCsv = () => {
    const headers = ["ID", "User", "Platform", "Type", "Status", "Attempts", "Last error", "Next retry", "Created"];
    const rows = data.slice(0, 500).map((r) => [
      r.id,
      r.user_id,
      r.platform,
      r.type,
      r.status,
      r.attempts,
      r.last_error ?? "",
      r.next_retry_at ?? "",
      new Date(r.created_at).toISOString(),
    ]);
    exportTableToCsv(headers, rows, "push-outbox.csv");
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aistroyka-border-subtle px-4 py-3">
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Push outbox</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportCsv} className="text-sm">Export CSV</Button>
          <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption"
        >
          <option value="">All</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={<span className="text-2xl">📤</span>}
            title="No outbox entries"
            subtitle="Push notifications will appear here when queued."
          />
        </div>
      ) : (
        <>
          <Table aria-label="Push outbox">
            <TableHead>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Platform</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Attempts</TableHeaderCell>
                <TableHeaderCell>Last error</TableHeaderCell>
                <TableHeaderCell>Next retry</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="font-mono text-aistroyka-caption truncate max-w-[80px] block" title={r.id}>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(r.id)}
                        className="text-aistroyka-accent hover:underline"
                      >
                        {r.id.slice(0, 8)}…
                      </button>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-aistroyka-caption truncate max-w-[80px] block" title={r.user_id}>{r.user_id.slice(0, 8)}…</span>
                  </TableCell>
                  <TableCell>{r.platform}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "sent" ? "success" : r.status === "failed" ? "danger" : "warning"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{r.attempts}</TableCell>
                  <TableCell>
                    <span className="max-w-[120px] truncate block text-aistroyka-text-secondary" title={r.last_error ?? undefined}>{r.last_error ?? "—"}</span>
                  </TableCell>
                  <TableCell className="tabular-nums text-aistroyka-text-secondary">
                    {r.next_retry_at ? new Date(r.next_retry_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—"}
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
