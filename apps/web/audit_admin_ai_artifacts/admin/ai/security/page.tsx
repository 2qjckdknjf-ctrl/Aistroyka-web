import { Card } from "@/components/ui";
import { AdminAiSecurityClient } from "./AdminAiSecurityClient";

export default function AdminAiSecurityPage() {
  return (
    <>
      <Card className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          AI Security events
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Filter by range, severity, event type. Details expand on click.
        </p>
        <p className="mt-3">
          <a href="/admin/ai" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
            ← Overview
          </a>
        </p>
      </Card>
      <AdminAiSecurityClient />
    </>
  );
}
