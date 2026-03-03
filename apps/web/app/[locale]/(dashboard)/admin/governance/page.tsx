import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, SectionHeader, EmptyState, SkeletonCard } from "@/components/ui";
import { GovernanceAlerts } from "./GovernanceAlerts";
import { AuditTimeline } from "./AuditTimeline";
import { ThresholdHistory } from "./ThresholdHistory";
import { CurrentCalibration } from "./CurrentCalibration";

export const dynamic = "force-dynamic";

type GovernanceEvent = {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  scope: string;
  calibration_version: string | null;
  evidence: Record<string, unknown>;
  summary: string | null;
  is_acknowledged: boolean;
};

type ThresholdHistoryRow = {
  id: string;
  created_at: string;
  calibration_version: string;
  thresholds: Record<string, number>;
  thresholds_smoothed: Record<string, number>;
  smoothing_alpha: number | null;
  delta_stats: Record<string, { absolute: number; relative: number }>;
};

export default async function AIGovernancePage() {
  const supabase = await createClient();

  const [eventsRes, historyRes, latestCalRes] = await Promise.all([
    supabase
      .from("ai_governance_events")
      .select("id, created_at, event_type, severity, scope, calibration_version, evidence, summary, is_acknowledged")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("ai_threshold_history")
      .select("id, created_at, calibration_version, thresholds, thresholds_smoothed, smoothing_alpha, delta_stats")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("ai_threshold_history")
      .select("created_at, calibration_version, thresholds_smoothed, smoothing_alpha")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const events = (eventsRes.data ?? []) as GovernanceEvent[];
  const history = (historyRes.data ?? []) as ThresholdHistoryRow[];
  const latestCal = latestCalRes.data as ThresholdHistoryRow | null;

  return (
    <main
      id="ai_governance_dashboard"
      className="mx-auto max-w-4xl px-aistroyka-4 py-aistroyka-8"
      aria-label="AI Governance and Audit"
    >
      <Link
        href="/admin"
        className="mb-aistroyka-6 inline-block text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent"
      >
        ← Admin
      </Link>
      <div className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent pl-aistroyka-4">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          AI Governance
        </h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Calibration, regime detection, drift alerts, and audit timeline. No PII.
        </p>
      </div>

      <section className="mb-aistroyka-8">
        <CurrentCalibration latest={latestCal} />
      </section>

      <section id="ai_governance_alerts" className="mb-aistroyka-8">
        <h2 id="alerts-heading" className="mb-aistroyka-2 text-[var(--aistroyka-font-title3)] font-semibold text-aistroyka-text-primary">Active Alerts</h2>
        <GovernanceAlerts events={events.filter((e) => !e.is_acknowledged)} />
      </section>

      <section className="mb-aistroyka-8">
        <SectionHeader title="Audit Timeline (last 90 days)" />
        <AuditTimeline events={events} />
      </section>

      <section className="mb-aistroyka-8">
        <SectionHeader title="Threshold History" />
        <ThresholdHistory history={history} />
      </section>
    </main>
  );
}
