import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { getPlatformOwnerGrant } from "./platform-owner-grant";

/**
 * Server page guard for legacy platform surfaces still under /admin/* until Phase 1 migration.
 * Tenant admins are redirected to company admin hub.
 */
export async function assertPlatformOwnerLegacyAdminPageAccess(): Promise<void> {
  const headersList = await headers();
  const localeHeader = headersList.get("x-next-intl-locale")?.trim();
  const locale =
    localeHeader && routing.locales.includes(localeHeader as (typeof routing.locales)[number])
      ? (localeHeader as (typeof routing.locales)[number])
      : routing.defaultLocale;

  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user?.id) {
    redirect(`/${locale}/dashboard`);
  }

  const grant = await getPlatformOwnerGrant(supabase, user.id);
  if (!grant.ok) {
    redirect(`/${locale}/admin`);
  }
}
