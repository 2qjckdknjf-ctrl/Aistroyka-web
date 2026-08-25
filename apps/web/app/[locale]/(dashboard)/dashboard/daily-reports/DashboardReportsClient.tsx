"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Skeleton,
  EmptyState,
  Badge,
  TablePagination,
  Button,
} from "@/components/ui";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";
import { FilterBar } from "@/components/cockpit/FilterBar";
import { useFilterParams } from "@/lib/cockpit/useFilterParams";
import { parseTablePagination } from "@/lib/cockpit/useTablePagination";
import { exportTableToCsv } from "@/lib/cockpit/csvExport";
import {
  countPendingReportApprovals,
  reportStatusBadgeVariant,
} from "./reports-list.utils";

interface ReportRow {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  project_id: string | null;
  media_count?: number;
  analysis_status?: "none" | "queued" | "running" | "success" | "failed";
  actual_volume?: number | null;
  planned_volume?: number | null;
}

function formatReportVolume(
  actual: number | null | undefined,
  planned: number | null | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  if (actual != null && planned != null) return t("volumePairFmt", { actual, planned });
  if (actual != null) return t("volumeSingleFmt", { value: actual });
  if (planned != null) return t("volumeSingleFmt", { value: planned });
  return "—";
}

function formatAge(dateStr: string, t: (key: string, values?: Record<string, string | number | Date>) => string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 60) return t("minutesAgoShort", { count: diffM });
  if (diffH < 24) return t("hoursAgoShort", { count: diffH });
  return t("daysAgoShort", { count: diffD });
}

const DEFAULT_REPORTS_BASE = "/dashboard/daily-reports";

