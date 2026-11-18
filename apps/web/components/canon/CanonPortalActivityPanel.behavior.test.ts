/**
 * @vitest-environment jsdom
 *
 * Renders the real portal Recent activity panel against a deterministic
 * in-memory fixture. No staging or production rows are created.
 */
import { createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CanonPortalActivityPanel } from "./CanonPortalActivityPanel";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/navigation", () => {
  // vi.mock is hoisted above imports, so resolve React inside the factory.
  const react = require("react") as typeof import("react");
  return {
    Link: ({
      href,
      className,
      children,
    }: {
      href: string;
      className?: string;
      children?: ReactNode;
    }) => react.createElement("a", { href, className }, children),
  };
});

const PROJECT_ID = "00000000-0000-4000-8000-000000000366";

const PORTAL_ACTIVITY_FIXTURE = [
  {
    id: "photo-old",
    eventType: "photo_upload",
    occurredAt: "2026-09-01T08:00:00.000Z",
    title: "Site photo",
    description: "Older media",
    projectId: PROJECT_ID,
    targetUrl: null,
    actionNeeded: false,
  },
  {
    id: "request-mid",
    eventType: "client_request",
    occurredAt: "2026-09-02T09:00:00.000Z",
    title: "Change request",
    description: "Newer non-media request",
    projectId: PROJECT_ID,
    targetUrl: null,
    actionNeeded: true,
  },
  {
    id: "discussion-new",
    eventType: "discussion_opened",
    occurredAt: "2026-09-03T10:00:00.000Z",
    title: "Stakeholder discussion",
    description: "Newest non-media discussion",
    projectId: PROJECT_ID,
    targetUrl: null,
    actionNeeded: false,
  },
];

describe("CanonPortalActivityPanel rendered order", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (!url.includes(`/api/v1/projects/${PROJECT_ID}/stakeholder-activity`)) {
          return { ok: false, json: async () => ({}) };
        }
        return { ok: true, json: async () => ({ data: PORTAL_ACTIVITY_FIXTURE }) };
      }),
    );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows the newer request and discussion before the older photo", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(CanonPortalActivityPanel, { projectId: PROJECT_ID }),
        ),
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    const gallery = document.querySelector(".canon-portal-gallery");
    expect(gallery).not.toBeNull();
    expect(gallery?.textContent).toContain("portalRecentActivity");

    const titles = [...document.querySelectorAll(".canon-portal-gallery a p.font-medium")].map(
      (node) => node.textContent,
    );
    expect(titles).toEqual(["Stakeholder discussion", "Change request", "Site photo"]);
  });
});
