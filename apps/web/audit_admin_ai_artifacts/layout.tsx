import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/src/features/admin/auth/requireAdmin";
import { routing } from "@/i18n/routing";

/**
 * /admin/* is only accessible to users with tenant_members.role in ('owner', 'admin').
 * Otherwise redirect to dashboard root.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { allowed } = await requireAdmin(supabase);
  if (!allowed) {
    const locale = "en"; // layout has no headers() in same way; use default or from cookie later
    redirect(`/${routing.defaultLocale}`);
  }
  return <>{children}</>;
}
