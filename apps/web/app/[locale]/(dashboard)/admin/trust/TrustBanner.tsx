import { Card } from "@/components/ui";

type Latest = { day: string; ai_trust_index: number; meta_stability_index: number; labels: Record<string, string> } | null;

export function TrustBanner({ latest }: { latest: Latest }) {
  if (!latest) {
    return (
      <Card className="border-l-4 border-l-aistroyka-text-tertiary">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">
          No trust data yet. Need 7+ days of history; run trust_aggregate_daily.
        </p>
      </Card>
    );
  }
  const atiLabel = latest.labels?.ati_label ?? "medium";
  const msiLabel = latest.labels?.msi_label ?? "medium";
  const atiPct = Math.round(latest.ai_trust_index * 100);
  const oneLiner = atiLabel === "high" && msiLabel === "high" ? "AI trust and meta-stability are high." : atiLabel === "low" || msiLabel === "low" ? "Review governance and data quality." : "Moderate trust; monitor indices.";
  return (
    <Card className="border-l-4 border-l-aistroyka-accent">
      <div className="flex flex-wrap items-center gap-aistroyka-6">
        <div>
          <span className="text-aistroyka-caption text-aistroyka-text-tertiary">AI Trust Index</span>
          <p className="text-aistroyka-title3 font-bold text-aistroyka-text-primary">{atiPct}% ({atiLabel})</p>
        </div>
        <div>
          <span className="text-aistroyka-caption text-aistroyka-text-tertiary">Meta-Stability</span>
          <p className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{msiLabel}</p>
        </div>
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{oneLiner}</p>
      </div>
      <p className="mt-aistroyka-2 text-aistroyka-caption text-aistroyka-text-tertiary">As of {latest.day}</p>
    </Card>
  );
}
