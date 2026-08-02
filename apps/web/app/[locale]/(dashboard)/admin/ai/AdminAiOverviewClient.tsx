"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { QueryBoundary } from "@/lib/query/render";
import { SectionHeader } from "@/components/ui";
import { AdminKpiCard } from "@/src/features/admin/components/AdminKpiCard";
import { AdminTable } from "@/src/features/admin/components/AdminTable";
import { RequestIdPill } from "@/src/features/admin/components/RequestIdPill";
import { useAiUsageSummary } from "@/src/features/admin/ai/api/useAiUsageSummary";
import { useAiBreakerState } from "@/src/features/admin/ai/api/useAiBreakerState";
import { useRecentIssues } from "@/src/features/admin/ai/api/useRecentIssues";
import type { RecentIssueRow } from "@/src/features/admin/ai/api/adminAiApi";
import { AdminAiRuntimePanel } from "./AdminAiRuntimePanel";

function todayRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function AdminAiOverviewClient({
  activeTenantId,
}: {
  /** Active workspace — AI reads are locked to this tenant (no cross-membership picker). */
  activeTenantId: string | null;
}) {
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const range = useMemo(() => todayRange(), []);
  const tenantId = activeTenantId;
  const usageQuery = useAiUsageSummary(tenantId, range);
  const breakerQuery = useAiBreakerState();
  const issuesQuery = useRecentIssues(tenantId, 20);

  if (!tenantId) {
    return (
      <section className="mb-6" role="status" aria-live="polite">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          {tDetail("needAdminTenantForObservability")}
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QueryBoundary query={usageQuery} emptyCondition={(d) => d == null}>
          {(usage) => (
            <>
              <AdminKpiCard title={tDetail("requestsToday")} value={usage.requests} />
              <AdminKpiCard
                title={tDetail("errorRateToday")}
                value={usage.requests > 0 ? `${(usage.error_rate * 100).toFixed(1)}%` : "—"}
                variant={usage.error_rate > 0.1 ? "error" : "default"}
              />
              <AdminKpiCard title={tDetail("p95LatencyMs")} value={usage.p95_ms ?? "—"} />
              <AdminKpiCard
                title={tDetail("memoryUsedRate")}
                value={
                  usage.memory_used_rate != null
                    ? `${(usage.memory_used_rate * 100).toFixed(1)}%`
                    : "—"
                }
              />
              <AdminKpiCard
                title={tDetail("memorySummaryRate")}
                value={
                  usage.memory_summary_used_rate != null
                    ? `${(usage.memory_summary_used_rate * 100).toFixed(1)}%`
                    : "—"
                }
              />
              <AdminKpiCard
                title={tDetail("summariesStaleThreads")}
                value={usage.summaries_freshness_stale_count ?? 0}
                variant={(usage.summaries_freshness_stale_count ?? 0) > 0 ? "warning" : "default"}
              />
              <AdminKpiCard
                title={tDetail("lowConfidenceRateRetrieval")}
                value={
                  usage.retrieval_low_confidence_rate != null
                    ? `${(usage.retrieval_low_confidence_rate * 100).toFixed(1)}%`
                    : "—"
                }
              />
              <AdminKpiCard
                title={tDetail("budgetExceededToday")}
                value={usage.budget_exceeded_count}
                variant={usage.budget_exceeded_count > 0 ? "warning" : "default"}
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
                title={tDetail("breakerState")}
                value={state}
                variant={state === "open" ? "error" : state === "half_open" ? "warning" : "default"}
              />
            );
          }}
        </QueryBoundary>
      </section>

      <section>
        <SectionHeader title={tPage("topRecentIssuesTitle")} />
        <QueryBoundary
          query={issuesQuery}
          emptyCondition={(d) => !d?.length}
          emptyTitle={tDetail("noRecentIssues")}
        >
          {(issues) => (
            <AdminTable<RecentIssueRow>
              columns={[
                { key: "timestamp", label: tDetail("time") },
                { key: "event_type", label: tDetail("event") },
                { key: "tenant_id", label: tDetail("tenant") },
                { key: "request_id", label: tDetail("requestId") },
              ]}
              rows={issues}
              keyFn={(r) => `${r.timestamp}-${r.event_type}-${r.request_id ?? ""}`}
              renderCell={(row, col) => {
                if (col === "timestamp") return new Date(row.timestamp).toLocaleString();
                if (col === "event_type") return row.event_type;
                if (col === "tenant_id") return row.tenant_id ? row.tenant_id.slice(0, 8) + "…" : "—";
                if (col === "request_id")
                  return row.request_id ? <RequestIdPill requestId={row.request_id} /> : "—";
                return "—";
              }}
            />
          )}
        </QueryBoundary>
      </section>

      <AdminAiRuntimePanel tenantId={tenantId} />
    </>
  );
}
