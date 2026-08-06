"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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

interface AIRequestRow {
  id: string;
  type: string;
  status: string;
  entity: string | null;
  attempts: number;
  last_error: string | null;
  last_error_type: string | null;
  user_message_key?: string;
  created_at: string;
  updated_at: string;
}

interface AISummary {
  total: number;
  queued: number;
  running: number;
  success: number;
  failed: number;
  dead: number;
}

function statusBadgeVariant(status: string): "success" | "danger" | "warning" {
  if (status === "success") return "success";
  if (status === "failed" || status === "dead") return "danger";
  return "warning";
}

function friendlyStatusLabel(
  tDetail: ReturnType<typeof useTranslations<"dashboardDetail">>,
  row: AIRequestRow
): string {
  const key = row.user_message_key;
  if (key === "aiStatusQueued") return tDetail("aiStatusQueued");
  if (key === "aiStatusRunning") return tDetail("aiStatusRunning");
  if (key === "aiStatusSuccess") return tDetail("aiStatusSuccess");
  if (key === "aiStatusTemporary") return tDetail("aiStatusTemporary");
  if (key === "aiStatusNotConfigured") return tDetail("aiStatusNotConfigured");
  if (key === "aiStatusFailed") return tDetail("aiStatusFailed");
  // Fallback by status
  if (row.status === "queued") return tDetail("aiStatusQueued");
  if (row.status === "running") return tDetail("aiStatusRunning");
  if (row.status === "success") return tDetail("aiStatusSuccess");
  return tDetail("aiStatusFailed");
}

export function DashboardAIClient() {
  const tDetail = useTranslations("dashboardDetail");
  const aiStatusOptions = [
    { value: "queued", label: tDetail("queued") },
    { value: "running", label: tDetail("running") },
    { value: "success", label: tDetail("success") },
    { value: "failed", label: tDetail("failed") },
    { value: "dead", label: tDetail("dead") },
  ];
  const { params, setParam } = useFilterParams();
  const [data, setData] = useState<AIRequestRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [visionConfigured, setVisionConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const { page, pageSize, offset, limit } = parseTablePagination(params);

  useEffect(() => {
    fetch("/api/v1/projects", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.resolve({ data: [] })))
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
      .then(
        (json: {
          data?: AIRequestRow[];
          total?: number;
          summary?: AISummary;
          vision_configured?: boolean;
        }) => {
          setData(json.data ?? []);
          setTotal(json.total ?? 0);
          setSummary(json.summary ?? null);
          setVisionConfigured(json.vision_configured !== false);
          setError(null);
        }
      )
      .catch((e) => {
        setError(e instanceof Error ? e.message : tDetail("failedLoad"));
        setData([]);
        setTotal(0);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [offset, limit, params.status, params.from, params.to, params.q, tDetail]);

  const filterBar = (
    <div className="mb-4">
      <FilterBar
        projects={projects}
        workers={[]}
        showProject={false}
        showWorker={false}
        showDateRange={true}
        showStatus={true}
        statusOptions={aiStatusOptions}
        showSearch={true}
        searchPlaceholder={tDetail("requestOrEntityId")}
        showSavedViews={false}
      />
    </div>
  );

  const exportCsv = () => {
    const headers = [
      tDetail("id"),
      tDetail("type"),
      tDetail("status"),
      tDetail("entity"),
      tDetail("attempts"),
      tDetail("created"),
    ];
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

  const summaryTotal = summary?.total ?? 0;
  const hasFailed = (summary?.failed ?? 0) + (summary?.dead ?? 0) > 0;
  const hasPending = (summary?.queued ?? 0) + (summary?.running ?? 0) > 0;
  const filtersActive = Boolean(params.status || params.q.trim());

  // Never show "No AI requests" when failed/dead/queued jobs exist for the tenant.
  if (!data?.length && !loading && total === 0) {
    if (summaryTotal > 0) {
      let title = tDetail("aiStatusFilteredEmpty");
      let subtitle = tDetail("aiRequestsFilteredHint");
      if (!filtersActive && hasFailed) {
        title = tDetail("aiStatusFailed");
        subtitle = tDetail("aiRequestsFailedHint");
      } else if (!filtersActive && hasPending) {
        title = tDetail("aiStatusQueued");
        subtitle = tDetail("aiRequestsPendingHint");
      } else if (!visionConfigured) {
        title = tDetail("aiStatusNotConfigured");
        subtitle = tDetail("aiRequestsNotConfiguredHint");
      }
      return (
        <>
          {filterBar}
          <Card>
            <EmptyState
              icon={<span className="text-2xl" aria-hidden>🤖</span>}
              title={title}
              subtitle={subtitle}
            />
          </Card>
        </>
      );
    }

    if (!visionConfigured) {
      return (
        <>
          {filterBar}
          <Card>
            <EmptyState
              icon={<span className="text-2xl" aria-hidden>🤖</span>}
              title={tDetail("aiStatusNotConfigured")}
              subtitle={tDetail("aiRequestsNotConfiguredHint")}
            />
          </Card>
        </>
      );
    }

    return (
      <>
        {filterBar}
        <Card>
          <EmptyState
            icon={<span className="text-2xl" aria-hidden>🤖</span>}
            title={tDetail("noAiRequests")}
            subtitle={tDetail("aiRequestsAppear")}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      {filterBar}
      {!visionConfigured && (
        <Card className="mb-4 border-l-4 border-l-aistroyka-warning">
          <p className="p-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {tDetail("aiStatusNotConfigured")}
          </p>
        </Card>
      )}
      <Card className="p-0 overflow-hidden">
        <div className="p-2 flex justify-end">
          <Button variant="secondary" onClick={exportCsv} className="text-sm">
            {tDetail("exportCsv")}
          </Button>
        </div>
        <Table aria-label={tDetail("aiRequests")}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{tDetail("id")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("type")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("status")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("aiUserStatus")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("entity")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("attempts")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("created")}</TableHeaderCell>
              <TableHeaderCell>{tDetail("action")}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <span className="font-mono text-sm" title={r.id}>
                    {r.id.slice(0, 8)}…
                  </span>
                </TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                </TableCell>
                <TableCell className="text-aistroyka-text-secondary text-sm">
                  {friendlyStatusLabel(tDetail, r)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {r.entity ? `${r.entity.slice(0, 8)}…` : "—"}
                </TableCell>
                <TableCell className="tabular-nums">{r.attempts}</TableCell>
                <TableCell className="tabular-nums text-aistroyka-text-secondary">
                  {new Date(r.created_at).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/ai/${r.id}`}
                    className="font-medium text-aistroyka-accent hover:underline"
                  >
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
          totalCount={total}
          onPageChange={(p) => setParam("page", String(p))}
        />
      </Card>
    </>
  );
}
