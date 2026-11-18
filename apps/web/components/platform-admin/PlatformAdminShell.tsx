"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { PLATFORM_ADMIN_SHELL_NAV_ITEMS } from "@/lib/platform-admin/shell-nav";

export function PlatformAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="min-h-screen bg-aistroyka-bg-primary text-aistroyka-text-primary">
      <header className="surface-glass-chrome border-b border-[var(--lg-border)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-aistroyka-3 px-aistroyka-4 py-aistroyka-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
              Platform admin cabinet
            </p>
            <p className="text-aistroyka-footnote text-aistroyka-text-secondary">
              Isolated cross-tenant control layer · not tenant company admin
            </p>
          </div>
          <nav className="flex flex-wrap gap-aistroyka-2" aria-label="Platform admin">
            {PLATFORM_ADMIN_SHELL_NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname.endsWith(item.href) || pathname.endsWith(`${item.href}/`)
                : pathname.includes(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-card px-aistroyka-3 py-aistroyka-2 text-aistroyka-subheadline font-medium ${
                    active
                      ? "bg-aistroyka-accent text-aistroyka-text-inverse"
                      : "surface-glass-muted text-aistroyka-text-secondary hover:text-aistroyka-accent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-aistroyka-4 py-aistroyka-8">{children}</main>
    </div>
  );
}
