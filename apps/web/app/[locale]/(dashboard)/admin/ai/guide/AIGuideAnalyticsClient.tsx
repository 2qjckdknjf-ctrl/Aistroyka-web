"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Button } from "@/components/ui";

type AnalyticsResponse = {
  range: string;
  area: string;
  totals: {
    opens: number;
    asks: number;
    quickPrompts: number;
    actionClicks: number;
    engagementRate: number;
    completionRate: number;
  };
  byDay: Array<{
    date: string;
    opens: number;
    asks: number;
    quickPrompts: number;
    actionClicks: number;
  }>;
  byRole: Array<{ role: string; count: number }>;
  byLocale: Array<{ locale: string; count: number }>;
  byArea: Array<{ area: string; count: number }>;
  byRoleConversion: Array<{ role: string; asks: number; actionClicks: number; completionRate: number }>;
  topActions: Array<{ key: string; href: string; count: number }>;
};

const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];
const AREA_OPTIONS = ["all", "dashboard", "projects", "reports", "ai", "other"] as const;
type Area = (typeof AREA_OPTIONS)[number];

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-aistroyka-caption text-aistroyka-text-secondary">{title}</p>
      <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{value}</p>
    </Card>
  );
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded bg-aistroyka-surface-muted">
      <div className="h-2 rounded bg-aistroyka-accent" style={{ width: `${width}%` }} />
    </div>
  );
}

