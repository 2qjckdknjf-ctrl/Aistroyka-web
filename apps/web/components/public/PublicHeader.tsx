"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { GlassLink, GlassNav, useGlassNavScrolled } from "@/components/design/liquid-glass";

const PRIMARY_NAV = [
  { href: "/dashboard", key: "cabinet" as const },
  { href: "/platform", key: "platform" as const },
  { href: "/features", key: "features" as const },
  { href: "/solutions", key: "solutions" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/enterprise", key: "enterprise" as const },
] as const;

const SECONDARY_NAV = [
  { href: "/ai-construction-control", key: "aiControl" as const },
  { href: "/ai-demo", key: "aiDemo" as const },
  { href: "/copilot", key: "copilot" as const },
  { href: "/mobile", key: "mobile" as const },
  { href: "/integrations", key: "integrations" as const },
  { href: "/api", key: "api" as const },
  { href: "/workflows", key: "workflows" as const },
  { href: "/security", key: "security" as const },
  { href: "/implementation", key: "implementation" as const },
  { href: "/partners", key: "partners" as const },
  { href: "/docs", key: "docs" as const },
  { href: "/cases", key: "cases" as const },
  { href: "/about", key: "about" as const },
  { href: "/contact", key: "contact" as const },
  { href: "/faq", key: "faq" as const },
] as const;

const mobileLinkClass =
  "rounded-[var(--aistroyka-radius-lg)] px-3 py-3 text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary outline-none hover:bg-aistroyka-surface-raised focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const mobileSecondaryLinkClass =
  "rounded-[var(--aistroyka-radius-lg)] px-3 py-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary outline-none hover:bg-aistroyka-surface-raised focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const navLinkClass = (active: boolean) =>
  `rounded-[var(--aistroyka-radius-lg)] px-3 py-2 text-[var(--aistroyka-font-subheadline)] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
    active
      ? "bg-[var(--aistroyka-accent-light)] text-aistroyka-accent"
      : "text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary"
  }`;

export function PublicHeader() {
  const t = useTranslations("public.nav");
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrolled = useGlassNavScrolled(24);

  return (
    <header className="sticky top-0 z-50 px-3 py-3 sm:px-4 lg:px-6">
      <div className="relative z-10 mx-auto max-w-7xl">
        <GlassNav
          scrolled={scrolled}
          contentClassName="flex min-w-0 items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-5"
        >
          <Logo href="/" variant="wordmark" height={40} className="hidden shrink-0 sm:inline-flex" />
          <Logo href="/" variant="icon" className="inline-flex shrink-0 sm:hidden" />

          <nav className="hidden min-w-0 items-center gap-1 md:flex" aria-label={t("main")}>
            {PRIMARY_NAV.map(({ href, key }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} className={navLinkClass(isActive)}>
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <div className="hidden min-w-0 flex-wrap items-center justify-end gap-2 md:flex">
            <GlassLink href="/contact" intensity="subtle" linkClassName="text-sm">
              {t("contactUs")}
            </GlassLink>
            <GlassLink href="/dashboard" intensity="subtle" linkClassName="text-sm">
              {t("cabinet")}
            </GlassLink>
            <GlassLink href="/login" pill intensity="strong" linkClassName="text-sm">
              {t("login")}
            </GlassLink>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <Link
              href="/dashboard"
              className="inline-flex min-h-[var(--aistroyka-touch-min)] items-center rounded-[var(--aistroyka-radius-lg)] px-3 py-2 text-[var(--aistroyka-font-caption)] font-semibold text-aistroyka-accent outline-none hover:bg-aistroyka-surface-raised focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)]"
              data-testid="cta.public.header.mobile.cabinet"
            >
              {t("cabinet")}
            </Link>
            <button
              type="button"
              className="inline-flex min-h-[var(--aistroyka-touch-min)] min-w-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--aistroyka-radius-lg)] text-aistroyka-text-primary outline-none hover:bg-aistroyka-surface-raised focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)]"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <span className="sr-only">{mobileMenuOpen ? t("closeMenu") : t("openMenu")}</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </GlassNav>

        <div
          id="mobile-menu"
          className={`surface-glass-popover mt-2 rounded-[var(--aistroyka-radius-xl)] md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
          aria-hidden={!mobileMenuOpen}
        >
          <nav className="flex flex-col gap-0.5 px-4 py-4" aria-label={t("mainMobile")}>
            <div className="mb-3 flex flex-col gap-2 border-b border-aistroyka-border-subtle pb-4">
              <GlassLink
                href="/dashboard"
                className="w-full"
                linkClassName="text-center"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="cta.public.mobile.cabinet"
              >
                {t("cabinet")}
              </GlassLink>
              <GlassLink
                href="/login"
                intensity="subtle"
                className="w-full"
                linkClassName="text-center"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="cta.public.mobile.login"
              >
                {t("login")}
              </GlassLink>
            </div>
            {PRIMARY_NAV.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className={mobileLinkClass}
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
                className={mobileSecondaryLinkClass}
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
                {t("contactUs")}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
