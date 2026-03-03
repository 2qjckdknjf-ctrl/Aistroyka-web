"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { NavLogout } from "./NavLogout";
import { BuildStamp } from "./BuildStamp";
import { routing } from "@/i18n/routing";

const linkKeys = [
  { href: "/dashboard", key: "dashboard" as const },
  { href: "/projects", key: "projects" as const },
  { href: "/team", key: "team" as const },
  { href: "/portfolio", key: "portfolio" as const },
  { href: "/billing", key: "billing" as const },
  { href: "/admin", key: "admin" as const },
];

export function Nav({ userEmail }: { userEmail?: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <nav className="border-b border-aistroyka-border-subtle bg-aistroyka-surface" role="navigation" aria-label="Main">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-aistroyka-3 px-aistroyka-4 py-aistroyka-4">
        <div className="flex min-h-aistroyka-touch items-center gap-aistroyka-4 md:gap-aistroyka-8">
          <Link
            href="/dashboard"
            className="text-aistroyka-title3 font-semibold tracking-tight text-aistroyka-text-primary transition-colors hover:text-aistroyka-accent focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-md"
            onClick={closeMobile}
          >
            Aistroyka
          </Link>
          <div className="hidden gap-1 md:flex">
            {linkKeys.map(({ href, key }) => {
              const isActive =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-aistroyka-lg px-aistroyka-3 py-aistroyka-2 text-aistroyka-subheadline font-medium transition-colors min-h-aistroyka-touch inline-flex items-center ${
                    isActive
                      ? "bg-aistroyka-accent-light text-aistroyka-accent"
                      : "text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {t(key)}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <BuildStamp />
          <LocaleSwitcher />
          {userEmail && (
            <span className="hidden max-w-[140px] truncate text-aistroyka-subheadline text-aistroyka-text-secondary sm:inline-block md:max-w-[200px]" title={userEmail}>
              {userEmail}
            </span>
          )}
          <NavLogout />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex min-h-aistroyka-touch min-w-aistroyka-touch shrink-0 items-center justify-center rounded-aistroyka-lg text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="nav-menu-mobile"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div
        id="nav-menu-mobile"
        className={`border-t border-aistroyka-border-subtle bg-aistroyka-surface md:hidden ${mobileOpen ? "block" : "hidden"}`}
        aria-hidden={!mobileOpen}
      >
        <div className="mx-auto max-w-6xl px-aistroyka-4 py-aistroyka-3">
          <ul className="flex flex-col gap-aistroyka-1">
            {linkKeys.map(({ href, key }) => {
              const isActive =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={closeMobile}
                    className={`flex min-h-aistroyka-touch items-center rounded-aistroyka-lg px-aistroyka-4 py-aistroyka-3 text-aistroyka-callout font-medium transition-colors ${
                      isActive
                        ? "bg-aistroyka-accent-light text-aistroyka-accent"
                        : "text-aistroyka-text-primary hover:bg-aistroyka-surface-raised"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function LocaleSwitcher() {
  const pathname = usePathname();
  return (
    <div className="flex rounded-aistroyka-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-0.5">
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className="rounded-aistroyka-md px-aistroyka-2 py-aistroyka-1 text-aistroyka-caption font-medium uppercase text-aistroyka-text-secondary transition-colors hover:bg-aistroyka-surface hover:text-aistroyka-text-primary"
        >
          {loc}
        </Link>
      ))}
    </div>
  );
}
