import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { DashboardShell } from "@/components/DashboardShell";
import { requireAdmin } from "@/src/features/admin/auth/requireAdmin";
import { routing } from "@/i18n/routing";
import {
  getActiveSubscriptionStateForUser,
  isDashboardSubscriptionGateEnforced,
} from "@/lib/platform/billing/subscription-gate";
import { getActiveTenantRoleForUser } from "@/lib/tenant/tenant-role.server";
import { isPortalOnlyShellFromRole } from "@/components/dashboard-nav.utils";

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

    // redirect() must be called outside this try/catch: it throws NEXT_REDIRECT,
    // and a local catch would swallow it, silently disabling the gate.
    // Gate *errors* stay fail-open so transient billing reads don't lock users out.
    let subscribeRedirect: string | null = null;
    try {
      const admin = getAdminClient();
      if (admin) {
        const subscriptionState = await getActiveSubscriptionStateForUser(admin, user.id);
        if (
          isDashboardSubscriptionGateEnforced() &&
          subscriptionState.tenantId &&
          !subscriptionState.hasDashboardAccess
        ) {
          subscribeRedirect = `/${locale}/subscribe?dashboard_access=require_subscription`;
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[dashboard layout] subscription gate failed", e instanceof Error ? e.message : String(e));
      }
    }
    if (subscribeRedirect) {
      redirect(subscribeRedirect);
    }

    // Portal-only shell from active-tenant role (not pathname). Admin/team nav share the same active-tenant contract.
    let isAdmin = false;
    let canManageTeam = false;
    let portalOnly = false;
    try {
      const headersList = await headers();
      const activeRole = await getActiveTenantRoleForUser(supabase, user.id, headersList);
      portalOnly = isPortalOnlyShellFromRole(activeRole);
      if (!portalOnly) {
        const adminResult = await requireAdmin(supabase, headersList);
        isAdmin = adminResult.allowed;
        canManageTeam = adminResult.allowed;
      }
      if (process.env.NODE_ENV !== "production") {
        console.info("[dashboard layout] shell resolved", {
          portalOnly,
          isAdmin,
          hasRole: !!activeRole,
        });
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[dashboard layout] shell role failed", e instanceof Error ? e.message : String(e));
      }
      isAdmin = false;
      canManageTeam = false;
      portalOnly = false;
    }

    return (
      <DashboardShell
        userEmail={user.email ?? undefined}
        isAdmin={isAdmin}
        canManageTeam={canManageTeam}
        portalOnly={portalOnly}
      >
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
