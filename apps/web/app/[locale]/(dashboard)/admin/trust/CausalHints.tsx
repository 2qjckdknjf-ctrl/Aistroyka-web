import { Card } from "@/components/ui";
import { EmptyState } from "@/components/ui";

type Hint = {
  hint_type?: string;
  severity: string;
  confidence?: number;
  summary: string | null;
  evidence?: Record<string, unknown>;
};

export function CausalHints({ hints }: { hints: Hint[] }) {
  if (!hints.length) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-aistroyka-text-tertiary text-2xl">?</span>}
          title="No causal hints"
          subtitle="Hints appear when governance events link to org/portfolio signals."
        />
      </Card>
    );
  }

  const severityClass: Record<string, string> = {
    critical: "bg-aistroyka-error text-white",
    warning: "bg-aistroyka-warning text-aistroyka-text-inverse",
    info: "bg-aistroyka-text-tertiary text-white",
  };

  return (
    <Card className="p-0 overflow-hidden">
      <ul className="divide-y divide-aistroyka-border-subtle">
        {hints.slice(0, 5).map((h, i) => (
          <li key={i} className="p-aistroyka-4">
            <span className={`inline-block rounded px-2 py-0.5 text-aistroyka-caption font-medium ${severityClass[h.severity] ?? severityClass.info}`}>
              {h.severity}
            </span>
            <span className="ml-2 text-aistroyka-caption text-aistroyka-text-tertiary">{h.hint_type ?? "hint"}</span>
            {h.confidence != null && (
              <span className="ml-2 text-aistroyka-caption text-aistroyka-text-tertiary">{(h.confidence * 100).toFixed(0)}%</span>
            )}
            <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-primary">{h.summary ?? "—"}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
