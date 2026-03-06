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
  TablePagination,
} from "@/components/ui";
import { FilterBar } from "@/components/cockpit/FilterBar";
import { useFilterParams } from "@/lib/cockpit/useFilterParams";
import { parseTablePagination } from "@/lib/cockpit/useTablePagination";
import { exportTableToCsv } from "@/lib/cockpit/csvExport";

interface ProjectRow {
  id: string;
  name: string;
  created_at?: string;
}

export function DashboardProjectsListClient() {
  const { params, setParam } = useFilterParams();
  const [data, setData] = useState<ProjectRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/projects", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: ProjectRow[] }) => {
        setData(json.data ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = params.q.trim().toLowerCase();
    const pid = params.project_id;
    return list.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!pid || p.id === pid)
    );
  }, [data, params.q, params.project_id]);

  const { page, pageSize, offset } = parseTablePagination(params);
  const totalCount = filtered.length;
  const pageData = filtered.slice(offset, offset + pageSize);

  const handlePageChange = (p: number) => setParam("page", String(p));
  const handlePageSizeChange = (s: number) => {
    setParam("pageSize", String(s));
    setParam("page", "1");
  };

  const handleExportCsv = () => {
    const headers = ["ID", "Name", "Created"];
    const rows = pageData.map((p) => [
      p.id,
      p.name,
      p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : "",
    ]);
    exportTableToCsv(headers, rows, `projects-${new Date().toISOString().slice(0, 10)}.csv`);
  };

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
        <p className="text-aistroyka-text-secondary">{error}</p>
      </Card>
    );
  }

  const projects = (data ?? []).map((p) => ({ id: p.id, name: p.name }));

  return (
    <>
      <div className="mb-4">
        <FilterBar
          projects={projects}
          showWorker={false}
          showStatus={false}
          showSavedViews={true}
        />
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aistroyka-border-subtle px-4 py-3">
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Projects</h2>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={pageData.length === 0}
            className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-3 py-1.5 text-aistroyka-caption font-medium text-aistroyka-text-primary hover:bg-aistroyka-surface focus:outline-none focus:ring-2 focus:ring-aistroyka-accent disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<span className="text-2xl">📁</span>}
              title={data?.length ? "No matching projects" : "No projects yet"}
              subtitle={data?.length ? "Adjust filters or search." : "Create a project to get started."}
            />
          </div>
        ) : (
          <>
            <Table aria-label="Projects">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageData.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-aistroyka-text-secondary tabular-nums">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/projects/${p.id}`}
                        className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Card>
    </>
  );
}
