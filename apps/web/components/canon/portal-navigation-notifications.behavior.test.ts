/** @vitest-environment jsdom */
import { act, createElement, type AnchorHTMLAttributes } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CanonPortalBottomNav } from "./CanonPortalBottomNav";
import { CanonNotificationBell } from "./CanonNotificationBell";
import { ClientPortalNotificationsSection } from "@/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalNotificationsSection";

const state = vi.hoisted(() => ({ pathname: "", intercepted: false, applyHash: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("./portal-hash-nav", () => ({ applyPortalHash: state.applyHash }));
vi.mock("@/i18n/navigation", () => {
  const react = require("react") as typeof import("react");
  return {
    usePathname: () => state.pathname,
    Link: ({ onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
      react.createElement("a", {
        ...props,
        onClick: (event: import("react").MouseEvent<HTMLAnchorElement>) => {
          onClick?.(event);
          state.intercepted = event.defaultPrevented;
          // Avoid jsdom attempting navigation after observing component behavior.
          event.preventDefault();
        },
      }),
  };
});

const projectId = "project-a";
const overview = `/dashboard/projects/${projectId}/client`;

describe("portal navigation and read state", () => {
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    state.pathname = overview;
    state.intercepted = false;
    state.applyHash.mockClear();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ data: [], unread: 0 }) })));
  });

  afterEach(() => {
    act(() => root.unmount());
    client.clear();
    host.remove();
  });

  async function render(children: import("react").ReactNode) {
    await act(async () => root.render(createElement(QueryClientProvider, { client }, children)));
  }

  it.each(["discussions", "defects", "handover"])("navigates from %s to the overview sections", async (subpage) => {
    state.pathname = `${overview}/${subpage}`;
    await render(createElement("div", null,
      createElement(CanonPortalBottomNav),
      createElement(CanonNotificationBell, { mode: "portal", projectId, href: `${overview}#portal-notifications` }),
    ));
    for (const hash of ["portal-documents", "portal-approvals", "portal-notifications"]) {
      const link = host.querySelector<HTMLAnchorElement>(`a[href="${overview}#${hash}"]`);
      expect(link).not.toBeNull();
      act(() => link!.click());
      expect(state.intercepted).toBe(false);
    }
    expect(state.applyHash).not.toHaveBeenCalled();
  });

  it.each(["", "/"])("scrolls locally on the exact overview with trailing suffix %j", async (suffix) => {
    state.pathname = `${overview}${suffix}`;
    await render(createElement(CanonPortalBottomNav));
    const link = host.querySelector<HTMLAnchorElement>(`a[href="${overview}#portal-documents"]`);
    act(() => link!.click());
    expect(state.intercepted).toBe(true);
    expect(state.applyHash).toHaveBeenCalledWith("#portal-documents");
  });

  it("refreshes the rendered bell after an update is marked read", async () => {
    let read = false;
    let bellReads = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (options?.method === "POST") {
        read = true;
        return { ok: true };
      }
      if (url.endsWith("?limit=1")) bellReads += 1;
      return {
        ok: true,
        json: async () => ({
          data: [{ id: "n1", kind: "update", title: "Site update", body: null,
            read_at: read ? "2026-11-25T12:00:00Z" : null, created_at: "2026-11-25T11:00:00Z" }],
          unread: read ? 0 : 1,
        }),
      };
    }));
    await render(createElement("div", null,
      createElement(CanonNotificationBell, { mode: "portal", projectId }),
      createElement(ClientPortalNotificationsSection, { projectId, surface: "canon" }),
    ));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(host.querySelector(".canon-notify-badge")?.textContent).toBe("1");
    const markRead = [...host.querySelectorAll("button")].find(x => x.textContent === "markAsRead");
    expect(markRead).toBeDefined();
    await act(async () => { markRead!.click(); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(bellReads).toBe(2);
    expect(host.querySelector(".canon-notify-badge")).toBeNull();
    expect([...host.querySelectorAll("button")].some(x => x.textContent === "markAsRead")).toBe(false);
  });
});
