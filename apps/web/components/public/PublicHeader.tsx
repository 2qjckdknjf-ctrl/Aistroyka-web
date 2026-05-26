"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";

const PRIMARY_NAV = [
  { href: "/dashboard", key: "cabinet" as const },
  { href: "/platform", key: "platform" as const },
  { href: "/solutions", key: "solutions" as const },
  { href: "/features", key: "features" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/enterprise", key: "enterprise" as const },
] as const;

const SECONDARY_NAV = [
  { href: "/copilot", key: "copilot" as const },
  { href: "/integrations", key: "integrations" as const },
  { href: "/api", key: "api" as const },
  { href: "/workflows", key: "workflows" as const },
  { href: "/ai-demo", key: "aiDemo" as const },
  { href: "/ai-construction-control", key: "aiControl" as const },
  { href: "/mobile", key: "mobile" as const },
  { href: "/security", key: "security" as const },
  { href: "/docs", key: "docs" as const },
  { href: "/cases", key: "cases" as const },
  { href: "/about", key: "about" as const },
  { href: "/contact", key: "contact" as const },
  { href: "/faq", key: "faq" as const },
] as const;

export function PublicHeader() {
  const t = useTranslations("public.nav");
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const isMenuOpen = !isHydrated || mobileMenuOpen;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-aistroyka-border-subtle bg-aistroyka-bg-primary py-3 backdrop-blur-md">
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-2 rounded-[var(--aistroyka-radius-xl)] border border-aistroyka-border-subtle bg-aistroyka-bg-secondary px-3 py-2 shadow-[var(--aistroyka-shadow-e1)] sm:gap-4 sm:px-6 lg:px-8">
        <Logo href="/" variant="wordmark" height={40} className="hidden sm:inline-flex" />
        <Logo href="/" variant="icon" className="inline-flex sm:hidden" />

        <nav className="hidden items-center gap-1 md:flex" aria-label={t("main")}>
          {PRIMARY_NAV.map(({ href, key }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-[var(--aistroyka-radius-lg)] px-3 py-2 text-[var(--aistroyka-font-subheadline)] font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--aistroyka-accent-light)] text-aistroyka-accent"
                    : "text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary"
                }`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden min-w-0 flex-wrap items-center justify-end gap-2 md:flex">
          <Link href="/contact" className="btn-secondary">
            {t("requestDemo")}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-[var(--aistroyka-radius-lg)] px-3 py-2 text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary"
          >
            {t("cabinet")}
          </Link>
          <Link href="/login" className="btn-primary">
            {t("login")}
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[var(--aistroyka-touch-min)] items-center rounded-[var(--aistroyka-radius-lg)] px-3 py-2 text-[var(--aistroyka-font-caption)] font-semibold text-aistroyka-accent hover:bg-aistroyka-surface-raised"
            data-testid="cta.public.header.mobile.cabinet"
          >
            {t("cabinet")}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-[var(--aistroyka-touch-min)] min-w-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--aistroyka-radius-lg)] text-aistroyka-text-primary hover:bg-aistroyka-surface-raised"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <span className="sr-only">{isMenuOpen ? t("closeMenu") : t("openMenu")}</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`mx-auto mt-2 max-w-7xl rounded-[var(--aistroyka-radius-xl)] border border-aistroyka-border-subtle bg-aistroyka-surface md:hidden ${isMenuOpen ? "block" : "hidden"}`}
        aria-hidden={!isMenuOpen}
      >
        <nav className="flex flex-col gap-0.5 px-4 py-4" aria-label={t("mainMobile")}>
          <div className="mb-3 flex flex-col gap-2 border-b border-aistroyka-border-subtle pb-4">
            <Link
              href="/dashboard"
              className="btn-primary text-center"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="cta.public.mobile.cabinet"
            >
              {t("cabinet")}
            </Link>
            <Link
              href="/login"
              className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-transparent px-4 py-3 text-center text-[var(--aistroyka-font-subheadline)] font-semibold text-aistroyka-text-primary hover:bg-aistroyka-surface-raised"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="cta.public.mobile.login"
            >
              {t("login")}
            </Link>
          </div>
          {PRIMARY_NAV.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className="rounded-[var(--aistroyka-radius-lg)] px-3 py-3 text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary hover:bg-aistroyka-surface-raised"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(key)}
            </Link>
          ))}
          <p className="mt-3 text-[var(--aistroyka-font-caption)] text-aistroyka-text-secondary">{t("more")}</p>
          {SECONDARY_NAV.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className="rounded-[var(--aistroyka-radius-lg)] px-3 py-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(key)}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-aistroyka-border-subtle pt-4">
            <Link
              href="/contact"
              className="rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-transparent px-4 py-3 text-center text-[var(--aistroyka-font-subheadline)] font-semibold text-aistroyka-text-primary hover:bg-aistroyka-surface-raised"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("requestDemo")}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
