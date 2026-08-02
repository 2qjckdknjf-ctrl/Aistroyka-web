"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { PLATFORM_ADMIN_SHELL_NAV_ITEMS } from "@/lib/platform-admin/shell-nav";

export function PlatformAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="min-h-screen min-w-0 max-w-[100vw] overflow-x-hidden bg-aistroyka-bg-primary text-aistroyka-text-primary">
      <header className="border-b border-aistroyka-border-subtle bg-aistroyka-surface">
        <div className="mx-auto flex max-w-5xl min-w-0 flex-col gap-aistroyka-3 px-aistroyka-4 py-aistroyka-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
              Platform admin cabinet
            </p>
            <p className="text-aistroyka-footnote text-aistroyka-text-secondary">
              Isolated cross-tenant control layer · not tenant company admin
            </p>
          </div>
          <nav className="flex min-w-0 flex-wrap gap-aistroyka-2" aria-label="Platform admin">
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
                      ? "bg-aistroyka-accent text-white"
                      : "bg-aistroyka-surface-raised text-aistroyka-text-secondary hover:text-aistroyka-accent"
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
