"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, SectionHeader, Skeleton } from "@/components/ui";
import { RequestIdPill } from "@/src/features/admin/components/RequestIdPill";

type AiRuntimeResponse = {
  data: {
    aggregates: {
      by_action: Record<string, number>;
      errors_by_kind: Record<string, number>;
      recent_error_sample: Array<{
        trace_id: string | null;
        action: string;
        error_kind?: string;
        at: string;
      }>;
    };
    drilldown: {
      by_route: Record<string, number>;
      complete_count: number;
      error_count: number;
      error_rate_window: number | null;
    };
    operator_hints: Record<string, string>;
    window_hours: number;
    recent: Array<{
      id: string;
      action: string;
      trace_id: string | null;
      details: Record<string, unknown>;
      created_at: string;
    }>;
  };
  correlation: { build_sha: string | null; build_time: string | null; app_env: string | null };
};

async function fetchAiRuntime(hours: number): Promise<AiRuntimeResponse> {
  const res = await fetch(`/api/v1/admin/ops/ai-runtime?hours=${hours}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load AI runtime summary");
  return res.json();
}

export function AdminAiRuntimePanel({ tenantId }: { tenantId: string | null }) {
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const [hours, setHours] = useState(72);
  const q = useQuery({
    queryKey: ["admin-ai-runtime", tenantId, hours],
    queryFn: () => fetchAiRuntime(hours),
    enabled: !!tenantId,
  });

  if (!tenantId) return null;

  return (
    <section className="mt-8" aria-label={tPage("aiRuntimeAria")}>
      <SectionHeader
        title={tPage("aiRuntimeTitle")}
        subtitle={tPage("aiRuntimeSubtitle")}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-aistroyka-text-secondary">
          {tDetail("window")}:
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="ml-2 input-field-sm px-2 py-1 text-sm"
          >
            <option value={24}>24h</option>
            <option value={72}>72h</option>
            <option value={168}>7d</option>
          </select>
        </label>
      </div>

      {q.isPending && (
        <Card>
          <Skeleton className="h-24 w-full" />
        </Card>
      )}
      {q.isError && (
        <Card className="border-l-4 border-l-aistroyka-error">
          <p className="text-sm text-aistroyka-error">{(q.error as Error).message}</p>
        </Card>
      )}
      {q.data && (
        <div className="space-y-4">
          {q.data.data.drilldown.complete_count === 0 && q.data.data.drilldown.error_count === 0 && (
            <Card className="border-l-4 border-l-aistroyka-info bg-aistroyka-surface-raised">
              <p className="text-sm font-medium text-aistroyka-text-primary">{tDetail("noAiRuntimeEventsInWindow")}</p>
              <p className="mt-1 text-sm text-aistroyka-text-secondary">
                {tDetail("aiRuntimeWindowTooNarrowHint")} <strong>7d</strong>.
              </p>
            </Card>
          )}

          <Card>
            <p className="text-xs font-semibold uppercase text-aistroyka-text-tertiary">{tDetail("releaseCorrelation")}</p>
            <p className="mt-1 font-mono text-sm">
              build_sha: {q.data.correlation.build_sha ?? "—"} · env: {q.data.correlation.app_env ?? "—"}
            </p>
            <p className="mt-2 text-xs text-aistroyka-text-secondary">
              {tDetail("errorsSpikeAfterDeployHint")}
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("completesWindow")}</p>
              <p className="text-2xl font-semibold">{q.data.data.drilldown.complete_count}</p>
            </Card>
            <Card>
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("errorsWindow")}</p>
              <p className="text-2xl font-semibold text-aistroyka-error">{q.data.data.drilldown.error_count}</p>
            </Card>
            <Card>
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("errorRate")}</p>
              <p className="text-2xl font-semibold">
                {q.data.data.drilldown.error_rate_window != null
                  ? `${(q.data.data.drilldown.error_rate_window * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </Card>
            <Card>
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">{tDetail("failureClassesHint")}</p>
              <ul className="mt-1 space-y-1 text-xs text-aistroyka-text-secondary">
                {Object.entries(q.data.data.operator_hints).slice(0, 4).map(([k, v]) => (
                  <li key={k}>
                    <span className="font-mono text-aistroyka-text-tertiary">{k}</span>: {v}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <p className="text-sm font-semibold text-aistroyka-text-primary">{tDetail("trafficByRoute")}</p>
            <ul className="mt-2 max-h-40 overflow-y-auto text-sm font-mono space-y-1">
              {Object.entries(q.data.data.drilldown.by_route)
                .sort((a, b) => b[1] - a[1])
                .map(([route, n]) => (
                  <li key={route}>
                    {n}× {route}
                  </li>
                ))}
            </ul>
            {Object.keys(q.data.data.drilldown.by_route).length === 0 && (
              <p className="text-sm text-aistroyka-text-tertiary">{tDetail("noAiRuntimeAuditRows")}</p>
            )}
          </Card>

          <Card>
            <p className="text-sm font-semibold text-aistroyka-text-primary">{tDetail("recentErrorsSample")}</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-aistroyka-border-subtle text-aistroyka-caption">
                    <th className="py-2 pr-2">{tDetail("time")}</th>
                    <th className="py-2 pr-2">{tDetail("action")}</th>
                    <th className="py-2 pr-2">{tDetail("kind")}</th>
                    <th className="py-2">{tDetail("trace")}</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.data.aggregates.recent_error_sample.map((row, i) => (
                    <tr key={i} className="border-b border-aistroyka-border-subtle/60">
                      <td className="py-2 pr-2 whitespace-nowrap text-xs">{row.at.slice(0, 19)}</td>
                      <td className="py-2 pr-2 font-mono text-xs">{row.action}</td>
                      <td className="py-2 pr-2">{row.error_kind ?? "—"}</td>
                      <td className="py-2">
                        {row.trace_id ? <RequestIdPill requestId={row.trace_id} /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {q.data.data.aggregates.recent_error_sample.length === 0 && (
                <p className="text-sm text-aistroyka-text-tertiary py-2">{tDetail("noSampledErrors")}</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
