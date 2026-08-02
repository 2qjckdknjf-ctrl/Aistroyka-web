import { headers } from "next/headers";
import { Card } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveAdminPageTenantScope } from "@/src/features/admin/auth/resolveAdminPageTenantScope";
import { AdminAiSecurityClient } from "./AdminAiSecurityClient";

export default async function AdminAiSecurityPage() {
  const scope = await resolveAdminPageTenantScope(await createClient(), await headers());
  return (
    <>
      <Card className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          AI Security events
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Filter by range, severity, event type. Scoped to the active tenant.
        </p>
        <p className="mt-3">
          <Link href="/admin/ai" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
            ← Overview
          </Link>
        </p>
      </Card>
      <AdminAiSecurityClient activeTenantId={scope.tenantId} />
    </>
  );
}
