"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { NavLogout } from "@/components/NavLogout";
import {
  getDashboardNavIncludesInternalOps,
  getDashboardShellHomeHref,
} from "@/components/dashboard-nav.utils";
import {
  CanonSidebarNav,
  CanonTopBar,
  CanonFooterBar,
} from "@/components/canon";
import { CanonPortalBottomNav } from "@/components/canon/CanonPortalBottomNav";

const PortalShellContext = createContext(false);

export function usePortalOnlyShell(): boolean {
  return useContext(PortalShellContext);
}

export function DashboardShell({
  children,
  userEmail,
  isAdmin,
  canManageTeam,
  portalOnly = false,
}: {
  children: React.ReactNode;
  userEmail?: string;
  isAdmin: boolean;
  canManageTeam: boolean;
  portalOnly?: boolean;
}) {
  const t = useTranslations("canon");
  const locale = useLocale();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const showInternal = getDashboardNavIncludesInternalOps(portalOnly);
  const homeHref = getDashboardShellHomeHref(portalOnly);

  return (
    <PortalShellContext.Provider value={portalOnly}>
      <div
      className="flex min-h-screen"
      data-canon-cabinet="1"
      data-portal-shell={portalOnly ? "1" : "0"}
      data-canon-sidebar-collapsed={sidebarCollapsed ? "1" : "0"}
    >
      <aside
        id="dashboard-sidebar"
        className={`canon-sidebar-rail fixed inset-y-0 left-0 z-40 flex flex-col transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <CanonSidebarNav
          pathname={pathname}
          homeHref={homeHref}
          portalOnly={portalOnly}
          isAdmin={isAdmin}
          canManageTeam={canManageTeam}
          collapsed={sidebarCollapsed}
          onCollapseToggle={() => setSidebarCollapsed((v) => !v)}
          onNavigate={closeSidebar}
        />
        {showInternal ? (
          <div className="border-t border-[var(--canon-border-glass)] px-3 py-2">
            <NavLogout />
          </div>
        ) : null}
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          aria-hidden
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <CanonTopBar
          userEmail={userEmail}
          userRoleLabel={portalOnly ? t("portalRole") : t("defaultRole")}
          showMenuButton
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />

        <div className="flex min-h-0 flex-1 flex-col">
          <main className="mx-auto min-w-0 w-full max-w-[1680px] flex-1 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">
            {children}
          </main>
          <CanonFooterBar locale={locale} />
        </div>
      </div>
      {portalOnly ? <CanonPortalBottomNav /> : null}
    </div>
    </PortalShellContext.Provider>
  );
}
