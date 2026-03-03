import { Card } from "@/components/ui";
import { EmptyState } from "@/components/ui";

type Latest = {
  day: string;
  governance_risk_index: number;
  ai_trust_index: number;
  meta_stability_index: number;
  labels: Record<string, string>;
  reasons: Record<string, string[]>;
} | null;

export function IndicesCards({ latest }: { latest: Latest }) {
  if (!latest) {
    return (
      <Card>
        <EmptyState icon={<span className="text-2xl text-aistroyka-text-tertiary">—</span>} title="No indices" subtitle="Run trust aggregation to see GRI, ATI, MSI." />
      </Card>
    );
  }
  const griLabel = latest.labels?.gri_label ?? "medium";
  const msiLabel = latest.labels?.msi_label ?? "medium";
  const griReasons = latest.reasons?.gri_reasons ?? [];
  const msiReasons = latest.reasons?.msi_reasons ?? [];
  return (
    <div className="grid gap-aistroyka-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <h3 className="text-aistroyka-caption text-aistroyka-text-tertiary">Governance Risk Index</h3>
        <p className="mt-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">{(latest.governance_risk_index * 100).toFixed(0)}% ({griLabel})</p>
        <ul className="mt-2 list-inside list-disc text-aistroyka-caption text-aistroyka-text-secondary">{griReasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}</ul>
      </Card>
      <Card>
        <h3 className="text-aistroyka-caption text-aistroyka-text-tertiary">Org Confidence</h3>
        <p className="mt-1 text-aistroyka-headline font-semibold text-aistroyka-text-primary">From org daily</p>
      </Card>
      <Card>
        <h3 className="text-aistroyka-caption text-aistroyka-text-tertiary">Org Stability</h3>
        <p className="mt-1 text-aistroyka-headline font-semibold text-aistroyka-text-primary">From org daily</p>
      </Card>
      <Card>
        <h3 className="text-aistroyka-caption text-aistroyka-text-tertiary">Meta-Stability</h3>
        <p className="mt-1 text-aistroyka-title3 font-bold text-aistroyka-text-primary">{(latest.meta_stability_index * 100).toFixed(0)}% ({msiLabel})</p>
        <ul className="mt-2 list-inside list-disc text-aistroyka-caption text-aistroyka-text-secondary">{msiReasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}</ul>
      </Card>
    </div>
  );
}
