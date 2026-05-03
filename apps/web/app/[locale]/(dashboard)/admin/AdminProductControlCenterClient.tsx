"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Card, Skeleton, EmptyState, Badge } from "@/components/ui";

type LeadRow = {
  id: string;
  status: string;
  created_at: string;
};

type AlertRow = {
  id: string;
  severity: string;
};

type AnomalyRow = {
  id: string;
  severity: string;
};

type JobRow = {
  id: string;
  status: string;
};

type AuditRow = {
  id: string;
  action: string;
};

type SloRow = {
  date: string;
  requests: number;
  errors: number;
  p95_latency_ms: number | null;
};

type ProductControlData = {
  leads: LeadRow[];
  alerts: AlertRow[];
  anomalies: AnomalyRow[];
  jobs: JobRow[];
  audit: AuditRow[];
  slo: SloRow[];
};

const EMPTY_DATA: ProductControlData = {
  leads: [],
  alerts: [],
  anomalies: [],
  jobs: [],
  audit: [],
  slo: [],
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export function AdminProductControlCenterClient() {
  const [data, setData] = useState<ProductControlData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [leadsRes, alertsRes, anomaliesRes, jobsRes, auditRes, sloRes] = await Promise.all([
          fetchJson<{ data?: LeadRow[] }>("/api/v1/admin/leads?limit=200"),
          fetchJson<{ data?: AlertRow[] }>("/api/v1/admin/alerts?resolved=false"),
          fetchJson<{ data?: AnomalyRow[] }>("/api/v1/admin/anomalies?resolved=false&range=30d"),
          fetchJson<{ data?: JobRow[] }>("/api/v1/admin/jobs?status=failed&limit=100"),
          fetchJson<{ data?: AuditRow[] }>("/api/v1/admin/audit-logs?range=7d"),
          fetchJson<{ data?: SloRow[] }>("/api/v1/admin/slo/overview?range=30d"),
        ]);

        if (cancelled) return;

        setData({
          leads: leadsRes.data ?? [],
          alerts: alertsRes.data ?? [],
          anomalies: anomaliesRes.data ?? [],
          jobs: jobsRes.data ?? [],
          audit: auditRes.data ?? [],
          slo: sloRes.data ?? [],
        });
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load control center.");
        setData(EMPTY_DATA);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const communicationBacklog = data.leads.filter((lead) => lead.status === "new" || lead.status === "reviewed").length;
    const newLeads = data.leads.filter((lead) => lead.status === "new").length;
    const criticalAlerts = data.alerts.filter((alert) => alert.severity === "critical").length;
    const highAnomalies = data.anomalies.filter((anomaly) => anomaly.severity === "high").length;

    const sloRequests = data.slo.reduce((sum, row) => sum + (row.requests ?? 0), 0);
    const sloErrors = data.slo.reduce((sum, row) => sum + (row.errors ?? 0), 0);
    const errorRate = sloRequests > 0 ? (sloErrors / sloRequests) * 100 : 0;
    const breachDays = new Set(
      data.slo
        .filter((row) => (row.errors ?? 0) > 0 || (row.p95_latency_ms ?? 0) > 2500)
        .map((row) => row.date)
    ).size;

    const communicationActions = new Set(["invite", "report_submit", "report_review", "task_assignment"]);
    const communicationEvents = data.audit.filter((row) => communicationActions.has(row.action)).length;

    return {
      communicationBacklog,
      newLeads,
      criticalAlerts,
      highAnomalies,
      failedJobs: data.jobs.length,
      openAlerts: data.alerts.length,
      activeAnomalies: data.anomalies.length,
      communicationEvents,
      breachDays,
      errorRate,
    };
  }, [data]);

  if (loading) {
    return (
      <Card>
        <Skeleton lines={8} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <EmptyState title="Control center unavailable" subtitle={error} icon={<span className="text-2xl">⚠️</span>} />
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Product Control Center</h2>
          <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
            Unified operations panel for clients, incidents, tests/quality, and communication.
          </p>
        </div>
        <Badge variant={metrics.communicationBacklog > 0 || metrics.criticalAlerts > 0 ? "warning" : "success"}>
          {metrics.communicationBacklog > 0 || metrics.criticalAlerts > 0 ? "attention needed" : "stable"}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle p-3">
          <p className="text-aistroyka-caption uppercase tracking-wide text-aistroyka-text-tertiary">Clients</p>
          <p className="mt-2 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{metrics.newLeads} new leads</p>
          <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
            Backlog for response: {metrics.communicationBacklog}
          </p>
          <div className="mt-3 flex gap-3">
            <Link href="/admin/leads" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              Open leads →
            </Link>
            <Link href="/admin/operator" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              Operator triage →
            </Link>
          </div>
        </div>

        <div className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle p-3">
          <p className="text-aistroyka-caption uppercase tracking-wide text-aistroyka-text-tertiary">Incidents & Errors</p>
          <p className="mt-2 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{metrics.openAlerts} open alerts</p>
          <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
            Critical alerts: {metrics.criticalAlerts} · High anomalies: {metrics.highAnomalies} · Failed jobs: {metrics.failedJobs}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/admin/system" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              System metrics →
            </Link>
            <Link href="/admin/jobs" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              Failed jobs →
            </Link>
            <Link href="/admin/operator" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              Incident actions →
            </Link>
          </div>
        </div>

        <div className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle p-3">
          <p className="text-aistroyka-caption uppercase tracking-wide text-aistroyka-text-tertiary">Tests & Quality Gates</p>
          <p className="mt-2 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{metrics.breachDays} SLO breach days</p>
          <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
            Rolling SLO error rate (30d): {metrics.errorRate.toFixed(2)}%
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/admin/trust" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              Trust dashboard →
            </Link>
            <Link href="/admin/governance" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              Governance audit →
            </Link>
            <Link href="/admin/operator" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              Test operations →
            </Link>
          </div>
        </div>

        <div className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle p-3">
          <p className="text-aistroyka-caption uppercase tracking-wide text-aistroyka-text-tertiary">Communication</p>
          <p className="mt-2 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{metrics.communicationEvents} events / 7d</p>
          <p className="mt-1 text-aistroyka-caption text-aistroyka-text-secondary">
            Invite, assignments, and report communication events.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/admin/leads" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              Client communications →
            </Link>
            <Link href="/admin/ai/requests" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              AI request explorer →
            </Link>
            <Link href="/admin/operator" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
              Operator commands →
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
