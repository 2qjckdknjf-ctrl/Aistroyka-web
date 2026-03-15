"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";

const PRIMARY_NAV = [
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

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[var(--border-main)] bg-[var(--bg-main)]/80 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-main)]/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo href="/" variant="wordmark" height={40} className="min-w-0 shrink-0 hidden sm:block" priority />
        <Logo href="/" variant="wordmark" height={24} className="min-w-0 shrink-0 sm:hidden" priority />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {PRIMARY_NAV.map(({ href, key }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-[var(--radius-main)] px-3 py-2 text-[var(--aistroyka-font-subheadline)] font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--aistroyka-accent-light)] text-[var(--ai-yellow)]"
                    : "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-main)]"
                }`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/contact"
            className="inline-flex min-h-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] px-4 py-2.5 text-[var(--aistroyka-font-subheadline)] font-semibold text-[var(--aistroyka-text-primary)] transition-colors hover:bg-[var(--aistroyka-surface-raised)]"
          >
            {t("requestDemo")}
          </Link>
          <Link
            href="/login"
            className="btn-primary"
          >
            {t("login")}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex min-h-[var(--aistroyka-touch-min)] min-w-[var(--aistroyka-touch-min)] items-center justify-center rounded-[var(--radius-main)] text-[var(--text-main)] hover:bg-white/5 md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`border-t border-[var(--border-main)] bg-[var(--bg-card)] md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
        aria-hidden={!mobileMenuOpen}
      >
        <nav className="flex flex-col gap-0.5 px-4 py-4" aria-label="Main mobile">
          {PRIMARY_NAV.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className="rounded-[var(--radius-main)] px-3 py-3 text-[var(--aistroyka-font-subheadline)] font-medium text-[var(--text-main)] hover:bg-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(key)}
            </Link>
          ))}
          <p className="mt-3 text-[var(--aistroyka-font-caption)] text-[var(--text-muted)]">More</p>
          {SECONDARY_NAV.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className="rounded-[var(--radius-main)] px-3 py-2 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)] hover:bg-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(key)}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-[var(--aistroyka-border-subtle)] pt-4">
            <Link
              href="/contact"
              className="rounded-[var(--radius-main)] border border-[var(--border-main)] bg-transparent px-4 py-3 text-center text-[var(--aistroyka-font-subheadline)] font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("requestDemo")}
            </Link>
            <Link
              href="/login"
              className="btn-primary text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("login")}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
