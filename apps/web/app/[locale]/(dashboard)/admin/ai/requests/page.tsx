
import { Link } from "@/i18n/navigation";
import { AdminAiRequestsClient } from "./AdminAiRequestsClient";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export default function AdminAiRequestsPage() {
  return (
    <>
      <DashboardGlassCard className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          Request ID explorer
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Look up LLM log, retrieval logs, and chat messages by request_id.
        </p>
        <p className="mt-3">
          <Link href="/admin/ai" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
            ← Overview
          </Link>
        </p>
      </DashboardGlassCard>
      <AdminAiRequestsClient />
    </>
  );
}