export function DashboardReportsClient({
  basePath = DEFAULT_REPORTS_BASE,
  skin = "default",
}: {
  basePath?: string;
  skin?: "default" | "canon";
}) {
  const tDashboard = useTranslations("dashboard");
  const tDetail = useTranslations("dashboardDetail");
  const reportStatusOptions = [
    { value: "", label: tDetail("all") },
    { value: "submitted", label: tDetail("pendingApproval") },
    { value: "draft", label: tDetail("draft") },
    { value: "approved", label: tDetail("approved") },
    { value: "rejected", label: tDetail("rejected") },
    { value: "changes_requested", label: tDetail("changesRequested") },
  ];
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
        setError(e instanceof Error ? e.message : tDetail("failedLoad"));
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

  const pendingReviewCount = useMemo(
    () => countPendingReportApprovals(data ?? []),
    [data],
  );

  const isCanon = skin === "canon";
  const shellClass = isCanon ? "canon-glass overflow-hidden" : undefined;

  if (loading && !data) {
    return isCanon ? (
      <div className="canon-glass p-4">
        <Skeleton lines={5} />
      </div>
    ) : (
      <DashboardGlassCard>
        <Skeleton lines={5} />
      </DashboardGlassCard>
    );
  }

  if (error) {
    return isCanon ? (
      <div className="canon-glass p-4 text-[var(--canon-text-secondary)]">{error}</div>
    ) : (
      <DashboardGlassCard>
        <p className="text-aistroyka-text-secondary p-4">{error}</p>
      </DashboardGlassCard>
    );
  }

  if (!data?.length) {
    return isCanon ? (
      <div className="canon-glass p-8">
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title={tDetail("noReportsYet")}
          subtitle={tDetail("dailyReportsAppear")}
        />
      </div>
    ) : (
      <DashboardGlassCard>
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title={tDetail("noReportsYet")}
          subtitle={tDetail("dailyReportsAppear")}
        />
      </DashboardGlassCard>
    );
  }

  const exportCsv = () => {
    const headers = [tDetail("reportId"), tDetail("status"), tDetail("worker"), tDetail("project"), tDetail("ai"), tDetail("volume"), tDetail("media"), tDetail("age"), tDetail("created")];
    const rows = data.slice(0, 500).map((r) => [
      r.id,
      r.status,
      r.user_id,
      r.project_id ?? "",
      r.analysis_status ?? "",
      r.actual_volume != null || r.planned_volume != null
        ? formatReportVolume(r.actual_volume, r.planned_volume, tDetail)
        : "",
      String(r.media_count ?? 0),
      formatAge(r.created_at, tDetail),
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
          statusOptions={reportStatusOptions}
          showSearch={true}
          searchPlaceholder={tDetail("searchReportOrWorker")}
          showSavedViews={true}
        />
      </div>
      {pendingReviewCount > 0 ? (
        isCanon ? (
          <div
            className="canon-glass mb-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-[var(--canon-gold)] p-4"
            aria-label={tDashboard("queueReportsReview")}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--canon-text-muted)]">
                {tDashboard("queueReportsReview")}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--canon-gold)]">
                {pendingReviewCount}
              </p>
            </div>
            {params.status !== "submitted" ? (
              <button
                type="button"
                className="canon-ghost-btn !text-xs"
                onClick={() => {
                  setParam("status", "submitted");
                  setParam("page", "1");
                }}
              >
                {tDashboard("viewAll")}
              </button>
            ) : null}
          </div>
        ) : (
          <DashboardGlassCard
            className="mb-4 border-l-4 border-l-aistroyka-warning"
            contentClassName="flex flex-wrap items-center justify-between gap-3 p-4"
            aria-label={tDashboard("queueReportsReview")}
          >
            <div>
              <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">
                {tDashboard("queueReportsReview")}
              </p>
              <p className="mt-1 text-aistroyka-title3 font-semibold tabular-nums text-aistroyka-text-primary">
                {pendingReviewCount}
              </p>
            </div>
            {params.status !== "submitted" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setParam("status", "submitted");
                  setParam("page", "1");
                }}
              >
                {tDashboard("viewAll")}
              </Button>
            ) : null}
          </DashboardGlassCard>
        )
      ) : null}
      {isCanon ? (
        <div className={shellClass ?? "canon-glass overflow-hidden"}>
          <div className="flex justify-end p-2">
            <button type="button" className="canon-ghost-btn !text-xs" onClick={exportCsv}>
              {tDetail("exportCsv")}
            </button>
          </div>
          <div className="canon-data-table-wrap">
            <table className="canon-data-table">
              <thead>
                <tr>
                  <th>{tDetail("report")}</th>
                  <th>{tDetail("status")}</th>
                  <th className="canon-hide-mobile">{tDetail("volume")}</th>
                  <th className="canon-hide-mobile">{tDetail("worker")}</th>
                  <th className="canon-hide-mobile">{tDetail("project")}</th>
                  <th>{tDetail("age")}</th>
                  <th>{tDetail("action")}</th>
                </tr>
              </thead>
              <tbody>
                {pageData.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link
                        href={`${basePath}/${r.id}`}
                        className="font-mono text-xs text-[var(--canon-cyan)] hover:underline"
                      >
                        {r.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td>
                      <span className={`canon-risk-badge ${
                        r.status === "approved"
                          ? "canon-risk-badge--low"
                          : r.status === "rejected"
                            ? "canon-risk-badge--high"
                            : "canon-risk-badge--medium"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="canon-hide-mobile text-xs tabular-nums">
                      {formatReportVolume(r.actual_volume, r.planned_volume, tDetail)}
                    </td>
                    <td className="canon-hide-mobile font-mono text-xs">
                      {r.user_id.slice(0, 8)}…
                    </td>
                    <td className="canon-hide-mobile font-mono text-xs">
                      {r.project_id ? r.project_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="text-xs tabular-nums">{formatAge(r.created_at, tDetail)}</td>
                    <td>
                      <Link href={`${basePath}/${r.id}`} className="text-[var(--canon-cyan)] hover:underline">
                        {tDetail("view")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={pageData.total}
            onPageChange={(p) => setParam("page", String(p))}
          />
        </div>
      ) : (
        <DashboardGlassCard contentClassName="p-0 overflow-hidden">
          <div className="p-2 flex justify-end">
            <Button variant="secondary" onClick={exportCsv} className="text-sm">{tDetail("exportCsv")}</Button>
          </div>
          <Table aria-label={tDetail("reports")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("report")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("worker")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("project")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("ai")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("volume")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("media")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("age")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("action")}</TableHeaderCell>
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
                <Badge variant={reportStatusBadgeVariant(r.status)}>
                  {r.status}
                </Badge>
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
              <TableCell className="tabular-nums">
                {formatReportVolume(r.actual_volume, r.planned_volume, tDetail)}
              </TableCell>
              <TableCell className="tabular-nums">{r.media_count ?? 0}</TableCell>
              <TableCell className="text-aistroyka-text-secondary tabular-nums">{formatAge(r.created_at, tDetail)}</TableCell>
              <TableCell>
                <Link href={`${basePath}/${r.id}`} className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded">
                  {tDetail("view")}
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
      </DashboardGlassCard>
      )}
    </>
  );
}
