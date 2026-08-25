"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { V41_ASSETS } from "./v41/v41-assets";
import { PublicLocaleSwitcher } from "./PublicLocaleSwitcher";

const PRODUCT_LINKS = [
  { href: "/platform", key: "platform" as const },
  { href: "/features", key: "features" as const },
  { href: "/solutions", key: "solutions" as const },
  { href: "/pricing", key: "pricing" as const },
] as const;

const COMPANY_LINKS = [
  { href: "/about", key: "about" as const },
  { href: "/contact", key: "contact" as const },
  { href: "/partners", key: "partners" as const },
  { href: "/security", key: "security" as const },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", key: "privacy" as const },
  { href: "/terms", key: "terms" as const },
] as const;

export function PublicFooter() {
  const t = useTranslations("public.nav");
  const tFooter = useTranslations("public.footer");
  const tV41 = useTranslations("public.v41");

  return (
    <footer className="v41-footer">
      <div className="v41-page v41-footer-grid">
        <div>
          <Link href="/" aria-label="AISTROYKA">
            <img className="v41-logo" src={V41_ASSETS.wordmark} alt="AISTROYKA" width={160} height={32} />
          </Link>
          <p>{tV41("footerTagline")}</p>
        </div>
        <div>
          <strong>{tFooter("product")}</strong>
          {PRODUCT_LINKS.map(({ href, key }) => (
            <Link key={href} href={href}>
              {t(key)}
            </Link>
          ))}
        </div>
        <div>
          <strong>{tFooter("company")}</strong>
          {COMPANY_LINKS.map(({ href, key }) => (
            <Link key={href} href={href}>
              {t(key)}
            </Link>
          ))}
        </div>
        <div>
          <strong>{tFooter("legal")}</strong>
          {LEGAL_LINKS.map(({ href, key }) => (
            <Link key={href} href={href}>
              {t(key)}
            </Link>
          ))}
        </div>
      </div>
      <div className="v41-page v41-footer-bottom">
        <span>{tFooter("copyright", { year: new Date().getFullYear() })}</span>
        <PublicLocaleSwitcher />
        <span>{tV41("footerLine")}</span>
      </div>
    </footer>
  );
}
