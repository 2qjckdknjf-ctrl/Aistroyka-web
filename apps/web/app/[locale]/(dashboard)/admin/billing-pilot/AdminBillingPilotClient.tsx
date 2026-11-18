"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHeader, EmptyState } from "@/components/ui";
import type { BillingPilotWorkspaceSummary } from "@/lib/platform/billing-readiness/billing-pilot-ops.types";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type WorkspaceDiagnostics = {
  workspaceId: string;
  inPilotCohort: boolean;
  liveCheckoutEligible: boolean;
  webhookProcessingEligible: boolean;
  mode: string;
  reason: string;
  latestCheckout: { id: string; status: string } | null;
  currentSubscription: { status: string } | null;
  eventCounts: { pending: number; processed: number; failed: number; skipped: number };
  lastFailureReason: string | null;
  executionStatus?: {
    stage: string;
    suggestedOperatorAction: string;
    suggestedOperatorHint: string | null;
    attentionReasons: string[];
    isSandbox: boolean;
  };
  operatorActions?: string[];
};

export function AdminBillingPilotClient({
  initialWorkspaces,
}: {
  initialWorkspaces: BillingPilotWorkspaceSummary[];
}) {
  const tPage = useTranslations("dashboardPageMeta");
  const tDetail = useTranslations("dashboardDetail");
  const [workspaces] = useState(initialWorkspaces);
  const [lookupId, setLookupId] = useState("");
  const [diagnostics, setDiagnostics] = useState<WorkspaceDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);

  async function fetchDiagnostics(workspaceId: string) {
    setLoading(true);
    setError(null);
    setDiagnostics(null);
    try {
      const res = await fetch(`/api/v1/admin/billing/workspace-status?workspaceId=${encodeURIComponent(workspaceId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? tDetail("failedToFetch"));
      setDiagnostics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : tDetail("unknownError"));
    } finally {
      setLoading(false);
    }
  }

  async function reprocessWorkspaceEvents(workspaceId: string) {
    setLoading(true);
    setError(null);
    setActionResult(null);
    try {
      const res = await fetch("/api/v1/admin/billing/reprocess-workspace-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? tDetail("failed"));
      setActionResult(`${tDetail("processed")}: ${data.processed}, ${tDetail("failed")}: ${data.failed}, ${tDetail("noop")}: ${data.noop}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : tDetail("unknownError"));
    } finally {
      setLoading(false);
    }
  }

  async function addToPilot(workspaceId: string) {
    setLoading(true);
    setError(null);
    setActionResult(null);
    try {
      const res = await fetch("/api/v1/admin/billing/pilot-workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? tDetail("failed"));
      setActionResult(tDetail("workspaceAddedToPilot"));
    } catch (e) {
      setError(e instanceof Error ? e.message : tDetail("unknownError"));
    } finally {
      setLoading(false);
    }
  }

  async function removeFromPilot(workspaceId: string) {
    setLoading(true);
    setError(null);
    setActionResult(null);
    try {
      const res = await fetch(`/api/v1/admin/billing/pilot-workspaces/${workspaceId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? tDetail("failed"));
      setActionResult(tDetail("workspaceRemovedFromPilot"));
    } catch (e) {
      setError(e instanceof Error ? e.message : tDetail("unknownError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="mb-aistroyka-8">
        <SectionHeader title={tPage("workspaceLookupTitle")} />
        <DashboardGlassCard>
          <div className="flex flex-wrap gap-aistroyka-4">
            <input
              type="text"
              placeholder={tDetail("workspaceUuid")}
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              className="flex-1 min-w-[200px] rounded border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2 text-aistroyka-subheadline"
            />
            <button
              type="button"
              onClick={() => lookupId && fetchDiagnostics(lookupId)}
              disabled={loading || !lookupId.trim()}
              className="rounded bg-aistroyka-accent px-aistroyka-4 py-aistroyka-2 text-sm font-medium text-aistroyka-text-inverse disabled:opacity-50"
            >
              {tDetail("lookup")}
            </button>
          </div>
          {error && <p className="mt-aistroyka-2 text-aistroyka-error text-sm">{error}</p>}
          {actionResult && <p className="mt-aistroyka-2 text-aistroyka-text-secondary text-sm">{actionResult}</p>}
        </DashboardGlassCard>
      </section>

      {diagnostics && (
        <section className="mb-aistroyka-8">
          <SectionHeader title={tPage("workspaceDiagnosticsTitle")} />
          <DashboardGlassCard>
            {diagnostics.executionStatus && (
              <div className="mb-aistroyka-4 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-3">
                <div className="flex flex-wrap items-center gap-aistroyka-2">
                  <span className="font-semibold text-aistroyka-text-primary">{tDetail("e2eStage")}:</span>
                  <code className="rounded bg-aistroyka-surface px-aistroyka-1 py-aistroyka-0.5 text-sm">
                    {diagnostics.executionStatus.stage}
                  </code>
                  {diagnostics.executionStatus.isSandbox && (
                    <span className="rounded bg-aistroyka-accent/20 px-aistroyka-1.5 py-aistroyka-0.5 text-xs font-medium text-aistroyka-accent">
                      {tDetail("sandbox")}
                    </span>
                  )}
                </div>
                {diagnostics.executionStatus.suggestedOperatorHint && (
                  <p className="mt-aistroyka-1 text-sm text-aistroyka-text-secondary">
                    → {diagnostics.executionStatus.suggestedOperatorHint}
                  </p>
                )}
                {diagnostics.executionStatus.attentionReasons.length > 0 && (
                  <p className="mt-aistroyka-1 text-sm text-aistroyka-error">
                    {tDetail("attention")}: {diagnostics.executionStatus.attentionReasons.join(", ")}
                  </p>
                )}
              </div>
            )}
            <dl className="grid grid-cols-1 gap-aistroyka-2 sm:grid-cols-2">
              <dt className="font-medium text-aistroyka-text-secondary">{tDetail("mode")}</dt>
              <dd>{diagnostics.mode}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">{tDetail("reason")}</dt>
              <dd>{diagnostics.reason}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">{tDetail("liveCheckout")}</dt>
              <dd>{diagnostics.liveCheckoutEligible ? tDetail("yes") : tDetail("no")}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">{tDetail("webhookProcessing")}</dt>
              <dd>{diagnostics.webhookProcessingEligible ? tDetail("yes") : tDetail("no")}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">{tDetail("latestCheckout")}</dt>
              <dd>{diagnostics.latestCheckout ? `${diagnostics.latestCheckout.status} (${diagnostics.latestCheckout.id.slice(0, 8)}…)` : "—"}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">{tDetail("subscription")}</dt>
              <dd>{diagnostics.currentSubscription ? diagnostics.currentSubscription.status : "—"}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">{tDetail("eventCounts")}</dt>
              <dd>P: {diagnostics.eventCounts.pending} / Pr: {diagnostics.eventCounts.processed} / F: {diagnostics.eventCounts.failed} / S: {diagnostics.eventCounts.skipped}</dd>
              {diagnostics.lastFailureReason && (
                <>
                  <dt className="font-medium text-aistroyka-text-secondary">{tDetail("lastFailure")}</dt>
                  <dd className="text-aistroyka-error text-sm">{diagnostics.lastFailureReason}</dd>
                </>
              )}
            </dl>
            <div className="mt-aistroyka-4 flex flex-wrap gap-aistroyka-2">
              <button
                type="button"
                onClick={() => reprocessWorkspaceEvents(diagnostics.workspaceId)}
                disabled={loading}
                className="rounded border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-1 text-sm disabled:opacity-50"
              >
                {tDetail("reprocessEvents")}
              </button>
              {diagnostics.inPilotCohort ? (
                <button
                  type="button"
                  onClick={() => removeFromPilot(diagnostics.workspaceId)}
                  disabled={loading}
                  className="rounded border border-aistroyka-error px-aistroyka-3 py-aistroyka-1 text-sm text-aistroyka-error disabled:opacity-50"
                >
                  {tDetail("removeFromPilot")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => addToPilot(diagnostics.workspaceId)}
                  disabled={loading}
                  className="rounded border border-aistroyka-accent px-aistroyka-3 py-aistroyka-1 text-sm text-aistroyka-accent disabled:opacity-50"
                >
                  {tDetail("addToPilot")}
                </button>
              )}
            </div>
          </DashboardGlassCard>
        </section>
      )}

      <section>
        <SectionHeader title={tPage("pilotCohortTitle")} />
        {workspaces.length > 0 ? (
          <DashboardGlassCard contentClassName="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-aistroyka-subheadline">
                <thead>
                  <tr className="border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised">
                    <th className="table-cell font-semibold text-aistroyka-text-primary">{tDetail("workspaceId")}</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">{tDetail("source")}</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">{tDetail("live")}</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">{tDetail("webhook")}</th>
                  </tr>
                </thead>
                <tbody>
                  {workspaces.map((w) => (
                    <tr key={w.workspaceId} className="border-b border-aistroyka-border-subtle last:border-0">
                      <td className="table-cell font-mono text-aistroyka-text-secondary">{w.workspaceId.slice(0, 8)}…</td>
                      <td className="table-cell">{w.source}</td>
                      <td className="table-cell">{w.liveCheckoutEnabled ? "✓" : "—"}</td>
                      <td className="table-cell">{w.webhookProcessingEnabled ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardGlassCard>
        ) : (
          <DashboardGlassCard>
            <EmptyState
              icon={<span className="text-2xl">📋</span>}
              title={tDetail("noPilotWorkspaces")}
              subtitle={tDetail("addPilotWorkspacesHint")}
            />
          </DashboardGlassCard>
        )}
      </section>
    </>
  );
}
