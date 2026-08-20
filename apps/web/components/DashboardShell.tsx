"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { NavLogout } from "./NavLogout";
import { BuildStamp } from "./BuildStamp";
import { Logo } from "@/components/brand/Logo";
import { routing } from "@/i18n/routing";
import {
  getDashboardNavGroups,
  getDashboardNavIncludesAdmin,
  getDashboardNavTestId,
  isDashboardNavHrefActive,
  type DashboardNavItem,
} from "./dashboard-nav.utils";
import { FirstLaunchGuide, LaunchConfidenceBanner } from "@/components/onboarding";
import { AIGuidePanel } from "@/components/help/AIGuidePanel";
import { LiquidGlass } from "@/components/design/liquid-glass";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";

const ADMIN_LINKS: DashboardNavItem[] = [
  { href: "/admin/push", key: "adminPush" },
  { href: "/admin/jobs", key: "adminJobs" },
];

const PortalOnlyShellContext = createContext(false);

export function usePortalOnlyShell(): boolean {
  return useContext(PortalOnlyShellContext);
}

function navLinkClass(active: boolean): string {
  return `flex min-h-aistroyka-touch items-center rounded-[var(--aistroyka-radius-lg)] px-[var(--aistroyka-space-3)] py-[var(--aistroyka-space-2)] text-[var(--aistroyka-font-subheadline)] font-medium transition-[color,background-color,transform] duration-[var(--aistroyka-duration-hover)] active:scale-[0.98] motion-reduce:active:scale-100 ${
    active
      ? "bg-aistroyka-accent-light text-aistroyka-accent"
      : "text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary"
  }`;
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
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState("7d");
  const navGroups = getDashboardNavGroups(portalOnly);
  const homeHref = portalOnly ? "/portal/projects" : "/dashboard";

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <PortalOnlyShellContext.Provider value={portalOnly}>
      <div className="dashboard-cockpit min-h-screen bg-aistroyka-bg-primary flex">
        {/* Sidebar */}
        <aside
          id="dashboard-sidebar"
          className={`fixed inset-y-0 left-0 z-40 w-56 border-r border-[var(--lg-border)] transition-transform md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label={t("dashboardNavigation")}
        >
          <LiquidGlass
            variant="nav"
            intensity="medium"
            className="h-full rounded-none"
            contentClassName="flex h-full flex-col pt-[var(--aistroyka-space-4)]"
          >
            <div className="px-[var(--aistroyka-space-4)] pb-[var(--aistroyka-space-3)]">
              <Logo href={homeHref} height={26} className="block" onClick={closeSidebar} />
            </div>
            <nav className="flex-1 space-y-aistroyka-4 overflow-y-auto px-[var(--aistroyka-space-2)] pb-[var(--aistroyka-space-4)]" aria-label={t("main")}>
              {navGroups.map((group) => (
                <div key={group.id}>
                  <p className="px-[var(--aistroyka-space-3)] pb-1 text-[var(--aistroyka-font-caption)] font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
                    {t(group.labelKey)}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map(({ href, key, labelKey }) => {
                      const active = isDashboardNavHrefActive(pathname, href);
                      const label = labelKey ? t(labelKey) : t(key);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={closeSidebar}
                          data-testid={getDashboardNavTestId(key)}
                          className={navLinkClass(active)}
                          aria-current={active ? "page" : undefined}
                        >
                          {label}
                        </Link>
                      );
                    })}
                    {group.id === "operations" && canManageTeam && !portalOnly ? (
                      <Link
                        href="/team"
                        onClick={closeSidebar}
                        data-testid="cta.dashboard.nav.team"
                        className={navLinkClass(isDashboardNavHrefActive(pathname, "/team"))}
                        aria-current={isDashboardNavHrefActive(pathname, "/team") ? "page" : undefined}
                      >
                        {t("team")}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
              {getDashboardNavIncludesAdmin(isAdmin, portalOnly) && (
                <>
                  <div className="px-3 py-2 text-[var(--aistroyka-font-caption)] font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
                    {t("admin")}
                  </div>
                  {ADMIN_LINKS.map(({ href, key }) => {
                    const active = isDashboardNavHrefActive(pathname, href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={closeSidebar}
                        data-testid={getDashboardNavTestId(key)}
                        className={navLinkClass(active)}
                        aria-current={active ? "page" : undefined}
                      >
                        {t(key)}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </LiquidGlass>
        </aside>

        {/* Overlay when sidebar open on mobile */}
        {sidebarOpen && (
          <button
            type="button"
            aria-hidden
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={closeSidebar}
          />
        )}

        <div className="flex flex-1 flex-col min-w-0">
          {portalOnly ? null : (
            <>
              <FirstLaunchGuide />
              <AIGuidePanel />
            </>
          )}
          {/* Topbar */}
          <header className="sticky top-0 z-20">
            <LiquidGlass
              variant="nav"
              intensity="medium"
              className="rounded-none border-x-0"
              contentClassName="flex flex-wrap items-center justify-between gap-2 px-[var(--aistroyka-space-4)] py-[var(--aistroyka-space-3)]"
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="flex min-h-aistroyka-touch min-w-aistroyka-touch items-center justify-center rounded-[var(--aistroyka-radius-lg)] text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised focus:outline-none focus:ring-2 focus:ring-aistroyka-accent md:hidden"
                  aria-expanded={sidebarOpen}
                  aria-controls="dashboard-sidebar"
                  aria-label={sidebarOpen ? t("closeMenu") : t("openMenu")}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <span className="text-aistroyka-subheadline text-aistroyka-text-tertiary" aria-hidden>
                  {portalOnly ? t("navGroupPortal") : t("workspace")}
                </span>
                {portalOnly ? null : (
                  <>
                    <select
                      aria-label={t("dateRange")}
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
                    >
                      <option value="7d">{t("last7Days")}</option>
                      <option value="30d">{t("last30Days")}</option>
                      <option value="90d">{t("last90Days")}</option>
                    </select>
                    <input
                      type="search"
                      placeholder={t("searchPlaceholder")}
                      aria-label={t("search")}
                      className="min-w-0 flex-1 basis-[7.5rem] rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption text-aistroyka-text-primary placeholder:text-aistroyka-text-tertiary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent sm:w-40 sm:flex-none sm:basis-auto"
                    />
                  </>
                )}
              </div>
              <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
                <BuildStamp />
                <LocaleSwitcher />
                {userEmail && (
                  <span
                    className="hidden max-w-[140px] truncate text-aistroyka-subheadline text-aistroyka-text-secondary sm:inline-block md:max-w-[200px]"
                    title={userEmail}
                  >
                    {userEmail}
                  </span>
                )}
                <NavLogout />
              </div>
            </LiquidGlass>
          </header>

          <div className="flex flex-1 flex-col min-h-0">
            <main className="mx-auto min-w-0 w-full max-w-6xl flex-1 px-[var(--aistroyka-space-4)] py-[var(--aistroyka-space-6)] pb-[calc(var(--aistroyka-space-6)+4.5rem)] md:pb-[var(--aistroyka-space-6)]">
              {portalOnly ? null : <LaunchConfidenceBanner />}
              {children}
            </main>
            <footer
              className="border-t border-aistroyka-border-subtle py-2 text-center text-aistroyka-caption text-aistroyka-text-tertiary"
              aria-hidden="true"
            >
              Build: {process.env.NEXT_PUBLIC_BUILD_SHA?.slice(0, 7) ?? "unknown"} / {process.env.NEXT_PUBLIC_BUILD_TIME ?? "unknown"}
            </footer>
          </div>
        </div>
        <DashboardMobileNav portalOnly={portalOnly} />
      </div>
    </PortalOnlyShellContext.Provider>
  );
}

function LocaleSwitcher() {
  const pathname = usePathname();
  return (
    <div className="flex rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-0.5">
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className="rounded-[var(--aistroyka-radius-md)] px-2 py-1 text-aistroyka-caption font-medium uppercase text-aistroyka-text-secondary transition-colors hover:bg-aistroyka-surface hover:text-aistroyka-text-primary"
        >
          {loc}
        </Link>
      ))}
    </div>
  );
}
