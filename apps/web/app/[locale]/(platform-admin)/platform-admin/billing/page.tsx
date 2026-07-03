import { Card } from "@/components/ui";
import { getAdminClient } from "@/lib/supabase/admin";
import { listBillingPilotWorkspacesSummary } from "@/lib/platform/billing-readiness/billing-pilot-ops.service";
import { PlatformBillingPilotClient } from "@/components/platform-admin/PlatformBillingPilotClient";

export const dynamic = "force-dynamic";

export default async function PlatformAdminBillingPage() {
  const admin = getAdminClient();
  const workspaces = admin ? await listBillingPilotWorkspacesSummary(admin, { limit: 50 }) : [];

  return (
    <>
      <Card className="mb-aistroyka-8 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          Billing pilot — platform ops
        </h1>
        <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Cohort management, workspace diagnostics, and event reprocess. Platform owner only.
        </p>
      </Card>
      <PlatformBillingPilotClient initialWorkspaces={workspaces} />
    </>
  );
}
