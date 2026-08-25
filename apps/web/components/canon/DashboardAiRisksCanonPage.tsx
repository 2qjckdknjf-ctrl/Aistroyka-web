"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useFilterParams } from "@/lib/cockpit/useFilterParams";
import { parseTablePagination } from "@/lib/cockpit/useTablePagination";
import { Skeleton, EmptyState } from "@/components/ui";
import {
  buildAiRiskHeatmapFromRequests,
  buildAiWavePointsFromRequests,
  buildAiRecommendationKeys,
  sortAiRequestsByAttention,
} from "@/app/[locale]/(dashboard)/dashboard/ai/ai-requests-workspace.utils";
import { CanonPageHeader } from "./CanonPageHeader";
import { CanonProgressRing } from "./CanonProgressRing";
import { CanonRiskHeatmap } from "./CanonRiskHeatmap";
import { CanonAiWaveChart } from "./CanonAiWaveChart";

interface AIRequestRow {
  id: string;
  type: string;
  status: string;
  entity: string | null;
  attempts: number;
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

export function DashboardAiRisksCanonPage() {
  const t = useTranslations("canon");
  const tDetail = useTranslations("dashboardDetail");
  const { params, setParam } = useFilterParams();
  const [data, setData] = useState<AIRequestRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [analyticsRows, setAnalyticsRows] = useState<AIRequestRow[]>([]);

  const { page, pageSize, offset, limit } = parseTablePagination(params);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    sp.set("offset", String(offset));
    if (params.status) sp.set("status", params.status);
    fetch(`/api/v1/ai/requests?${sp}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: { data?: AIRequestRow[]; total?: number; summary?: AISummary }) => {
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
        setSummary(json.summary ?? null);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : tDetail("failedLoad"));
        setData([]);
        setTotal(0);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [offset, limit, params.status, tDetail]);

  useEffect(() => {
    const sp = new URLSearchParams();
    sp.set("limit", "200");
    sp.set("offset", "0");
    fetch(`/api/v1/ai/requests?${sp}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: AIRequestRow[] } | null) => {
        setAnalyticsRows(json?.data ?? []);
      })
      .catch(() => setAnalyticsRows([]));
  }, []);

  const heatmapCells = buildAiRiskHeatmapFromRequests(analyticsRows);
  const wavePoints = buildAiWavePointsFromRequests(analyticsRows);
  const recommendationKeys = summary ? buildAiRecommendationKeys(summary) : ["aiRecSchedule", "aiRecBudget", "aiRecResources"];

  const riskCount = (summary?.failed ?? 0) + (summary?.dead ?? 0);
  const successRate =
    summary && summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;

  if (loading && !data) {
    return (
      <div className="p-4">
        <Skeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CanonPageHeader title={t("aiRisksTitle")} subtitle={t("screen09Label")} showFavorite={false} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="canon-glass flex items-center gap-3 p-4">
          <CanonProgressRing value={riskCount > 0 ? Math.min(100, riskCount * 8) : 12} size={72} label={t("aiKpiRisks")} />
          <div>
            <p className="text-xs text-[var(--canon-text-muted)]">{t("aiKpiRisks")}</p>
            <p className="text-2xl font-semibold tabular-nums text-[var(--canon-danger)]">{riskCount}</p>
          </div>
        </div>
        <div className="canon-glass p-4">
          <p className="text-xs text-[var(--canon-text-muted)]">{t("aiKpiJobs")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary?.total ?? 0}</p>
        </div>
        <div className="canon-glass p-4">
          <p className="text-xs text-[var(--canon-text-muted)]">{t("aiKpiSuccess")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--canon-success)]">{successRate}%</p>
        </div>
        <div className="canon-glass p-4">
          <p className="text-xs text-[var(--canon-text-muted)]">{t("aiKpiQueue")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--canon-gold)]">
            {(summary?.queued ?? 0) + (summary?.running ?? 0)}
          </p>
        </div>
      </div>

      <div className="canon-ai-risks-workspace">
        <section className="space-y-4 min-w-0">
          <div className="canon-glass p-4">
            <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("aiPortfolioChart")}</p>
            <CanonAiWaveChart points={wavePoints} />
            <p className="mt-2 text-xs text-[var(--canon-text-muted)]">{t("aiPortfolioChartHint")}</p>
          </div>

          <CanonRiskHeatmap cells={heatmapCells} />

          <div className="canon-glass overflow-hidden">
            <div className="border-b border-[var(--canon-border-glass)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("aiRequestsTable")}</h3>
            </div>
            {error ? (
              <p className="p-4 text-sm text-[var(--canon-danger)]">{error}</p>
            ) : !data?.length ? (
              <div className="p-6">
                <EmptyState
                  icon={<span className="text-2xl">🤖</span>}
                  title={tDetail("noAiRequests")}
                  subtitle={tDetail("aiRequestsAppear")}
                />
              </div>
            ) : (
              <div className="canon-data-table-wrap">
                <table className="canon-data-table">
                  <thead>
                    <tr>
                      <th>{tDetail("type")}</th>
                      <th>{tDetail("status")}</th>
                      <th className="canon-hide-mobile">{tDetail("created")}</th>
                      <th>{tDetail("action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortAiRequestsByAttention(data).map((row) => (
                      <tr key={row.id}>
                        <td>{row.type}</td>
                        <td>
                          <span className={`canon-risk-badge ${
                            row.status === "success"
                              ? "canon-risk-badge--low"
                              : row.status === "failed" || row.status === "dead"
                                ? "canon-risk-badge--high"
                                : "canon-risk-badge--medium"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="canon-hide-mobile text-xs">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td>
                          <Link href={`/dashboard/ai/${row.id}`} className="text-[var(--canon-cyan)] hover:underline">
                            {tDetail("view")}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {total > pageSize ? (
              <div className="flex justify-between gap-2 border-t border-[var(--canon-border-glass)] px-4 py-2 text-xs">
                <button
                  type="button"
                  className="canon-ghost-btn !text-xs"
                  disabled={page <= 1}
                  onClick={() => setParam("page", String(page - 1))}
                >
                  {tDetail("previousPage")}
                </button>
                <span className="text-[var(--canon-text-muted)]">
                  {page} / {Math.ceil(total / pageSize)}
                </span>
                <button
                  type="button"
                  className="canon-ghost-btn !text-xs"
                  disabled={page * pageSize >= total}
                  onClick={() => setParam("page", String(page + 1))}
                >
                  {tDetail("nextPage")}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="canon-ai-risks-sidebar space-y-4">
          <div className="canon-ai-panel rounded-xl p-4">
            <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("aiRecommendations")}</p>
            <ul className="mt-3 space-y-2 text-xs text-[var(--canon-text-secondary)]">
              {recommendationKeys.map((key) => (
                <li key={key}>
                  {key === "aiRecFailedCount" && summary
                    ? t("aiRecFailedCount", { count: summary.failed })
                    : key === "aiRecDeadCount" && summary
                      ? t("aiRecDeadCount", { count: summary.dead })
                      : key === "aiRecQueueCount" && summary
                        ? t("aiRecQueueCount", { count: summary.queued + summary.running })
                        : t(key)}
                </li>
              ))}
            </ul>
          </div>
          <div className="canon-glass p-4">
            <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("aiRecentEvents")}</p>
            <ul className="mt-3 space-y-2 text-xs">
              {(data ?? []).slice(0, 5).map((row) => (
                <li key={row.id} className="text-[var(--canon-text-secondary)]">
                  {row.type} · {row.status}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
