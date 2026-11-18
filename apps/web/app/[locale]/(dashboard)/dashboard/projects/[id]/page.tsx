import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DashboardProjectDetailClient } from "./DashboardProjectDetailClient";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getActiveTenantRoleForUser } from "@/lib/tenant/tenant-role.server";
import { canShowProjectReportsExport } from "@/components/projects/reports-export-ui";
import type { TenantRoleDb } from "@/lib/tenant/tenant.types";

export default async function DashboardProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  const canExportReports = await resolveCanExportReports();
  const tenantRole = await resolveTenantRole();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <DashboardProjectDetailClient
        projectId={id}
        canExportReports={canExportReports}
        tenantRole={tenantRole}
      />
    </Suspense>
  );
}

async function resolveTenantRole(): Promise<TenantRoleDb | null> {
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);
    if (!user) return null;
    return await getActiveTenantRoleForUser(supabase, user.id);
  } catch {
    return null;
  }
}

async function resolveCanExportReports(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);
    if (!user) return false;
    const role = await getActiveTenantRoleForUser(supabase, user.id);
    return canShowProjectReportsExport(role);
  } catch {
    return false;
  }
}
