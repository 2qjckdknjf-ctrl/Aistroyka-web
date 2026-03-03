"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui";
import { EmptyState } from "@/components/ui";

type Event = {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  summary: string | null;
};

const EVENT_TYPES = ["regime_shift", "threshold_update", "drift_alert", "smoothing_applied", "calibration_failed", "all"] as const;
const SEVERITIES = ["info", "warning", "critical", "all"] as const;

export function AuditTimeline({ events }: { events: Event[] }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [days, setDays] = useState(90);

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }, [days]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (new Date(e.created_at).toISOString() < cutoff) return false;
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      return true;
    });
  }, [events, cutoff, typeFilter, severityFilter]);

  if (events.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={
            <svg className="h-aistroyka-empty-icon w-aistroyka-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No events yet"
          subtitle="Governance events will appear here after the daily pipeline runs."
        />
      </Card>
    );
  }

  const severityClass: Record<string, string> = {
    info: "text-aistroyka-text-tertiary",
    warning: "text-aistroyka-warning",
    critical: "text-aistroyka-error",
  };

  return (
    <Card>
      <div className="mb-aistroyka-4 flex flex-wrap gap-aistroyka-3">
        <label className="flex items-center gap-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          <span>Type</span>
          <select
            className="rounded-aistroyka-md border border-aistroyka-border-subtle bg-aistroyka-surface px-2 py-1 text-aistroyka-callout"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          <span>Severity</span>
          <select
            className="rounded-aistroyka-md border border-aistroyka-border-subtle bg-aistroyka-surface px-2 py-1 text-aistroyka-callout"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          <span>Days</span>
          <select
            className="rounded-aistroyka-md border border-aistroyka-border-subtle bg-aistroyka-surface px-2 py-1 text-aistroyka-callout"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={30}>30</option>
            <option value={90}>90</option>
          </select>
        </label>
      </div>
      <ul className="max-h-[400px] overflow-y-auto space-y-aistroyka-2">
        {filtered.slice(0, 100).map((ev) => (
          <li key={ev.id} className="flex flex-wrap items-baseline gap-aistroyka-2 border-b border-aistroyka-border-subtle pb-2 last:border-0">
            <span className="text-aistroyka-caption text-aistroyka-text-tertiary tabular-nums">
              {new Date(ev.created_at).toLocaleString()}
            </span>
            <span className="font-medium text-aistroyka-text-primary">{ev.event_type}</span>
            <span className={"text-aistroyka-caption " + (severityClass[ev.severity] ?? "")}>{ev.severity}</span>
            <span className="text-aistroyka-subheadline text-aistroyka-text-secondary truncate">{ev.summary ?? "—"}</span>
          </li>
        ))}
      </ul>
      {filtered.length > 100 && (
        <p className="mt-2 text-aistroyka-caption text-aistroyka-text-tertiary">Showing first 100 of {filtered.length}.</p>
      )}
    </Card>
  );
}
