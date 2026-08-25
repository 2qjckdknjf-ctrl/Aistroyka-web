"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const pathname = usePathname();
  return (
    <div className="hidden rounded-full border border-[var(--canon-border-glass)] bg-[rgba(255,255,255,0.04)] p-0.5 sm:flex">
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase text-[var(--canon-text-muted)] transition-colors hover:text-[var(--canon-text-primary)]"
        >
          {loc}
        </Link>
      ))}
    </div>
  );
}
