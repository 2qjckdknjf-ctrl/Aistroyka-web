"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui";
import {
  ROMA_QA_CENTER_NAV_GROUPS,
  type RomaQaCenterNavGroup,
} from "@/lib/platform-admin/roma-qa-center-nav";
import {
  loadNavGroupExpandedState,
  saveNavGroupExpandedState,
} from "@/lib/platform-admin/executive-dashboard-ui";

function isGroupActive(group: RomaQaCenterNavGroup, pathname: string): boolean {
  return group.items.some((item) =>
    item.exact
      ? pathname.endsWith(item.href) || pathname.endsWith(`${item.href}/`)
      : pathname.includes(item.href)
  );
}

export function RomaQaCenterNav() {
  const pathname = usePathname() ?? "";
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = loadNavGroupExpandedState();
    const initial: Record<string, boolean> = {};
    for (const group of ROMA_QA_CENTER_NAV_GROUPS) {
      initial[group.id] = stored[group.id] ?? group.id === "overview" || isGroupActive(group, pathname);
    }
    setExpanded(initial);
  }, [pathname]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      saveNavGroupExpandedState(next);
      return next;
    });
  }, []);

  const groups = useMemo(() => ROMA_QA_CENTER_NAV_GROUPS, []);

  return (
    <nav className="flex shrink-0 flex-col gap-aistroyka-2 lg:w-56" aria-label="ROMA navigation">
      <p className="mb-aistroyka-1 hidden text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary lg:block">
        Navigation
      </p>
      <div className="flex gap-aistroyka-3 overflow-x-auto pb-aistroyka-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {groups.map((group) => {
          const isOpen = expanded[group.id] ?? group.id === "overview";
          const groupActive = isGroupActive(group, pathname);
          return (
            <div key={group.id} className="min-w-[10rem] shrink-0 lg:min-w-0 lg:shrink">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className={`mb-aistroyka-1 hidden w-full items-center justify-between rounded-lg px-aistroyka-2 py-aistroyka-1 text-left text-aistroyka-caption font-semibold uppercase tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aistroyka-accent lg:flex ${
                  groupActive ? "text-aistroyka-accent" : "text-aistroyka-text-tertiary"
                }`}
              >
                <span>{group.label}</span>
                <span aria-hidden className="text-aistroyka-text-tertiary">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <p className="mb-aistroyka-1 text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary lg:hidden">
                {group.label}
              </p>
              <div className={`flex gap-aistroyka-2 lg:flex-col ${isOpen ? "" : "lg:hidden"}`}>
                  {group.items.map((item) => {
                    const active = item.exact
                      ? pathname.endsWith(item.href) || pathname.endsWith(`${item.href}/`)
                      : pathname.includes(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`whitespace-nowrap rounded-xl px-aistroyka-3 py-aistroyka-2 text-aistroyka-footnote font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aistroyka-accent lg:text-aistroyka-subheadline ${
                          active
                            ? "bg-aistroyka-accent text-white"
                            : "text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised hover:text-aistroyka-accent"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function RomaQaCenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-aistroyka-6">
      <div className="rounded-2xl bg-aistroyka-surface-raised/60 px-aistroyka-4 py-aistroyka-4 sm:px-aistroyka-5">
        <div className="flex flex-wrap items-center justify-between gap-aistroyka-2">
          <div>
            <p className="text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary">
              AISTROYKA · ROMA
            </p>
            <p className="mt-aistroyka-1 text-aistroyka-footnote text-aistroyka-text-secondary">
              Executive operations center — read-only
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
