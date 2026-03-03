"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui";
import { EmptyState } from "@/components/ui";

type Point = { day: string; ai_trust_index: number; governance_risk_index: number; meta_stability_index: number };

export function TrustTimeline({ timeline }: { timeline: Point[] }) {
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<"ati" | "gri">("ati");

  const filtered = useMemo(() => {
    if (timeline.length === 0) return []
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return timeline.filter((p) => p.day >= cutoffStr).slice(-days)
  }, [timeline, days])

  if (timeline.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-aistroyka-text-tertiary text-2xl">—</span>}
          title="No trust timeline"
          subtitle="Need 7+ days of history. Run trust_aggregate_daily."
        />
      </Card>
    )
  }

  const values = filtered.map((p) => (metric === "ati" ? p.ai_trust_index : p.governance_risk_index))
  const minV = Math.min(...values, 0)
  const maxV = Math.max(...values, 1)
  const range = maxV - minV || 1

  return (
    <Card>
      <div className="mb-aistroyka-4 flex flex-wrap gap-aistroyka-3">
        <label className="flex items-center gap-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          <span>Days</span>
          <select
            className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-2 py-1 text-aistroyka-callout"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={30}>30</option>
            <option value={90}>90</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          <span>Metric</span>
          <select
            className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-2 py-1 text-aistroyka-callout"
            value={metric}
            onChange={(e) => setMetric(e.target.value as "ati" | "gri")}
          >
            <option value="ati">ATI</option>
            <option value="gri">GRI</option>
          </select>
        </label>
      </div>
      <div className="flex items-end gap-px h-32">
        {filtered.map((p, i) => {
          const v = metric === "ati" ? p.ai_trust_index : p.governance_risk_index
          const h = ((v - minV) / range) * 100
          return (
            <div
              key={p.day}
              className="flex-1 min-w-0 rounded-t bg-aistroyka-accent/60 hover:bg-aistroyka-accent"
              style={{ height: `${Math.max(4, h)}%` }}
              title={`${p.day}: ${(v * 100).toFixed(0)}%`}
            />
          )
        })}
      </div>
      <p className="mt-2 text-aistroyka-caption text-aistroyka-text-tertiary">
        {metric === "ati" ? "AI Trust Index" : "Governance Risk Index"} over last {filtered.length} days.
      </p>
    </Card>
  )
}
