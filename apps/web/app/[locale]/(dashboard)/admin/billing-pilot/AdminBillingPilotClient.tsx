"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, SectionHeader, EmptyState } from "@/components/ui";
import type { BillingPilotWorkspaceSummary } from "@/lib/platform/billing-readiness/billing-pilot-ops.types";

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
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setDiagnostics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
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
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setActionResult(`Processed: ${data.processed}, Failed: ${data.failed}, Noop: ${data.noop}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
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
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setActionResult("Workspace added to pilot");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
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
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setActionResult("Workspace removed from pilot");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="mb-aistroyka-8">
        <SectionHeader title={tPage("workspaceLookupTitle")} />
        <Card>
          <div className="flex flex-wrap gap-aistroyka-4">
            <input
              type="text"
              placeholder="Workspace UUID"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              className="flex-1 min-w-[200px] rounded border border-aistroyka-border-subtle px-aistroyka-3 py-aistroyka-2 text-aistroyka-subheadline"
            />
            <button
              type="button"
              onClick={() => lookupId && fetchDiagnostics(lookupId)}
              disabled={loading || !lookupId.trim()}
              className="rounded bg-aistroyka-accent px-aistroyka-4 py-aistroyka-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Lookup
            </button>
          </div>
          {error && <p className="mt-aistroyka-2 text-aistroyka-error text-sm">{error}</p>}
          {actionResult && <p className="mt-aistroyka-2 text-aistroyka-text-secondary text-sm">{actionResult}</p>}
        </Card>
      </section>

      {diagnostics && (
        <section className="mb-aistroyka-8">
          <SectionHeader title={tPage("workspaceDiagnosticsTitle")} />
          <Card>
            {diagnostics.executionStatus && (
              <div className="mb-aistroyka-4 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-aistroyka-4 py-aistroyka-3">
                <div className="flex flex-wrap items-center gap-aistroyka-2">
                  <span className="font-semibold text-aistroyka-text-primary">E2E stage:</span>
                  <code className="rounded bg-aistroyka-surface px-aistroyka-1 py-aistroyka-0.5 text-sm">
                    {diagnostics.executionStatus.stage}
                  </code>
                  {diagnostics.executionStatus.isSandbox && (
                    <span className="rounded bg-aistroyka-accent/20 px-aistroyka-1.5 py-aistroyka-0.5 text-xs font-medium text-aistroyka-accent">
                      Sandbox
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
                    Attention: {diagnostics.executionStatus.attentionReasons.join(", ")}
                  </p>
                )}
              </div>
            )}
            <dl className="grid grid-cols-1 gap-aistroyka-2 sm:grid-cols-2">
              <dt className="font-medium text-aistroyka-text-secondary">Mode</dt>
              <dd>{diagnostics.mode}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">Reason</dt>
              <dd>{diagnostics.reason}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">Live checkout</dt>
              <dd>{diagnostics.liveCheckoutEligible ? "Yes" : "No"}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">Webhook processing</dt>
              <dd>{diagnostics.webhookProcessingEligible ? "Yes" : "No"}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">Latest checkout</dt>
              <dd>{diagnostics.latestCheckout ? `${diagnostics.latestCheckout.status} (${diagnostics.latestCheckout.id.slice(0, 8)}…)` : "—"}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">Subscription</dt>
              <dd>{diagnostics.currentSubscription ? diagnostics.currentSubscription.status : "—"}</dd>
              <dt className="font-medium text-aistroyka-text-secondary">Event counts</dt>
              <dd>P: {diagnostics.eventCounts.pending} / Pr: {diagnostics.eventCounts.processed} / F: {diagnostics.eventCounts.failed} / S: {diagnostics.eventCounts.skipped}</dd>
              {diagnostics.lastFailureReason && (
                <>
                  <dt className="font-medium text-aistroyka-text-secondary">Last failure</dt>
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
                Reprocess events
              </button>
              {diagnostics.inPilotCohort ? (
                <button
                  type="button"
                  onClick={() => removeFromPilot(diagnostics.workspaceId)}
                  disabled={loading}
                  className="rounded border border-aistroyka-error px-aistroyka-3 py-aistroyka-1 text-sm text-aistroyka-error disabled:opacity-50"
                >
                  Remove from pilot
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => addToPilot(diagnostics.workspaceId)}
                  disabled={loading}
                  className="rounded border border-aistroyka-accent px-aistroyka-3 py-aistroyka-1 text-sm text-aistroyka-accent disabled:opacity-50"
                >
                  Add to pilot
                </button>
              )}
            </div>
          </Card>
        </section>
      )}

      <section>
        <SectionHeader title={tPage("pilotCohortTitle")} />
        {workspaces.length > 0 ? (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-aistroyka-subheadline">
                <thead>
                  <tr className="border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised">
                    <th className="table-cell font-semibold text-aistroyka-text-primary">Workspace ID</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">Source</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">Live</th>
                    <th className="table-cell font-semibold text-aistroyka-text-primary">Webhook</th>
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
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={<span className="text-2xl">📋</span>}
              title="No pilot workspaces"
              subtitle="Add via POST /api/v1/admin/billing/pilot-workspaces or BILLING_PILOT_WORKSPACE_IDS env."
            />
          </Card>
        )}
      </section>
    </>
  );
}
