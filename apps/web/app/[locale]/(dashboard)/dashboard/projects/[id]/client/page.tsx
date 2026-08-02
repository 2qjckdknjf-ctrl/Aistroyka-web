import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ClientPortalViewClient } from "./ClientPortalViewClient";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getActiveTenantRoleForUser } from "@/lib/tenant/tenant-role.server";
import { isPortalOnlyShellFromRole } from "@/components/dashboard-nav.utils";

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();

  let audience: "stakeholder" | "internal" = "internal";
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);
    if (user) {
      const role = await getActiveTenantRoleForUser(supabase, user.id, await headers());
      if (isPortalOnlyShellFromRole(role)) audience = "stakeholder";
    }
  } catch {
    audience = "internal";
  }

  return (
    <Suspense fallback={<div className="animate-pulse h-32 rounded bg-aistroyka-surface-muted" />}>
      <ClientPortalViewClient projectId={id} audience={audience} />
    </Suspense>
  );
}
