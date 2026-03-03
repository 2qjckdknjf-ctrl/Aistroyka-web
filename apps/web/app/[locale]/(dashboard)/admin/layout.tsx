import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/src/features/admin/auth/requireAdmin";
import { routing } from "@/i18n/routing";

/**
 * /admin/* is only accessible to users with tenant_members.role in ('owner', 'admin').
 * Otherwise redirect to dashboard root, preserving the current locale.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { allowed } = await requireAdmin(supabase);
  if (!allowed) {
    const headersList = await headers();
    const locale = headersList.get("x-next-intl-locale") ?? routing.defaultLocale;
    redirect(`/${locale}/dashboard`);
  }
  return <>{children}</>;
}
