"use client";

import { useState, useMemo, useEffect } from "react";
import { QueryBoundary } from "@/lib/query/render";
import { SectionHeader } from "@/components/ui";
import { AdminKpiCard } from "@/src/features/admin/components/AdminKpiCard";
import { AdminTable } from "@/src/features/admin/components/AdminTable";
import { RequestIdPill } from "@/src/features/admin/components/RequestIdPill";
import { useAdminTenants } from "@/src/features/admin/ai/api/useAdminTenants";
import { useAiUsageSummary } from "@/src/features/admin/ai/api/useAiUsageSummary";
import { useAiBreakerState } from "@/src/features/admin/ai/api/useAiBreakerState";
import { useRecentIssues } from "@/src/features/admin/ai/api/useRecentIssues";
import type { RecentIssueRow } from "@/src/features/admin/ai/api/adminAiApi";

function todayRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function AdminAiOverviewClient() {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const tenantsQuery = useAdminTenants();
  const range = useMemo(() => todayRange(), []);
  const tenants = tenantsQuery.data ?? [];

  useEffect(() => {
    if (tenants.length > 0 && selectedTenantId === null) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [tenants, selectedTenantId]);

  const tenantId = selectedTenantId ?? tenants[0]?.id ?? null;
  const usageQuery = useAiUsageSummary(tenantId, range);
  const breakerQuery = useAiBreakerState();
  const issuesQuery = useRecentIssues(tenantId, 20);

  return (
    <>
      <QueryBoundary
        query={tenantsQuery}
        emptyCondition={(d) => !d?.length}
        emptyTitle="No admin tenants"
        emptySubtitle="You must be owner or admin of at least one tenant to view AI observability."
      >
        {() => (
          <section className="mb-6">
            {tenants.length > 1 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-aistroyka-subheadline text-aistroyka-text-secondary">Tenant:</span>
                <select
                  value={tenantId ?? ""}
                  onChange={(e) => setSelectedTenantId(e.target.value || null)}
                  className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-aistroyka-subheadline"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name ?? t.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </section>
        )}
      </QueryBoundary>

      {tenantId ? (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QueryBoundary query={usageQuery} emptyCondition={(d) => d == null}>
              {(usage) => (
                <>
                  <AdminKpiCard title="Requests today" value={usage.requests} />
                  <AdminKpiCard
                    title="Error rate today"
                    value={usage.requests > 0 ? `${(usage.error_rate * 100).toFixed(1)}%` : "—"}
                    variant={usage.error_rate > 0.1 ? "error" : "default"}
                  />
                  <AdminKpiCard
                    title="p95 latency (ms)"
                    value={usage.p95_ms ?? "—"}
                  />
                </>
              )}
            </QueryBoundary>
            <QueryBoundary query={breakerQuery} emptyCondition={(d) => !Array.isArray(d)}>
              {(breakers) => {
                const copilot = breakers.find((b) => b.key === "copilot");
                const state = copilot?.state ?? "—";
                return (
                  <AdminKpiCard
                    title="Breaker state"
                    value={state}
                    variant={state === "open" ? "error" : state === "half_open" ? "warning" : "default"}
                  />
                );
              }}
            </QueryBoundary>
            <QueryBoundary query={usageQuery} emptyCondition={(d) => d == null}>
              {(usage) => (
                <AdminKpiCard
                  title="Low-confidence rate (retrieval)"
                  value={
                    usage.retrieval_low_confidence_rate != null
                      ? `${(usage.retrieval_low_confidence_rate * 100).toFixed(1)}%`
                      : "—"
                  }
                />
              )}
            </QueryBoundary>
            <QueryBoundary query={usageQuery} emptyCondition={(d) => d == null}>
              {(usage) => (
                <AdminKpiCard
                  title="Budget exceeded (today)"
                  value={usage.budget_exceeded_count}
                  variant={usage.budget_exceeded_count > 0 ? "warning" : "default"}
                />
              )}
            </QueryBoundary>
          </section>

          <section>
            <SectionHeader title="Top recent issues" />
            <QueryBoundary
              query={issuesQuery}
              emptyCondition={(d) => !d?.length}
              emptyTitle="No recent issues"
            >
              {(issues) => (
                <AdminTable<RecentIssueRow>
                  columns={[
                    { key: "timestamp", label: "Time" },
                    { key: "event_type", label: "Event" },
                    { key: "tenant_id", label: "Tenant" },
                    { key: "request_id", label: "Request ID" },
                  ]}
                  rows={issues}
                  keyFn={(r) => `${r.timestamp}-${r.event_type}-${r.request_id ?? ""}`}
                  renderCell={(row, col) => {
                    if (col === "timestamp") return new Date(row.timestamp).toLocaleString();
                    if (col === "event_type") return row.event_type;
                    if (col === "tenant_id") return row.tenant_id ? row.tenant_id.slice(0, 8) + "…" : "—";
                    if (col === "request_id") return row.request_id ? <RequestIdPill requestId={row.request_id} /> : "—";
                    return "—";
                  }}
                />
              )}
            </QueryBoundary>
          </section>
        </>
      ) : null}
    </>
  );
}
