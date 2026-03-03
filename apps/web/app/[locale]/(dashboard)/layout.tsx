import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/AppLayout";
import { routing } from "@/i18n/routing";

/**
 * Tenant-aware layout for all authenticated routes.
 * Tenant = current user (auth.uid()); RLS enforces isolation on all data access.
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

  return (
    <AppLayout userEmail={user.email ?? undefined}>
      {children}
    </AppLayout>
  );
}
