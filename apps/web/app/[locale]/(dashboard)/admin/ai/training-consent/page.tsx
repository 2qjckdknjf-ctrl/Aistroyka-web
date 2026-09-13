import { Card } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { AdminAiTrainingConsentClient } from "./AdminAiTrainingConsentClient";

export default function AdminAiTrainingConsentPage() {
  return (
    <>
      <Card className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          AI training consent
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Tenant owner/admin only. Default off. Controls whether sanitized data may be used to improve AISTROYKA construction AI.
        </p>
        <p className="mt-3">
          <Link href="/admin/ai" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
            ← AI Observability
          </Link>
        </p>
      </Card>
      <AdminAiTrainingConsentClient />
    </>
  );
}
