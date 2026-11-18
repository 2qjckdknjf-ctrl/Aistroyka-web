"use client";

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  ListTodo,
  CalendarDays,
  FileText,
  Wallet,
  Truck,
  Users,
  BarChart3,
  ShieldAlert,
  Settings,
  PanelLeftClose,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getDashboardNavIncludesAdmin,
  getPortalOnlyNavItems,
} from "@/components/dashboard-nav.utils";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  testId?: string;
  badge?: number;
};

const CONTRACTOR_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "navDashboard", icon: LayoutDashboard, testId: "cta.dashboard.nav.overview" },
  { href: "/dashboard/projects", labelKey: "navProjects", icon: Building2, testId: "cta.dashboard.nav.projects" },
  { href: "/dashboard/tasks", labelKey: "navTasks", icon: ListTodo, testId: "cta.dashboard.nav.tasks" },
  { href: "/dashboard/workload", labelKey: "navCalendar", icon: CalendarDays },
  { href: "/dashboard/uploads", labelKey: "navDocuments", icon: FileText, testId: "cta.dashboard.nav.uploads" },
  { href: "/dashboard/approvals", labelKey: "navFinance", icon: Wallet, testId: "cta.dashboard.nav.approvals" },
  { href: "/dashboard/devices", labelKey: "navSupplies", icon: Truck },
  { href: "/dashboard/contractors", labelKey: "navContractors", icon: Users },
  { href: "/dashboard/reports", labelKey: "navReports", icon: BarChart3 },
  { href: "/dashboard/ai", labelKey: "navRisks", icon: ShieldAlert, testId: "cta.dashboard.nav.ai" },
  { href: "/dashboard/settings/auth", labelKey: "navSettings", icon: Settings, testId: "cta.dashboard.nav.authSettings" },
];

type CanonSidebarNavProps = {
  pathname: string;
  homeHref: string;
  portalOnly: boolean;
  isAdmin: boolean;
  canManageTeam: boolean;
  collapsed: boolean;
  onCollapseToggle: () => void;
  onNavigate?: () => void;
};

export function CanonSidebarNav({
  pathname,
  homeHref,
  portalOnly,
  isAdmin,
  canManageTeam,
  collapsed,
  onCollapseToggle,
  onNavigate,
}: CanonSidebarNavProps) {
  const t = useTranslations("canon");

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (portalOnly) {
    return (
      <nav className="flex flex-1 flex-col py-2" aria-label={t("portalNavigation")}>
        {getPortalOnlyNavItems().map(({ href, key, testId }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              data-testid={testId}
              className={`canon-nav-link ${active ? "canon-nav-link--active" : ""}`}
            >
              <Building2 size={20} strokeWidth={1.75} aria-hidden />
              <span className="canon-nav-label">{t("portalProjects")}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Link href={homeHref} onClick={onNavigate} className="canon-sidebar-brand block">
        AISTROYKA
      </Link>

      <nav className="flex-1 overflow-y-auto py-1" aria-label={t("dashboardNavigation")}>
        {CONTRACTOR_NAV.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.labelKey}`}
              href={item.href}
              onClick={onNavigate}
              data-testid={item.testId}
              className={`canon-nav-link relative ${active ? "canon-nav-link--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden />
              <span className="canon-nav-label">{t(item.labelKey)}</span>
              {item.badge ? <span className="canon-nav-badge">{item.badge}</span> : null}
            </Link>
          );
        })}

        {canManageTeam && !portalOnly ? (
          <Link
            href="/team"
            onClick={onNavigate}
            className={`canon-nav-link ${isActive("/team") ? "canon-nav-link--active" : ""}`}
          >
            <Users size={20} strokeWidth={1.75} aria-hidden />
            <span className="canon-nav-label">{t("navTeam")}</span>
          </Link>
        ) : null}

        {getDashboardNavIncludesAdmin(isAdmin, portalOnly) ? (
          <Link
            href="/admin/push"
            onClick={onNavigate}
            className={`canon-nav-link ${isActive("/admin/push") ? "canon-nav-link--active" : ""}`}
          >
            <Settings size={20} strokeWidth={1.75} aria-hidden />
            <span className="canon-nav-label">{t("navAdmin")}</span>
          </Link>
        ) : null}
      </nav>

      <div className="canon-ai-sidebar-card">
        <div className="flex items-center gap-3">
          <div className="canon-ai-orb shrink-0 !w-10 !h-10" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--canon-text-primary)]">{t("aiSidebarTitle")}</p>
            <p className="text-xs text-[var(--canon-text-muted)]">{t("aiSidebarHint")}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onCollapseToggle}
        className="canon-nav-link mx-2 mb-2 mt-1 w-[calc(100%-16px)] text-[var(--canon-text-muted)]"
        aria-expanded={!collapsed}
      >
        <PanelLeftClose size={20} strokeWidth={1.75} aria-hidden />
        <span className="canon-collapse-label text-sm">{t("collapseMenu")}</span>
      </button>
    </div>
  );
}
