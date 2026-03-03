"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui";
import { acknowledgeGovernanceEvent } from "./actions";

type Event = {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  summary: string | null;
  is_acknowledged: boolean;
};

export function GovernanceAlerts({ events }: { events: Event[] }) {
  const [pending, setPending] = useState<Set<string>>(new Set());

  const handleAck = async (id: string) => {
    setPending((s) => new Set(s).add(id));
    const res = await acknowledgeGovernanceEvent(id);
    setPending((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
    if (!res.ok) {
      console.error(res.error);
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={
            <svg className="h-aistroyka-empty-icon w-aistroyka-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No active alerts"
          subtitle="Unacknowledged governance events will appear here."
        />
      </Card>
    );
  }

  const severityClass: Record<string, string> = {
    info: "bg-aistroyka-text-tertiary text-white",
    warning: "bg-aistroyka-warning text-aistroyka-text-inverse",
    critical: "bg-aistroyka-error text-aistroyka-text-inverse",
  };

  return (
    <Card className="p-0 overflow-hidden">
      <ul className="divide-y divide-aistroyka-border-subtle">
        {events.map((ev) => (
          <li key={ev.id} className="flex flex-wrap items-center justify-between gap-aistroyka-3 p-aistroyka-4">
            <div className="min-w-0 flex-1">
              <span className={`inline-block rounded-aistroyka-md px-2 py-0.5 text-aistroyka-caption font-medium ${severityClass[ev.severity] ?? severityClass.info}`}>
                {ev.severity}
              </span>
              <span className="ml-2 text-aistroyka-caption text-aistroyka-text-tertiary">{ev.event_type}</span>
              <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-primary">{ev.summary ?? ev.event_type}</p>
              <p className="mt-0.5 text-aistroyka-caption text-aistroyka-text-tertiary">
                {new Date(ev.created_at).toLocaleString()}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending.has(ev.id)}
              onClick={() => handleAck(ev.id)}
              aria-label={`Отметить просмотрено: ${ev.event_type}`}
            >
              {pending.has(ev.id) ? "…" : "Отметить просмотрено"}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
