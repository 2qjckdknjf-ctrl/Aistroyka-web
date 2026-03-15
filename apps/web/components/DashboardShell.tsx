"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { NavLogout } from "./NavLogout";
import { BuildStamp } from "./BuildStamp";
import { Logo } from "@/components/brand/Logo";
import { routing } from "@/i18n/routing";
import { getDashboardNavIncludesAdmin } from "./dashboard-nav.utils";

const SIDEBAR_LINKS = [
  { href: "/dashboard", key: "overview" as const },
  { href: "/dashboard/projects", key: "projects" as const },
  { href: "/dashboard/tasks", key: "tasks" as const },
  { href: "/dashboard/workers", key: "workers" as const },
  { href: "/dashboard/reports", key: "reports" as const },
  { href: "/dashboard/approvals", key: "approvals" as const },
  { href: "/dashboard/uploads", key: "uploads" as const },
  { href: "/dashboard/devices", key: "devices" as const },
  { href: "/dashboard/ai", key: "ai" as const },
  { href: "/dashboard/alerts", key: "alerts" as const },
] as const;

const ADMIN_LINKS = [
  { href: "/admin/push", key: "adminPush" as const },
  { href: "/admin/jobs", key: "adminJobs" as const },
] as const;

export function DashboardShell({
  children,
  userEmail,
  isAdmin,
}: {
  children: React.ReactNode;
  userEmail?: string;
  isAdmin: boolean;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState("7d");

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-aistroyka-bg-primary flex">
      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-56 border-r border-aistroyka-border-subtle bg-aistroyka-surface transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Dashboard navigation"
      >
        <div className="flex h-full flex-col pt-[var(--aistroyka-space-4)]">
          <div className="px-[var(--aistroyka-space-4)] pb-[var(--aistroyka-space-3)]">
            <Logo href="/dashboard" height={26} className="block" onClick={closeSidebar} />
          </div>
          <nav className="flex-1 space-y-0.5 px-[var(--aistroyka-space-2)]" aria-label="Main">
            {SIDEBAR_LINKS.map(({ href, key }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeSidebar}
                  className={`flex min-h-aistroyka-touch items-center rounded-[var(--aistroyka-radius-lg)] px-[var(--aistroyka-space-3)] py-[var(--aistroyka-space-2)] text-[var(--aistroyka-font-subheadline)] font-medium transition-colors ${
                    active
                      ? "bg-aistroyka-accent-light text-aistroyka-accent"
                      : "text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {t(key)}
                </Link>
              );
            })}
            {getDashboardNavIncludesAdmin(isAdmin) && (
              <>
                <div className="px-3 py-2 text-[var(--aistroyka-font-caption)] font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
                  {t("admin")}
                </div>
                {ADMIN_LINKS.map(({ href, key }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={closeSidebar}
                      className={`flex min-h-aistroyka-touch items-center rounded-[var(--aistroyka-radius-lg)] px-[var(--aistroyka-space-3)] py-[var(--aistroyka-space-2)] text-[var(--aistroyka-font-subheadline)] font-medium transition-colors ${
                        active
                          ? "bg-aistroyka-accent-light text-aistroyka-accent"
                          : "text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {t(key)}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>
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
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-aistroyka-border-subtle bg-aistroyka-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 px-[var(--aistroyka-space-4)] py-[var(--aistroyka-space-3)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="flex min-h-aistroyka-touch min-w-aistroyka-touch items-center justify-center rounded-[var(--aistroyka-radius-lg)] text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised focus:outline-none focus:ring-2 focus:ring-aistroyka-accent md:hidden"
                aria-expanded={sidebarOpen}
                aria-controls="dashboard-sidebar"
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="text-aistroyka-subheadline text-aistroyka-text-tertiary" aria-hidden>
                Workspace
              </span>
              <select
                aria-label="Date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <input
                type="search"
                placeholder="Search…"
                aria-label="Search"
                className="w-32 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-aistroyka-caption text-aistroyka-text-primary placeholder:text-aistroyka-text-tertiary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent sm:w-40"
              />
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </header>

        <div className="flex flex-1 flex-col min-h-0">
          <main className="flex-1 mx-auto w-full max-w-6xl px-[var(--aistroyka-space-4)] py-[var(--aistroyka-space-6)]">
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
    </div>
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
