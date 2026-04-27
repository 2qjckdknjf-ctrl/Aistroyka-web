"use client";

import { useState } from "react";
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
  const [hours, setHours] = useState(72);
  const q = useQuery({
    queryKey: ["admin-ai-runtime", tenantId, hours],
    queryFn: () => fetchAiRuntime(hours),
    enabled: !!tenantId,
  });

  if (!tenantId) return null;

  return (
    <section className="mt-8" aria-label="AI runtime routes and errors">
      <SectionHeader
        title="AI runtime (routes & failures)"
        subtitle="Tenant-scoped audit rollup. Use trace_id to match server logs. Not a full observability platform — focused drilldown."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-aistroyka-text-secondary">
          Window:
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="ml-2 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-sm"
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
              <p className="text-sm font-medium text-aistroyka-text-primary">No AI runtime events in this window</p>
              <p className="mt-1 text-sm text-aistroyka-text-secondary">
                Either the tenant had no copilot, intelligence, or vision calls, or the window is too narrow. Try{" "}
                <strong>7d</strong>, or confirm traffic after Step 8 audit wiring.
              </p>
            </Card>
          )}

          <Card>
            <p className="text-xs font-semibold uppercase text-aistroyka-text-tertiary">Release correlation</p>
            <p className="mt-1 font-mono text-sm">
              build_sha: {q.data.correlation.build_sha ?? "—"} · env: {q.data.correlation.app_env ?? "—"}
            </p>
            <p className="mt-2 text-xs text-aistroyka-text-secondary">
              If errors spike after deploy, compare this SHA to the previous release window.
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Completes (window)</p>
              <p className="text-2xl font-semibold">{q.data.data.drilldown.complete_count}</p>
            </Card>
            <Card>
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Errors (window)</p>
              <p className="text-2xl font-semibold text-aistroyka-error">{q.data.data.drilldown.error_count}</p>
            </Card>
            <Card>
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Error rate</p>
              <p className="text-2xl font-semibold">
                {q.data.data.drilldown.error_rate_window != null
                  ? `${(q.data.data.drilldown.error_rate_window * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </Card>
            <Card>
              <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Failure classes (hint)</p>
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
            <p className="text-sm font-semibold text-aistroyka-text-primary">Traffic by route</p>
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
              <p className="text-sm text-aistroyka-text-tertiary">No AI runtime audit rows in this window.</p>
            )}
          </Card>

          <Card>
            <p className="text-sm font-semibold text-aistroyka-text-primary">Recent errors (sample)</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-aistroyka-border-subtle text-aistroyka-caption">
                    <th className="py-2 pr-2">Time</th>
                    <th className="py-2 pr-2">Action</th>
                    <th className="py-2 pr-2">Kind</th>
                    <th className="py-2">Trace</th>
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
                <p className="text-sm text-aistroyka-text-tertiary py-2">No sampled errors.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
