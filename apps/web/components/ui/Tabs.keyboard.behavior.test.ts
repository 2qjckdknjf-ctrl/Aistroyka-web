/**
 * @vitest-environment jsdom
 *
 * Keyboard interaction regression for shared Tabs (PD-P1-04 remediation).
 */
import { createElement, useState, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Tab, TabPanel, Tabs } from "./Tabs";

function pressKeyOn(target: EventTarget, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function getTabs(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>('[role="tab"]'));
}

function expectOnlySelectedTabIndexed(tabs: HTMLElement[], selectedId: string) {
  for (const tab of tabs) {
    if (tab.id === selectedId) {
      expect(tab.tabIndex).toBe(0);
      expect(tab.getAttribute("aria-selected")).toBe("true");
    } else {
      expect(tab.tabIndex).toBe(-1);
      expect(tab.getAttribute("aria-selected")).toBe("false");
    }
  }
}

function ThreeTabHarness({
  initial = "a",
}: {
  initial?: "a" | "b" | "c";
}): ReactElement {
  const [active, setActive] = useState<"a" | "b" | "c">(initial);
  return createElement(
    "div",
    null,
    createElement(
      Tabs,
      { "aria-label": "Demo tabs", "data-testid": "demo-tabs" },
      createElement(
        Tab,
        {
          id: "tab-a",
          selected: active === "a",
          onSelect: () => setActive("a"),
          "aria-controls": "panel-a",
        },
        "A"
      ),
      createElement(
        Tab,
        {
          id: "tab-b",
          selected: active === "b",
          onSelect: () => setActive("b"),
          "aria-controls": "panel-b",
        },
        "B"
      ),
      createElement(
        Tab,
        {
          id: "tab-c",
          selected: active === "c",
          onSelect: () => setActive("c"),
          "aria-controls": "panel-c",
        },
        "C"
      )
    ),
    createElement(
      TabPanel,
      { id: "panel-a", selected: active === "a", "aria-labelledby": "tab-a" },
      "Panel A"
    ),
    createElement(
      TabPanel,
      { id: "panel-b", selected: active === "b", "aria-labelledby": "tab-b" },
      "Panel B"
    ),
    createElement(
      TabPanel,
      { id: "panel-c", selected: active === "c", "aria-labelledby": "tab-c" },
      "Panel C"
    )
  );
}

describe("Tabs keyboard behavior (PD-P1-04)", () => {
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

  it("keeps only the selected tab in tab order", () => {
    act(() => {
      root.render(createElement(ThreeTabHarness));
    });
    const tabs = getTabs(host);
    expect(tabs).toHaveLength(3);
    expectOnlySelectedTabIndexed(tabs, "tab-a");
    expect(host.querySelector('[role="tablist"]')?.getAttribute("aria-orientation")).toBe(
      "horizontal"
    );
  });

  it("ArrowRight activates the next tab and moves focus", () => {
    act(() => {
      root.render(createElement(ThreeTabHarness));
    });
    const tabs = getTabs(host);
    act(() => {
      tabs[0]?.focus();
    });
    const event = pressKeyOn(tabs[0]!, "ArrowRight");
    expect(event.defaultPrevented).toBe(true);

    const nextTabs = getTabs(host);
    expectOnlySelectedTabIndexed(nextTabs, "tab-b");
    expect(document.activeElement).toBe(nextTabs[1]);
    expect(host.querySelector("#panel-b")?.textContent).toBe("Panel B");
    expect(host.querySelector("#panel-a")).toBeNull();
  });

  it("wraps ArrowRight from last to first and ArrowLeft from first to last", () => {
    act(() => {
      root.render(createElement(ThreeTabHarness, { initial: "c" }));
    });
    let tabs = getTabs(host);
    act(() => {
      tabs[2]?.focus();
    });
    pressKeyOn(tabs[2]!, "ArrowRight");
    tabs = getTabs(host);
    expectOnlySelectedTabIndexed(tabs, "tab-a");
    expect(document.activeElement).toBe(tabs[0]);

    pressKeyOn(tabs[0]!, "ArrowLeft");
    tabs = getTabs(host);
    expectOnlySelectedTabIndexed(tabs, "tab-c");
    expect(document.activeElement).toBe(tabs[2]);
  });

  it("Home and End jump to first and last tabs", () => {
    act(() => {
      root.render(createElement(ThreeTabHarness, { initial: "b" }));
    });
    let tabs = getTabs(host);
    act(() => {
      tabs[1]?.focus();
    });
    pressKeyOn(tabs[1]!, "Home");
    tabs = getTabs(host);
    expectOnlySelectedTabIndexed(tabs, "tab-a");
    expect(document.activeElement).toBe(tabs[0]);

    pressKeyOn(tabs[0]!, "End");
    tabs = getTabs(host);
    expectOnlySelectedTabIndexed(tabs, "tab-c");
    expect(document.activeElement).toBe(tabs[2]);
    expect(host.querySelector("#panel-c")?.getAttribute("aria-labelledby")).toBe("tab-c");
  });

  it("keeps click activation working", () => {
    act(() => {
      root.render(createElement(ThreeTabHarness));
    });
    const tabs = getTabs(host);
    act(() => {
      tabs[2]?.click();
    });
    const after = getTabs(host);
    expectOnlySelectedTabIndexed(after, "tab-c");
    expect(host.querySelector("#panel-c")?.textContent).toBe("Panel C");
  });

  it("does not capture unrelated keys or affect a neighboring tablist", () => {
    function DualLists(): ReactElement {
      const [left, setLeft] = useState("l1");
      const [right, setRight] = useState("r1");
      return createElement(
        "div",
        null,
        createElement(
          Tabs,
          { "aria-label": "Left", "data-testid": "left-tabs" },
          createElement(
            Tab,
            {
              id: "tab-l1",
              selected: left === "l1",
              onSelect: () => setLeft("l1"),
              "aria-controls": "panel-l1",
            },
            "L1"
          ),
          createElement(
            Tab,
            {
              id: "tab-l2",
              selected: left === "l2",
              onSelect: () => setLeft("l2"),
              "aria-controls": "panel-l2",
            },
            "L2"
          )
        ),
        createElement(
          Tabs,
          { "aria-label": "Right", "data-testid": "right-tabs" },
          createElement(
            Tab,
            {
              id: "tab-r1",
              selected: right === "r1",
              onSelect: () => setRight("r1"),
              "aria-controls": "panel-r1",
            },
            "R1"
          ),
          createElement(
            Tab,
            {
              id: "tab-r2",
              selected: right === "r2",
              onSelect: () => setRight("r2"),
              "aria-controls": "panel-r2",
            },
            "R2"
          )
        )
      );
    }

    act(() => {
      root.render(createElement(DualLists));
    });
    const leftTab = host.querySelector<HTMLElement>("#tab-l1")!;
    const rightSelected = host.querySelector<HTMLElement>("#tab-r1")!;
    act(() => {
      leftTab.focus();
    });
    const enterEvent = pressKeyOn(leftTab, "Enter");
    expect(enterEvent.defaultPrevented).toBe(false);
    expect(leftTab.getAttribute("aria-selected")).toBe("true");
    expect(rightSelected.getAttribute("aria-selected")).toBe("true");

    pressKeyOn(leftTab, "ArrowRight");
    expect(host.querySelector("#tab-l2")?.getAttribute("aria-selected")).toBe("true");
    expect(host.querySelector("#tab-r1")?.getAttribute("aria-selected")).toBe("true");
    expect(host.querySelector("#tab-r2")?.getAttribute("aria-selected")).toBe("false");
  });
});
