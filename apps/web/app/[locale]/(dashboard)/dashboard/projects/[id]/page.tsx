import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DashboardProjectDetailClient } from "./DashboardProjectDetailClient";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getActiveTenantRoleForUser } from "@/lib/tenant/tenant-role.server";
import { canShowProjectReportsExport } from "@/components/projects/reports-export-ui";

export default async function DashboardProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();
  const canExportReports = await resolveCanExportReports();
  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <DashboardProjectDetailClient projectId={id} canExportReports={canExportReports} />
    </Suspense>
  );
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
