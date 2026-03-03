import { Card } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { AdminAiOverviewClient } from "./AdminAiOverviewClient";

export default function AdminAiPage() {
  return (
    <>
      <Card className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          AI Observability
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Usage, SLO, breaker state, and recent issues. Tenant-scoped; owner/admin only.
        </p>
        <p className="mt-3 flex flex-wrap gap-4">
          <Link href="/admin/ai/security" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
            Security events →
          </Link>
          <Link href="/admin/ai/requests" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
            Request ID explorer →
          </Link>
        </p>
      </Card>
      <AdminAiOverviewClient />
    </>
  );
}
