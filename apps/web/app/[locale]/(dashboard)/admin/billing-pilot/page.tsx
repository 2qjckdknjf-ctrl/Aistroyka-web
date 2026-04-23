import { Link } from "@/i18n/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { Card, SectionHeader } from "@/components/ui";
import { listBillingPilotWorkspacesSummary } from "@/lib/platform/billing-readiness/billing-pilot-ops.service";
import { AdminBillingPilotClient } from "./AdminBillingPilotClient";

export const dynamic = "force-dynamic";

export default async function BillingPilotAdminPage() {
  const admin = getAdminClient();
  const workspaces = admin ? await listBillingPilotWorkspacesSummary(admin, { limit: 50 }) : [];

  return (
    <main className="mx-auto max-w-4xl px-aistroyka-4 py-aistroyka-8">
      <Link href="/admin" className="mb-aistroyka-6 inline-block text-aistroyka-subheadline font-medium text-aistroyka-text-secondary hover:text-aistroyka-accent">
        ← Admin
      </Link>

      <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          Billing Pilot — Internal Ops
        </h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Cohort management, workspace diagnostics, event reprocess. Admin-only. No user self-serve.
        </p>
      </Card>

      <AdminBillingPilotClient initialWorkspaces={workspaces} />
    </main>
  );
}
