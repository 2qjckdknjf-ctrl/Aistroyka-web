"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Badge,
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
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

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

function purposeLabel(purpose: string, tDetail: ReturnType<typeof useTranslations>): string {
  switch (purpose) {
    case "report_before":
      return tDetail("reportBefore");
    case "report_after":
      return tDetail("reportAfter");
    case "project_media":
      return tDetail("projectMedia");
    default:
      return purpose || "—";
  }
}

function referenceLabel(row: UploadSessionRow, tDetail: ReturnType<typeof useTranslations>): string {
  if (row.report_id) return `${tDetail("report")} ${row.report_id.slice(0, 8)}…`;
  if (row.task_id) return `${tDetail("task")} ${row.task_id.slice(0, 8)}…`;
  if (row.project_id) return `${tDetail("project")} ${row.project_id.slice(0, 8)}…`;
  return "—";
}

export function UploadsDashboardClient({ skin = "default" }: { skin?: "default" | "canon" }) {
  const tDetail = useTranslations("dashboardDetail");
  const isCanon = skin === "canon";
  const UPLOAD_STATUS_OPTIONS = [
    { value: "created", label: tDetail("created") },
    { value: "uploaded", label: tDetail("uploaded") },
    { value: "finalized", label: tDetail("finalized") },
    { value: "expired", label: tDetail("expired") },
  ];
  const { params, setParam } = useFilterParams();
  const searchParams = useSearchParams();
  const [data, setData] = useState<UploadSessionRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { page, pageSize, offset, limit } = parseTablePagination(params);
  const stuck = searchParams?.get("stuck") === "1" || searchParams?.get("stuck") === "true";

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
        if (!res.ok) throw new Error(res.statusText || tDetail("failedLoadUploadSessions"));
        return res.json();
      })
      .then((json: { data?: UploadSessionRow[]; total?: number }) => {
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : tDetail("failedLoadUploadSessions"));
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
        {isCanon ? (
          <div className="canon-glass p-4"><Skeleton lines={5} /></div>
        ) : (
          <DashboardGlassCard>
            <Skeleton lines={5} />
          </DashboardGlassCard>
        )}
      </>
    );
  }

  if (error) {
    return (
      <>
        {filterBar}
        {isCanon ? (
          <div className="canon-glass p-4 text-[var(--canon-text-secondary)]">{error}</div>
        ) : (
          <DashboardGlassCard>
            <p className="p-4 text-aistroyka-text-secondary">{error}</p>
          </DashboardGlassCard>
        )}
      </>
    );
  }

  if (!data?.length && !loading && total === 0) {
    return (
      <>
        {filterBar}
        {isCanon ? (
          <div className="canon-glass p-8">
            <EmptyState
              icon={<span className="text-2xl">⇧</span>}
              title={stuck ? tDetail("noStuckUploadSessions") : tDetail("noUploadSessions")}
              subtitle={stuck ? tDetail("stuckUploadSessionsAppear") : tDetail("uploadSessionsAppear")}
            />
          </div>
        ) : (
          <DashboardGlassCard>
            <EmptyState
              icon={<span className="text-2xl">⇧</span>}
              title={stuck ? tDetail("noStuckUploadSessions") : tDetail("noUploadSessions")}
              subtitle={stuck ? tDetail("stuckUploadSessionsAppear") : tDetail("uploadSessionsAppear")}
            />
          </DashboardGlassCard>
        )}
      </>
    );
  }

  const stuckBanner = stuck ? (
    isCanon ? (
      <div className="canon-glass mb-4 border-l-4 border-l-[var(--canon-warning)] p-4">
        <p className="text-sm font-medium text-[var(--canon-text-primary)]">{tDetail("showingStuckUploadSessions")}</p>
        <p className="mt-1 text-xs text-[var(--canon-text-secondary)]">{tDetail("clearUrlFilterUploadSessions")}</p>
      </div>
    ) : (
      <DashboardGlassCard className="mb-4 border-l-4 border-l-aistroyka-warning">
        <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
          {tDetail("showingStuckUploadSessions")}
        </p>
        <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
          {tDetail("clearUrlFilterUploadSessions")}
        </p>
      </DashboardGlassCard>
    )
  ) : null;

  const tableBody = isCanon ? (
    <div className="canon-glass overflow-hidden">
      <div className="canon-data-table-wrap">
        <table className="canon-data-table">
          <thead>
            <tr>
              <th>{tDetail("session")}</th>
              <th>{tDetail("status")}</th>
              <th className="canon-hide-mobile">{tDetail("purpose")}</th>
              <th className="canon-hide-mobile">{tDetail("worker")}</th>
              <th>{tDetail("created")}</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs">{row.id.slice(0, 8)}…</td>
                <td>
                  <span className={`canon-risk-badge ${
                    row.status === "finalized"
                      ? "canon-risk-badge--low"
                      : row.status === "expired"
                        ? "canon-risk-badge--high"
                        : "canon-risk-badge--medium"
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="canon-hide-mobile">{purposeLabel(row.purpose, tDetail)}</td>
                <td className="canon-hide-mobile">
                  <Link href={`/dashboard/workers/${row.user_id}`} className="text-[var(--canon-cyan)] hover:underline">
                    {row.user_id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="text-xs tabular-nums">{formatDate(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalCount={total}
        onPageChange={(p) => setParam("page", String(p))}
      />
    </div>
  ) : (
    <DashboardGlassCard contentClassName="overflow-hidden p-0">
      <Table aria-label={tDetail("uploadSessions")}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{tDetail("session")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("purpose")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("worker")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("reference")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
            <TableHeaderCell>{tDetail("updatedOrExpires")}</TableHeaderCell>
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
              <TableCell>{purposeLabel(row.purpose, tDetail)}</TableCell>
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
                {referenceLabel(row, tDetail)}
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
    </DashboardGlassCard>
  );

  return (
    <>
      {filterBar}
      {stuckBanner}
      {tableBody}
    </>
  );
}
