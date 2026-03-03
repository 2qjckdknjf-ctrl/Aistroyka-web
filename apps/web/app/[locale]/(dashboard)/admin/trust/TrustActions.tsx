import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui";

export function TrustActions() {
  return (
    <Card>
      <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">Actions</h2>
      <ul className="mt-aistroyka-3 flex flex-wrap gap-aistroyka-3">
        <li>
          <Link
            href="/admin/governance"
            className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
          >
            Open Governance
          </Link>
        </li>
        <li>
          <Link
            href="/portfolio"
            className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline"
          >
            Open Org / Portfolio Dashboard
          </Link>
        </li>
      </ul>
      <p className="mt-aistroyka-2 text-aistroyka-caption text-aistroyka-text-tertiary">
        If freshness is low, check data pipelines and run trust_aggregate_daily.
      </p>
    </Card>
  )
}
