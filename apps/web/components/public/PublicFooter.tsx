"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const PRODUCT_LINKS = [
  { href: "/platform", key: "platform" as const },
  { href: "/features", key: "features" as const },
  { href: "/solutions", key: "solutions" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/enterprise", key: "enterprise" as const },
] as const;

const RESOURCE_LINKS = [
  { href: "/ai-construction-control", key: "aiControl" as const },
  { href: "/ai-demo", key: "aiDemo" as const },
  { href: "/copilot", key: "copilot" as const },
  { href: "/mobile", key: "mobile" as const },
  { href: "/integrations", key: "integrations" as const },
  { href: "/api", key: "api" as const },
  { href: "/workflows", key: "workflows" as const },
  { href: "/docs", key: "docs" as const },
  { href: "/cases", key: "cases" as const },
  { href: "/security", key: "security" as const },
  { href: "/projects-showcase", key: "projectsShowcase" as const },
] as const;

const COMPANY_LINKS = [
  { href: "/about", key: "about" as const },
  { href: "/contact", key: "contact" as const },
  { href: "/implementation", key: "implementation" as const },
  { href: "/partners", key: "partners" as const },
  { href: "/faq", key: "faq" as const },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", key: "privacy" as const },
  { href: "/terms", key: "terms" as const },
] as const;

export function PublicFooter() {
  const t = useTranslations("public.nav");
  const tFooter = useTranslations("public.footer");

  return (
    <footer className="surface-glass-chrome border-t border-[var(--lg-border)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Link
              href="/"
              className="font-heading text-[var(--aistroyka-font-title3)] font-semibold uppercase tracking-[0.14em] text-aistroyka-accent"
            >
              AISTROYKA
            </Link>
            <p className="mt-2 text-aistroyka-footnote text-aistroyka-text-secondary">
              {tFooter("tagline")}
            </p>
          </div>
          <div>
            <h3 className="font-heading text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
              {tFooter("product")}
            </h3>
            <ul className="mt-3 space-y-2">
              {PRODUCT_LINKS.map(({ href, key }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-aistroyka-footnote text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
              {tFooter("resources")}
            </h3>
            <ul className="mt-3 space-y-2">
              {RESOURCE_LINKS.map(({ href, key }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-aistroyka-footnote text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
              {tFooter("company")}
            </h3>
            <ul className="mt-3 space-y-2">
              {COMPANY_LINKS.map(({ href, key }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-aistroyka-footnote text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">
              {tFooter("legal")}
            </h3>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map(({ href, key }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-aistroyka-footnote text-aistroyka-text-secondary hover:text-aistroyka-text-primary"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-aistroyka-border-subtle pt-8 text-center text-aistroyka-caption text-aistroyka-text-secondary">
          {tFooter("copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
