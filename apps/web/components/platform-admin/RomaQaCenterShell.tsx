"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui";
import { ROMA_QA_CENTER_NAV_GROUPS } from "@/lib/platform-admin/roma-qa-center-nav";

export function RomaQaCenterNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="flex shrink-0 flex-col gap-aistroyka-4 lg:w-56"
      aria-label="ROMA system map"
    >
      <p className="mb-aistroyka-1 hidden text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary lg:block">
        System map
      </p>
      <div className="flex gap-aistroyka-3 overflow-x-auto pb-aistroyka-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {ROMA_QA_CENTER_NAV_GROUPS.map((group) => (
          <div key={group.id} className="min-w-[10rem] shrink-0 lg:min-w-0 lg:shrink">
            <p className="mb-aistroyka-1 hidden text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary lg:block">
              {group.label}
            </p>
            <div className="flex gap-aistroyka-2 lg:flex-col">
              {group.items.map((item) => {
                const active = item.exact
                  ? pathname.endsWith(item.href) || pathname.endsWith(`${item.href}/`)
                  : pathname.includes(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`whitespace-nowrap rounded-card px-aistroyka-3 py-aistroyka-2 text-aistroyka-footnote font-medium lg:text-aistroyka-subheadline ${
                      active
                        ? "bg-aistroyka-accent text-white"
                        : "bg-aistroyka-surface-raised text-aistroyka-text-secondary hover:text-aistroyka-accent"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

export function RomaQaCenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-aistroyka-6">
      <div className="rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface px-aistroyka-4 py-aistroyka-3">
        <div className="flex flex-wrap items-center justify-between gap-aistroyka-2">
          <div>
            <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
              Platform Admin · ROMA
            </p>
            <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-secondary">
              Executive operations — read-only intelligence · no test execution
            </p>
          </div>
          <Badge variant="neutral">No execution</Badge>
        </div>
      </div>
      <div className="flex flex-col gap-aistroyka-6 lg:flex-row lg:items-start">
        <RomaQaCenterNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
