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

const DEVICE_PLATFORM_OPTIONS = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "web", label: "Web" },
];

interface DeviceRow {
  user_id: string;
  device_id: string;
  platform: string;
  created_at: string;
  disabled_at: string | null;
}

export function DashboardDevicesClient() {
  const { params, setParam } = useFilterParams();
  const [data, setData] = useState<DeviceRow[] | null>(null);
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
    // FilterBar uses param "status"; API expects query param "platform" (ios/android).
    if (params.status) sp.set("platform", params.status);
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    fetch(`/api/v1/devices?${sp}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: DeviceRow[]; total?: number }) => {
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
  }, [page, pageSize, params.status, params.from, params.to]);

  const filterBar = (
    <div className="mb-4">
      <FilterBar
        projects={projects}
        workers={[]}
        showProject={false}
        showWorker={false}
        showDateRange={true}
        showStatus={true}
        statusOptions={DEVICE_PLATFORM_OPTIONS}
        showSearch={false}
        showSavedViews={false}
      />
    </div>
  );

  const exportCsv = () => {
    const headers = ["Device ID", "Platform", "User ID", "Created", "Disabled"];
    const rows = (data ?? []).map((r) => [
      r.device_id,
      r.platform,
      r.user_id,
      new Date(r.created_at).toISOString(),
      r.disabled_at ?? "",
    ]);
    exportTableToCsv(headers, rows, "devices.csv");
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
            icon={<span className="text-2xl">📱</span>}
            title="No devices"
            subtitle="Registered devices will appear here (push tokens)."
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
        <Table aria-label="Devices">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Device ID</TableHeaderCell>
            <TableHeaderCell>Platform</TableHeaderCell>
            <TableHeaderCell>Owner</TableHeaderCell>
            <TableHeaderCell>Registered</TableHeaderCell>
            <TableHeaderCell>Last seen</TableHeaderCell>
            <TableHeaderCell>Health</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data ?? []).map((r) => (
            <TableRow key={`${r.user_id}-${r.device_id}`}>
              <TableCell><span className="font-mono text-sm" title={r.device_id}>{r.device_id.slice(0, 12)}…</span></TableCell>
              <TableCell>{r.platform}</TableCell>
              <TableCell>
                <Link href={`/dashboard/workers/${r.user_id}`} className="font-mono text-aistroyka-caption text-aistroyka-accent hover:underline" title={r.user_id}>{r.user_id.slice(0, 8)}…</Link>
              </TableCell>
              <TableCell className="tabular-nums text-aistroyka-text-secondary">
                {new Date(r.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </TableCell>
              <TableCell className="text-aistroyka-text-tertiary">—</TableCell>
              <TableCell>
                {r.disabled_at ? (
                  <Badge variant="danger">Disabled</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
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
