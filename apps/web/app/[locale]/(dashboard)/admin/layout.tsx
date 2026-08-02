import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/src/features/admin/auth/requireAdmin";
import { routing } from "@/i18n/routing";

/**
 * /admin/* is only accessible when the user is owner/admin in the *active* tenant.
 * Admin membership in another workspace does not unlock this shell.
 * Otherwise redirect to dashboard root, preserving the current locale.
 * redirect() is not wrapped in try/catch (NEXT_REDIRECT must propagate).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") ?? routing.defaultLocale;
  const supabase = await createClient();
  const { allowed } = await requireAdmin(supabase, headersList);
  if (!allowed) {
    redirect(`/${locale}/dashboard`);
  }
  return <>{children}</>;
}
