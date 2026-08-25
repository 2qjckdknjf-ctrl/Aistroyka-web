"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Menu, X } from "lucide-react";
import { V41PilotButton } from "./v41/V41PilotButton";
import { V41_ASSETS } from "./v41/v41-assets";
import { PublicLocaleSwitcher } from "./PublicLocaleSwitcher";

const PRIMARY_NAV = [
  { href: "/platform", key: "platform" as const },
  { href: "/features", key: "features" as const },
  { href: "/solutions", key: "solutions" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/about", key: "about" as const },
] as const;

export function PublicHeader() {
  const t = useTranslations("public.nav");
  const tCta = useTranslations("public.cta");
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  return (
    <header className={`v41-header v41-glass${scrolled ? " is-scrolled" : ""}`}>
      <Link href="/" aria-label="AISTROYKA">
        <img className="v41-logo" src={V41_ASSETS.wordmark} alt="AISTROYKA" width={160} height={32} />
      </Link>
      <nav className="v41-desktop-nav" aria-label={t("main")}>
        {PRIMARY_NAV.map(({ href, key }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} aria-current={isActive ? "page" : undefined}>
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <div className="v41-header-actions">
        <PublicLocaleSwitcher />
        <Link href="/dashboard" className="v41-cabinet-link" data-testid="cta.public.header.cabinet">
          {t("cabinet")}
        </Link>
        <Link href="/login" className="v41-login-link">
          {t("login")}
        </Link>
        <V41PilotButton className="v41-btn v41-btn-primary v41-btn-compact" testId="cta.public.header.launch-pilot">
          {tCta("launchPilot")} <ArrowRight size={17} />
        </V41PilotButton>
        <button
          type="button"
          className="v41-icon-button v41-menu-button"
          aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileMenuOpen ? (
        <nav id="mobile-menu" className="v41-mobile-nav v41-glass" aria-label={t("mainMobile")}>
          {PRIMARY_NAV.map(({ href, key }) => (
            <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
              {t(key)}
            </Link>
          ))}
          <Link href="/dashboard" data-testid="cta.public.mobile.cabinet" onClick={() => setMobileMenuOpen(false)}>
            {t("cabinet")}
          </Link>
          <Link href="/login" data-testid="cta.public.mobile.login" onClick={() => setMobileMenuOpen(false)}>
            {t("login")}
          </Link>
          <V41PilotButton className="v41-btn v41-btn-primary">{tCta("launchPilot")}</V41PilotButton>
          <PublicLocaleSwitcher compact />
        </nav>
      ) : null}
    </header>
  );
}
