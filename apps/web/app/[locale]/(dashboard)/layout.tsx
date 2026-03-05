import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { requireAdmin } from "@/src/features/admin/auth/requireAdmin";
import { routing } from "@/i18n/routing";

/**
 * Tenant-aware layout for all authenticated routes.
 * Uses dashboard shell (sidebar + topbar) with RBAC-gated Admin nav.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const headersList = await headers();
    const locale = headersList.get("x-next-intl-locale") ?? routing.defaultLocale;
    redirect(`/${locale}/login`);
  }

  const { allowed: isAdmin } = await requireAdmin(supabase);

  return (
    <DashboardShell userEmail={user.email ?? undefined} isAdmin={isAdmin}>
      {children}
    </DashboardShell>
  );
}
