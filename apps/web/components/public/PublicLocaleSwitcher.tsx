"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { localeAgnosticPath } from "./locale-agnostic-path";

export function PublicLocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = localeAgnosticPath(usePathname());
  const locale = useLocale();
  const t = useTranslations("public.nav");

  return (
    <nav className={`v41-locale-switch${compact ? " is-compact" : ""}`} aria-label={t("language")}>
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          aria-current={loc === locale ? "true" : undefined}
          hrefLang={loc}
        >
          {loc}
        </Link>
      ))}
    </nav>
  );
}
