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

const AI_STATUS_OPTIONS = [
  { value: "queued", label: "Queued" },
  { value: "running", label: "Running" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "dead", label: "Dead" },
];

interface AIRequestRow {
  id: string;
  type: string;
  status: string;
  entity: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export function DashboardAIClient() {
  const { params, setParam } = useFilterParams();
  const [data, setData] = useState<AIRequestRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const { page, pageSize, offset, limit } = parseTablePagination(params);

  useEffect(() => {
    fetch("/api/v1/projects", { credentials: "include" })
      .then((res) => res.ok ? res.json() : Promise.resolve({ data: [] }))
      .then((json: { data?: { id: string; name: string }[] }) => setProjects(json.data ?? []))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    sp.set("offset", String(offset));
    if (params.status) sp.set("status", params.status);
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    if (params.q.trim()) sp.set("q", params.q.trim());
    fetch(`/api/v1/ai/requests?${sp}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: AIRequestRow[]; total?: number }) => {
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
  }, [page, pageSize, params.status, params.from, params.to, params.q]);

  const filterBar = (
    <div className="mb-4">
      <FilterBar
        projects={projects}
        workers={[]}
        showProject={false}
        showWorker={false}
        showDateRange={true}
        showStatus={true}
        statusOptions={AI_STATUS_OPTIONS}
        showSearch={true}
        searchPlaceholder="Request or entity ID…"
        showSavedViews={false}
      />
    </div>
  );

  const exportCsv = () => {
    const headers = ["ID", "Type", "Status", "Entity", "Attempts", "Created"];
    const rows = (data ?? []).slice(0, 500).map((r) => [
      r.id,
      r.type,
      r.status,
      r.entity ?? "",
      r.attempts,
      new Date(r.created_at).toISOString(),
    ]);
    exportTableToCsv(headers, rows, "ai-requests.csv");
  };

  if (loading && !data) {
    return (
      <>
        {filterBar}
        <Card><Skeleton lines={5} /></Card>
      </>
    );
  }
  if (error) {
    return (
      <>
        {filterBar}
        <Card><p className="text-aistroyka-text-secondary p-4">{error}</p></Card>
      </>
    );
  }
  if (!data?.length && !loading && total === 0) {
    return (
      <>
        {filterBar}
        <Card>
          <EmptyState
            icon={<span className="text-2xl">🤖</span>}
            title="No AI requests"
            subtitle="AI analysis jobs will appear here when reports or media are analyzed."
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
        <Table aria-label="AI requests">
        <TableHead>
          <TableRow>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Entity</TableHeaderCell>
            <TableHeaderCell>Attempts</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data ?? []).map((r) => (
            <TableRow key={r.id}>
              <TableCell><span className="font-mono text-sm" title={r.id}>{r.id.slice(0, 8)}…</span></TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell>
                <Badge variant={r.status === "success" ? "success" : r.status === "failed" || r.status === "dead" ? "danger" : "warning"}>{r.status}</Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">{r.entity ? `${r.entity.slice(0, 8)}…` : "—"}</TableCell>
              <TableCell className="tabular-nums">{r.attempts}</TableCell>
              <TableCell className="tabular-nums text-aistroyka-text-secondary">
                {new Date(r.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/ai/${r.id}`} className="font-medium text-aistroyka-accent hover:underline">View</Link>
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
