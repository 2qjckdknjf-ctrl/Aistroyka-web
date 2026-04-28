import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/DashboardShell";
import { requireAdmin } from "@/src/features/admin/auth/requireAdmin";
import { routing } from "@/i18n/routing";
import { getActiveSubscriptionStateForUser } from "@/lib/platform/billing/subscription-gate";

/**
 * Tenant-aware layout for all authenticated routes.
 * Uses dashboard shell (sidebar + topbar) with RBAC-gated Admin nav.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let locale: (typeof routing.locales)[number] = routing.defaultLocale;
  try {
    const headersList = await headers();
    const fromHeader = headersList.get("x-next-intl-locale")?.trim();
    if (fromHeader && routing.locales.includes(fromHeader as (typeof routing.locales)[number])) {
      locale = fromHeader as (typeof routing.locales)[number];
    }
  } catch {
    // headers() can throw in Edge/Workers; keep default locale
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[dashboard layout] SSR started", { locale });
  }

  try {
    let supabase: Awaited<ReturnType<typeof createClient>>;
    let user: { id: string; email?: string } | null = null;
    try {
      supabase = await createClient();
      user = await getSessionUser(supabase);
      if (process.env.NODE_ENV !== "production") {
        console.info("[dashboard layout] auth resolved", { hasUser: !!user });
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[dashboard layout] auth failed", e instanceof Error ? e.message : String(e));
      }
      redirect(`/${locale}/login?session_error=1`);
    }
    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[dashboard layout] no user, redirecting to login");
      }
      redirect(`/${locale}/login`);
    }

    try {
      const admin = getAdminClient();
      if (admin) {
        const subscriptionState = await getActiveSubscriptionStateForUser(admin, user.id);
        if (subscriptionState.tenantId && !subscriptionState.hasActiveSubscription) {
          redirect(`/${locale}/subscribe`);
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[dashboard layout] subscription gate failed", e instanceof Error ? e.message : String(e));
      }
    }

    let isAdmin = false;
    try {
      const adminResult = await requireAdmin(supabase);
      isAdmin = adminResult.allowed;
      if (process.env.NODE_ENV !== "production") {
        console.info("[dashboard layout] requireAdmin resolved", { isAdmin });
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[dashboard layout] requireAdmin failed", e instanceof Error ? e.message : String(e));
      }
    }

    return (
      <DashboardShell userEmail={user.email ?? undefined} isAdmin={isAdmin}>
        {children}
      </DashboardShell>
    );
  } catch (e) {
    // Re-throw Next.js redirect so framework can handle it
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest?: string }).digest === "string") {
      const d = (e as { digest: string }).digest;
      if (d.startsWith("NEXT_REDIRECT")) throw e;
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("[dashboard layout] unexpected error", e instanceof Error ? e.message : String(e));
    }
    redirect(`/${locale}/login?session_error=1`);
  }
}