export function AIGuideAnalyticsClient() {
  const [range, setRange] = useState<Range>("7d");
  const [area, setArea] = useState<Area>("all");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/v1/admin/analytics/ai-guide?range=${range}&area=${area}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Failed to load AI Guide analytics");
        }
        return (await res.json()) as AnalyticsResponse;
      })
      .then((payload) => {
        if (!alive) return;
        setData(payload);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Unknown analytics error");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [area, range]);

  const maxDayTotal = useMemo(() => {
    if (!data?.byDay.length) return 0;
    return Math.max(...data.byDay.map((d) => d.opens + d.asks + d.quickPrompts + d.actionClicks));
  }, [data?.byDay]);

  const maxRoleCount = useMemo(() => {
    if (!data?.byRole.length) return 0;
    return Math.max(...data.byRole.map((r) => r.count));
  }, [data?.byRole]);

  const maxLocaleCount = useMemo(() => {
    if (!data?.byLocale.length) return 0;
    return Math.max(...data.byLocale.map((l) => l.count));
  }, [data?.byLocale]);

  const maxAreaCount = useMemo(() => {
    if (!data?.byArea.length) return 0;
    return Math.max(...data.byArea.map((a) => a.count));
  }, [data?.byArea]);

  function downloadCsv() {
    if (!data) return;

    const lines: string[] = [];
    lines.push(["section", "key", "value", "extra_1", "extra_2", "extra_3"].join(","));
    lines.push(["totals", "opens", String(data.totals.opens), "", "", ""].join(","));
    lines.push(["totals", "asks", String(data.totals.asks), "", "", ""].join(","));
    lines.push(["totals", "quick_prompts", String(data.totals.quickPrompts), "", "", ""].join(","));
    lines.push(["totals", "action_clicks", String(data.totals.actionClicks), "", "", ""].join(","));
    lines.push(["totals", "engagement_rate", String(data.totals.engagementRate), "", "", ""].join(","));
    lines.push(["totals", "completion_rate", String(data.totals.completionRate), "", "", ""].join(","));

    for (const row of data.byDay) {
      lines.push([
        "by_day",
        row.date,
        String(row.opens + row.asks + row.quickPrompts + row.actionClicks),
        String(row.opens),
        String(row.asks),
        String(row.actionClicks),
      ].join(","));
    }

    for (const row of data.byRoleConversion) {
      lines.push([
        "role_conversion",
        row.role,
        String(row.completionRate),
        String(row.asks),
        String(row.actionClicks),
        "",
      ].join(","));
    }

    for (const row of data.topActions) {
      const safeHref = `"${row.href.replaceAll("\"", "\"\"")}"`;
      lines.push(["top_action", row.key, String(row.count), safeHref, "", ""].join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ai-guide-analytics-${range}-${area}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <section className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-aistroyka-subheadline text-aistroyka-text-secondary">Range:</span>
          {RANGES.map((r) => (
            <Button key={r} variant={r === range ? "primary" : "secondary"} size="sm" onClick={() => setRange(r)}>
              {r}
            </Button>
          ))}
          <span className="ml-2 text-aistroyka-subheadline text-aistroyka-text-secondary">Area:</span>
          {AREA_OPTIONS.map((item) => (
            <Button key={item} variant={item === area ? "primary" : "secondary"} size="sm" onClick={() => setArea(item)}>
              {item}
            </Button>
          ))}
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={downloadCsv}>
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {loading ? <Card className="p-4 text-aistroyka-text-secondary">Loading analytics...</Card> : null}
      {error ? <Card className="border-aistroyka-danger/40 p-4 text-aistroyka-danger">{error}</Card> : null}

      {data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi title="Opens" value={data.totals.opens} />
            <Kpi title="Asks" value={data.totals.asks} />
            <Kpi title="Quick prompts" value={data.totals.quickPrompts} />
            <Kpi title="Action clicks" value={data.totals.actionClicks} />
            <Kpi title="Engagement rate" value={`${data.totals.engagementRate}%`} />
            <Kpi title="Completion rate" value={`${data.totals.completionRate}%`} />
          </section>

          <Card className="p-4">
            <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">Daily trend</h2>
            <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
              Total interactions per day in {data.range} ({data.area}).
            </p>
            <div className="mt-4 space-y-3">
              {data.byDay.length === 0 ? (
                <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">No telemetry events in this range.</p>
              ) : (
                data.byDay.map((row) => {
                  const total = row.opens + row.asks + row.quickPrompts + row.actionClicks;
                  return (
                    <div key={row.date} className="space-y-1">
                      <div className="flex items-center justify-between text-aistroyka-caption">
                        <span className="text-aistroyka-text-secondary">{row.date}</span>
                        <span className="font-medium text-aistroyka-text-primary">
                          {total} total ({row.opens} open / {row.asks} ask / {row.quickPrompts} prompt / {row.actionClicks} click)
                        </span>
                      </div>
                      <MiniBar value={total} max={maxDayTotal} />
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">By role</h2>
              <div className="mt-4 space-y-3">
                {data.byRole.length === 0 ? (
                  <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">No role data yet.</p>
                ) : (
                  data.byRole.map((row) => (
                    <div key={row.role} className="space-y-1">
                      <div className="flex items-center justify-between text-aistroyka-caption">
                        <span className="uppercase tracking-wide text-aistroyka-text-secondary">{row.role}</span>
                        <span className="font-medium text-aistroyka-text-primary">{row.count}</span>
                      </div>
                      <MiniBar value={row.count} max={maxRoleCount} />
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">By locale</h2>
              <div className="mt-4 space-y-3">
                {data.byLocale.length === 0 ? (
                  <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">No locale data yet.</p>
                ) : (
                  data.byLocale.map((row) => (
                    <div key={row.locale} className="space-y-1">
                      <div className="flex items-center justify-between text-aistroyka-caption">
                        <span className="uppercase tracking-wide text-aistroyka-text-secondary">{row.locale}</span>
                        <span className="font-medium text-aistroyka-text-primary">{row.count}</span>
                      </div>
                      <MiniBar value={row.count} max={maxLocaleCount} />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">By module area</h2>
              <div className="mt-4 space-y-3">
                {data.byArea.length === 0 ? (
                  <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">No module data yet.</p>
                ) : (
                  data.byArea.map((row) => (
                    <div key={row.area} className="space-y-1">
                      <div className="flex items-center justify-between text-aistroyka-caption">
                        <span className="uppercase tracking-wide text-aistroyka-text-secondary">{row.area}</span>
                        <span className="font-medium text-aistroyka-text-primary">{row.count}</span>
                      </div>
                      <MiniBar value={row.count} max={maxAreaCount} />
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">Ask to Click conversion by role</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[440px] text-left">
                  <thead>
                    <tr className="border-b border-aistroyka-border-subtle text-aistroyka-caption text-aistroyka-text-secondary">
                      <th className="px-2 py-2">Role</th>
                      <th className="px-2 py-2 text-right">Asks</th>
                      <th className="px-2 py-2 text-right">Clicks</th>
                      <th className="px-2 py-2 text-right">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byRoleConversion.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
                          No conversion data yet.
                        </td>
                      </tr>
                    ) : (
                      data.byRoleConversion.map((row) => (
                        <tr key={row.role} className="border-b border-aistroyka-border-subtle/60">
                          <td className="px-2 py-2 font-medium text-aistroyka-text-primary">{row.role}</td>
                          <td className="px-2 py-2 text-right text-aistroyka-text-secondary">{row.asks}</td>
                          <td className="px-2 py-2 text-right text-aistroyka-text-secondary">{row.actionClicks}</td>
                          <td className="px-2 py-2 text-right font-semibold text-aistroyka-text-primary">{row.completionRate}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <Card className="p-4">
            <h2 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">Top actions</h2>
            <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
              Most clicked recommendations and risk signals.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-aistroyka-border-subtle text-aistroyka-caption text-aistroyka-text-secondary">
                    <th className="px-2 py-2">Action</th>
                    <th className="px-2 py-2">Href</th>
                    <th className="px-2 py-2 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topActions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-2 py-4 text-aistroyka-subheadline text-aistroyka-text-secondary">
                        No clicked actions in this range.
                      </td>
                    </tr>
                  ) : (
                    data.topActions.map((row) => (
                      <tr key={`${row.key}-${row.href}`} className="border-b border-aistroyka-border-subtle/60">
                        <td className="px-2 py-2 font-medium text-aistroyka-text-primary">{row.key}</td>
                        <td className="px-2 py-2 text-aistroyka-text-secondary">{row.href}</td>
                        <td className="px-2 py-2 text-right font-semibold text-aistroyka-text-primary">{row.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </section>
  );
}

