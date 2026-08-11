/**
 * @vitest-environment jsdom
 *
 * PD-P1-04: one primary project tablist, keyboard reachability, URL sync.
 */
import { createElement, useState, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tab, TabPanel, Tabs } from "@/components/ui/Tabs";
import {
  PROJECT_DETAIL_TAB_IDS,
  projectDetailTabHref,
  resolveProjectDetailTab,
} from "./project-detail-tabs";

function pressKeyOn(target: EventTarget, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
  );
}

function ProjectPrimaryNavHarness({
  projectId = "project-1",
  onNavigate,
}: {
  projectId?: string;
  onNavigate: (href: string) => void;
}): ReactElement {
  const [activeTab, setActiveTab] = useState(resolveProjectDetailTab(null));

  function selectTab(tab: string) {
    const next = resolveProjectDetailTab(tab);
    setActiveTab(next);
    onNavigate(projectDetailTabHref(projectId, next));
  }

  return createElement(
    "div",
    null,
    createElement(
      Tabs,
      {
        "aria-label": "Project sections",
        className: "overflow-x-auto",
        "data-testid": "project-primary-nav",
      },
      ...PROJECT_DETAIL_TAB_IDS.map((tabId) =>
        createElement(
          Tab,
          {
            key: tabId,
            id: `tab-${tabId}`,
            selected: activeTab === tabId,
            onSelect: () => selectTab(tabId),
            "aria-controls": `panel-${tabId}`,
          },
          tabId
        )
      )
    ),
    ...PROJECT_DETAIL_TAB_IDS.map((tabId) =>
      createElement(
        TabPanel,
        {
          key: `panel-${tabId}`,
          id: `panel-${tabId}`,
          selected: activeTab === tabId,
          "aria-labelledby": `tab-${tabId}`,
        },
        `content-${tabId}`
      )
    )
  );
}

describe("project detail primary navigation (PD-P1-04)", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it("exposes one primary tablist with all 11 destinations and URL sync on keyboard/click", () => {
    const onNavigate = vi.fn();
    act(() => {
      root.render(createElement(ProjectPrimaryNavHarness, { onNavigate }));
    });

    const tablist = host.querySelector('[data-testid="project-primary-nav"]');
    expect(tablist?.getAttribute("role")).toBe("tablist");
    expect(host.querySelectorAll('[role="tablist"]')).toHaveLength(1);

    const tabs = Array.from(host.querySelectorAll<HTMLElement>('[role="tab"]'));
    expect(tabs.map((tab) => tab.id)).toEqual(
      PROJECT_DETAIL_TAB_IDS.map((id) => `tab-${id}`)
    );
    expect(tabs[0]?.tabIndex).toBe(0);
    expect(tabs.slice(1).every((tab) => tab.tabIndex === -1)).toBe(true);

    act(() => {
      tabs[0]?.focus();
      pressKeyOn(tabs[0]!, "End");
    });
    expect(onNavigate).toHaveBeenLastCalledWith(
      projectDetailTabHref("project-1", "estimate")
    );
    expect(host.querySelector("#panel-estimate")?.textContent).toBe("content-estimate");
    expect(document.activeElement?.id).toBe("tab-estimate");

    act(() => {
      pressKeyOn(document.activeElement!, "Home");
    });
    expect(onNavigate).toHaveBeenLastCalledWith("/dashboard/projects/project-1");
    expect(host.querySelector("#panel-workers")?.textContent).toBe("content-workers");

    // Reach every destination via ArrowRight wrap cycle.
    const reached = new Set<string>(["workers"]);
    for (let i = 0; i < PROJECT_DETAIL_TAB_IDS.length - 1; i += 1) {
      act(() => {
        pressKeyOn(document.activeElement!, "ArrowRight");
      });
      const selected = host.querySelector('[role="tab"][aria-selected="true"]');
      const tabKey = selected?.id.replace(/^tab-/, "") ?? "";
      reached.add(tabKey);
      expect(host.querySelector(`#panel-${tabKey}`)?.textContent).toBe(`content-${tabKey}`);
    }
    expect(reached.size).toBe(PROJECT_DETAIL_TAB_IDS.length);
    expect([...reached].sort()).toEqual([...PROJECT_DETAIL_TAB_IDS].sort());

    // Click still works for an interior destination.
    const reportsTab = host.querySelector<HTMLElement>("#tab-reports");
    act(() => {
      reportsTab?.click();
    });
    expect(onNavigate).toHaveBeenLastCalledWith(
      "/dashboard/projects/project-1?tab=reports"
    );
    expect(host.querySelector("#panel-reports")?.textContent).toBe("content-reports");
    expect(reportsTab?.tabIndex).toBe(0);
  });
});
