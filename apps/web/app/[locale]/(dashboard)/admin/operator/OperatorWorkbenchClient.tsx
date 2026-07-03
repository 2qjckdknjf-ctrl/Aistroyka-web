"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button, Input, Badge, Skeleton, EmptyState } from "@/components/ui";

type AlertRow = {
  id: string;
  severity: string;
  type: string;
  message: string;
  created_at: string;
};

type AnomalyRow = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  metric: string;
  created_at: string;
};

type JobRow = {
  id: string;
  type: string;
  status: string;
  created_at: string;
  last_error: string;
};

type FlagRow = {
  key: string;
  description: string | null;
  rollout_percent: number | null;
  allowlist_tenant_ids: string[] | null;
};

type OperatorContext = {
  tenant_id: string;
  user_id: string | null;
  role: string;
};

type DiagnosticsResponse = {
  correlation?: {
    build_sha: string | null;
    build_time: string | null;
    app_env: string | null;
  };
  incident_hints?: string[] | null;
};

type SmokeCheck = {
  key: string;
  status: "pass" | "warn" | "fail";
  details: string;
};

type SmokeReport = {
  success: boolean;
  overall: "pass" | "warn" | "fail";
  checks: SmokeCheck[];
  generated_at: string;
};

type ActionLogEntry = {
  id: string;
  label: string;
  ok: boolean;
  details: string;
  createdAt: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : typeof payload?.message === "string"
          ? payload.message
          : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export function OperatorWorkbenchClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [context, setContext] = useState<OperatorContext | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [flags, setFlags] = useState<FlagRow[]>([]);

  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [smokeReport, setSmokeReport] = useState<SmokeReport | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);

  const [overrideFlagKey, setOverrideFlagKey] = useState("");
  const [overrideEnabled, setOverrideEnabled] = useState(true);
  const [overrideVariant, setOverrideVariant] = useState("");

  const addLog = useCallback((entry: Omit<ActionLogEntry, "id" | "createdAt">) => {
    const newEntry: ActionLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setActionLog((prev) => [newEntry, ...prev].slice(0, 20));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [contextRes, alertsRes, anomaliesRes, jobsRes, flagsRes] = await Promise.all([
        requestJson<{ data: OperatorContext }>("/api/v1/admin/operator/context"),
        requestJson<{ data?: AlertRow[] }>("/api/v1/admin/alerts?resolved=false"),
        requestJson<{ data?: AnomalyRow[] }>("/api/v1/admin/anomalies?resolved=false&range=30d"),
        requestJson<{ data?: JobRow[] }>("/api/v1/admin/jobs?status=failed&limit=50"),
        requestJson<{ data?: FlagRow[] }>("/api/v1/admin/flags"),
      ]);

      setContext(contextRes.data);
      setAlerts(alertsRes.data ?? []);
      setAnomalies(anomaliesRes.data ?? []);
      setJobs(jobsRes.data ?? []);
      setFlags(flagsRes.data ?? []);
      setOverrideFlagKey((prev) => prev || flagsRes.data?.[0]?.key || "");
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load operator workbench.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const runAction = useCallback(
    async (actionId: string, label: string, worker: () => Promise<string>) => {
      setRunningAction(actionId);
      try {
        const details = await worker();
        addLog({ label, ok: true, details });
      } catch (actionError) {
        const details = actionError instanceof Error ? actionError.message : "Unknown error";
        addLog({ label, ok: false, details });
      } finally {
        setRunningAction(null);
      }
    },
    [addLog]
  );

  const runDiagnosticsSnapshot = useCallback(async () => {
    await runAction("diagnostics", "Diagnostics snapshot", async () => {
      const payload = await requestJson<DiagnosticsResponse>("/api/v1/admin/ops/diagnostics?hours=24&limit=150");
      setDiagnostics(payload);
      const hints = payload.incident_hints?.length ?? 0;
      const build = payload.correlation?.build_sha ?? "n/a";
      return `Diagnostics loaded. Build ${build}. Incident hints: ${hints}.`;
    });
  }, [runAction]);

  const runSmokeSuite = useCallback(async () => {
    await runAction("smoke-suite", "Run operator smoke suite", async () => {
      const payload = await requestJson<SmokeReport>("/api/v1/admin/operator/smoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setSmokeReport(payload);
      const fail = payload.checks.filter((check) => check.status === "fail").length;
      const warn = payload.checks.filter((check) => check.status === "warn").length;
      return `Smoke suite ${payload.overall}. ${fail} fail, ${warn} warn checks.`;
    });
  }, [runAction]);

  const sendTestPush = useCallback(async () => {
    await runAction("push-test", "Send test push", async () => {
      const payload = await requestJson<{ outbox_id?: string }>("/api/v1/admin/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "job_done" }),
      });
      return `Push queued. Outbox id: ${payload.outbox_id ?? "n/a"}.`;
    });
  }, [runAction]);

  const resolveAlerts = useCallback(
    async (ids: string[], label: string) => {
      await runAction(`resolve-alerts-${label}`, `Resolve alerts (${label})`, async () => {
        if (ids.length === 0) throw new Error("No alerts selected.");
        const payload = await requestJson<{ updated: number }>("/api/v1/admin/alerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, resolved: true }),
        });
        setAlerts((prev) => prev.filter((alert) => !ids.includes(alert.id)));
        return `Resolved ${payload.updated ?? 0} alerts.`;
      });
    },
    [runAction]
  );

  const resolveAnomalies = useCallback(
    async (ids: string[], label: string) => {
      await runAction(`resolve-anomalies-${label}`, `Resolve anomalies (${label})`, async () => {
        if (ids.length === 0) throw new Error("No anomalies selected.");
        const payload = await requestJson<{ updated: number }>("/api/v1/admin/anomalies", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, resolved: true }),
        });
        setAnomalies((prev) => prev.filter((anomaly) => !ids.includes(anomaly.id)));
        return `Resolved ${payload.updated ?? 0} anomalies.`;
      });
    },
    [runAction]
  );

  const setTenantOverride = useCallback(async () => {
    await runAction("tenant-override", "Set tenant flag override", async () => {
      if (!context?.tenant_id) {
        throw new Error("Tenant context is missing.");
      }
      if (!overrideFlagKey.trim()) {
        throw new Error("Choose a flag first.");
      }
      await requestJson<{ success: boolean }>(`/api/v1/admin/tenants/${context.tenant_id}/flags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: overrideFlagKey.trim(),
          enabled: overrideEnabled,
          variant: overrideVariant.trim() || null,
        }),
      });
      return `Tenant override saved for ${overrideFlagKey}.`;
    });
  }, [context?.tenant_id, overrideEnabled, overrideFlagKey, overrideVariant, runAction]);

  if (loading) {
    return (
      <Card>
        <Skeleton lines={10} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <EmptyState title="Operator workbench unavailable" subtitle={error} icon={<span className="text-2xl">⚠️</span>} />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => void loadAll()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Operator command bridge</h2>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Tenant-scoped operations, diagnostics, and safe rollout overrides.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-3">
            <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Open alerts</p>
            <p className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{alerts.length}</p>
          </div>
          <div className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-3">
            <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Open anomalies</p>
            <p className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{anomalies.length}</p>
          </div>
          <div className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-3">
            <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Failed jobs</p>
            <p className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{jobs.length}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Operations & testing</h3>
        <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
          Tenant health checks only. Cross-tenant cron controls moved to platform admin.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => void runDiagnosticsSnapshot()}
            loading={runningAction === "diagnostics"}
            disabled={runningAction !== null}
          >
            Run diagnostics snapshot
          </Button>
          <Button
            variant="secondary"
            onClick={() => void runSmokeSuite()}
            loading={runningAction === "smoke-suite"}
            disabled={runningAction !== null}
          >
            Run smoke suite
          </Button>
          <Button
            variant="ghost"
            onClick={() => void sendTestPush()}
            loading={runningAction === "push-test"}
            disabled={runningAction !== null}
          >
            Send test push
          </Button>
        </div>
        {diagnostics ? (
          <div className="mt-4 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-3">
            <p className="text-aistroyka-caption text-aistroyka-text-tertiary">
              Build: {diagnostics.correlation?.build_sha ?? "n/a"} · env: {diagnostics.correlation?.app_env ?? "n/a"}
            </p>
            <ul className="mt-2 space-y-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
              {(diagnostics.incident_hints ?? []).length > 0 ? (
                (diagnostics.incident_hints ?? []).map((hint) => <li key={hint}>- {hint}</li>)
              ) : (
                <li>- No incident hints in current window.</li>
              )}
            </ul>
          </div>
        ) : null}
        {smokeReport ? (
          <div className="mt-4 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-3">
            <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
              Smoke suite: {smokeReport.overall}
            </p>
            <ul className="mt-2 space-y-1 text-aistroyka-caption text-aistroyka-text-secondary">
              {smokeReport.checks.map((check) => (
                <li key={check.key}>
                  - {check.key}: {check.status} — {check.details}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Incident resolution console</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => void resolveAlerts(alerts.filter((a) => a.severity === "critical").map((a) => a.id), "critical")}
            loading={runningAction === "resolve-alerts-critical"}
            disabled={runningAction !== null || alerts.filter((a) => a.severity === "critical").length === 0}
          >
            Resolve critical alerts
          </Button>
          <Button
            variant="secondary"
            onClick={() => void resolveAnomalies(anomalies.filter((a) => a.severity === "critical").map((a) => a.id), "critical")}
            loading={runningAction === "resolve-anomalies-critical"}
            disabled={runningAction !== null || anomalies.filter((a) => a.severity === "critical").length === 0}
          >
            Resolve critical anomalies
          </Button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-3">
            <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Recent alerts</p>
            <div className="mt-2 space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="rounded-[var(--aistroyka-radius-sm)] border border-aistroyka-border-subtle p-2">
                  <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                    {alert.severity} · {alert.type}
                  </p>
                  <p className="text-aistroyka-caption text-aistroyka-text-secondary">{alert.message}</p>
                  <Button
                    className="mt-2"
                    variant="ghost"
                    onClick={() =>
                      void runAction(`resolve-alert-${alert.id}`, `Resolve alert ${alert.id}`, async () => {
                        await requestJson<{ success: boolean }>(`/api/v1/admin/alerts/${alert.id}/resolve`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                        });
                        setAlerts((prev) => prev.filter((row) => row.id !== alert.id));
                        return "Alert resolved.";
                      })
                    }
                    loading={runningAction === `resolve-alert-${alert.id}`}
                    disabled={runningAction !== null}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-3">
            <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Recent anomalies</p>
            <div className="mt-2 space-y-2">
              {anomalies.slice(0, 5).map((anomaly) => (
                <div key={anomaly.id} className="rounded-[var(--aistroyka-radius-sm)] border border-aistroyka-border-subtle p-2">
                  <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">
                    {anomaly.severity} · {anomaly.type}
                  </p>
                  <p className="text-aistroyka-caption text-aistroyka-text-secondary">{anomaly.metric}</p>
                  <Button
                    className="mt-2"
                    variant="ghost"
                    onClick={() => void resolveAnomalies([anomaly.id], anomaly.id)}
                    loading={runningAction === `resolve-anomalies-${anomaly.id}`}
                    disabled={runningAction !== null}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Tenant feature overrides</h3>
        <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
          Global flag rollout is platform-admin only. Tenant admins may set overrides for the current tenant.
        </p>
        <div className="mt-3 max-w-md space-y-2 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-3">
          <p className="text-aistroyka-caption text-aistroyka-text-tertiary">Tenant override</p>
          <select
            value={overrideFlagKey}
            onChange={(event) => setOverrideFlagKey(event.target.value)}
            className="w-full rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-aistroyka-body"
            aria-label="Select flag for override"
          >
            {flags.map((flag) => (
              <option key={flag.key} value={flag.key}>
                {flag.key}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
            <input
              type="checkbox"
              checked={overrideEnabled}
              onChange={(event) => setOverrideEnabled(event.target.checked)}
            />
            Enabled for current tenant
          </label>
          <Input
            value={overrideVariant}
            onChange={(event) => setOverrideVariant(event.target.value)}
            placeholder="Optional variant"
            aria-label="Override variant"
          />
          <Button
            variant="secondary"
            onClick={() => void setTenantOverride()}
            loading={runningAction === "tenant-override"}
            disabled={runningAction !== null}
          >
            Apply tenant override
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">Operator action log</h3>
        {actionLog.length === 0 ? (
          <p className="mt-2 text-aistroyka-caption text-aistroyka-text-secondary">No actions executed in this session.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {actionLog.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-2"
              >
                <div>
                  <p className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{entry.label}</p>
                  <p className="text-aistroyka-caption text-aistroyka-text-secondary">{entry.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={entry.ok ? "success" : "danger"}>{entry.ok ? "ok" : "failed"}</Badge>
                  <span className="text-aistroyka-caption text-aistroyka-text-tertiary">
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
