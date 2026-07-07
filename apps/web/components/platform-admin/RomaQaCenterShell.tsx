"use client";

import { useCallback, useEffect, useState } from "react";
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

function isNavItemActive(item: RomaQaCenterNavGroup["items"][number], pathname: string): boolean {
  return item.exact
    ? pathname.endsWith(item.href) || pathname.endsWith(`${item.href}/`)
    : pathname.includes(item.href);
}

function buildInitialExpanded(pathname: string): Record<string, boolean> {
  const stored = loadNavGroupExpandedState();
  const initial: Record<string, boolean> = { ...stored };
  for (const group of ROMA_QA_CENTER_NAV_GROUPS) {
    if (initial[group.id] === undefined) {
      initial[group.id] = group.id === "overview";
    }
    if (isGroupActive(group, pathname)) {
      initial[group.id] = true;
    }
  }
  return initial;
}

export function RomaQaCenterNav() {
  const pathname = usePathname() ?? "";
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => buildInitialExpanded(pathname));

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const group of ROMA_QA_CENTER_NAV_GROUPS) {
        if (isGroupActive(group, pathname)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      saveNavGroupExpandedState(next);
      return next;
    });
  }, []);

  return (
    <nav className="flex shrink-0 flex-col gap-aistroyka-2 lg:w-56" aria-label="Operations Center navigation">
      <p className="mb-aistroyka-1 hidden text-aistroyka-caption font-semibold uppercase tracking-wide text-aistroyka-text-tertiary lg:block">
        Navigation
      </p>
      <div className="flex gap-aistroyka-3 overflow-x-auto pb-aistroyka-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {ROMA_QA_CENTER_NAV_GROUPS.map((group) => {
          const isOpen = expanded[group.id] ?? group.id === "overview";
          const groupActive = isGroupActive(group, pathname);
          const panelId = `roma-nav-group-${group.id}`;
          return (
            <div key={group.id} className="min-w-[10rem] shrink-0 lg:min-w-0 lg:shrink">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
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
              <div
                id={panelId}
                className={`flex gap-aistroyka-2 lg:flex-col ${isOpen ? "" : "lg:hidden"}`}
              >
                {group.items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
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
              Operations Center — read-only intelligence for platform owners
            </p>
          </div>
          <Badge variant="neutral">Read-only</Badge>
        </div>
      </div>
      <div className="flex flex-col gap-aistroyka-6 lg:flex-row lg:items-start">
        <RomaQaCenterNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
