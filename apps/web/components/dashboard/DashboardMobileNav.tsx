"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { getDashboardMobileNav, isDashboardNavHrefActive } from "@/components/dashboard-nav.utils";

/** Field-first bottom nav — 5 primary destinations on phone; portal-only uses customer destinations. */
export function DashboardMobileNav({ portalOnly = false }: { portalOnly?: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = getDashboardMobileNav(portalOnly);

  return (
    <nav
      className="dashboard-mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-[var(--lg-border)] md:hidden"
      aria-label={t("dashboardNavigation")}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around bg-[color-mix(in_srgb,var(--aistroyka-surface)_88%,transparent)] px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 backdrop-blur-[var(--lg-blur)]">
        {items.map(({ href, labelKey, testId }) => {
          const active = isDashboardNavHrefActive(pathname, href);
          const label = t(labelKey);
          return (
            <Link
              key={href}
              href={href}
              data-testid={`cta.dashboard.mobile.${testId}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-aistroyka-touch min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--aistroyka-radius-md)] px-1 py-1.5 text-[10px] font-medium leading-tight transition-[color,transform] duration-[var(--aistroyka-duration-hover)] active:scale-[0.97] motion-reduce:active:scale-100 ${
                active
                  ? "text-aistroyka-accent"
                  : "text-aistroyka-text-secondary"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
