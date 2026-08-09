/**
 * @vitest-environment jsdom
 *
 * Component-level regression for shared Modal (PD-P1-03).
 * Proven gap: vitest default is node (no document); jsdom is the minimal
 * installed harness that can mount the real Modal without Playwright infra.
 */
import {
  createElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFocusableElements } from "./modal-focus";
import { Modal } from "./Modal";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("./modal-focus", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./modal-focus")>();
  return {
    ...actual,
    getFocusableElements: vi.fn(actual.getFocusableElements),
  };
});

async function flushFrames(times = 2): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    // eslint-disable-next-line no-await-in-loop -- sequential rAF flush
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    });
  }
}

function pressKey(key: string, init: KeyboardEventInit = {}): void {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
  );
}

describe("Modal accessibility behavior (PD-P1-03)", () => {
  let host: HTMLDivElement;
  let root: Root;
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Required for React 19 act() under vitest/jsdom.
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    onClose = vi.fn();
    vi.mocked(getFocusableElements).mockImplementation(
      (container: ParentNode) =>
        Array.from(
          container.querySelectorAll<HTMLElement>(
            [
              "a[href]",
              "button:not([disabled])",
              "textarea:not([disabled])",
              "input:not([disabled]):not([type='hidden'])",
              "select:not([disabled])",
              "[tabindex]:not([tabindex='-1'])",
            ].join(","),
          ),
        ).filter((el) => {
          if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") {
            return false;
          }
          if (el.tabIndex < 0 && el.tagName !== "A") return false;
          return true;
        }),
    );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    vi.clearAllMocks();
  });

  function renderModal(props: {
    open?: boolean;
    title?: string;
    children?: ReactNode;
    onClose?: () => void;
  } = {}): void {
    const {
      open = true,
      title = "Test dialog",
      children = createElement(
        "div",
        null,
        createElement("button", { type: "button", "data-testid": "first" }, "First"),
        createElement("button", { type: "button", "data-testid": "second" }, "Second"),
      ),
      onClose: closeHandler = onClose,
    } = props;

    act(() => {
      root.render(
        createElement(Modal, { open, onClose: closeHandler, title }, children),
      );
    });
  }

  function dialog(): HTMLElement {
    const el = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!el) throw new Error("dialog not found");
    return el;
  }

  function panel(): HTMLElement {
    const el = dialog().querySelector<HTMLElement>(".relative");
    if (!el) throw new Error("panel not found");
    return el;
  }

  function closeButton(): HTMLButtonElement {
    const el = dialog().querySelector<HTMLButtonElement>('button[aria-label="close"]');
    if (!el) throw new Error("close button not found");
    return el;
  }

  it("moves focus to the first interactive control on open", async () => {
    const opener = document.createElement("button");
    opener.type = "button";
    opener.textContent = "Open";
    document.body.appendChild(opener);
    opener.focus();

    renderModal();
    await flushFrames();

    expect(document.activeElement).toBe(
      dialog().querySelector('[data-testid="first"]'),
    );
    opener.remove();
  });

  it("wraps Tab from the last focusable to the first", async () => {
    renderModal();
    await flushFrames();

    const first = dialog().querySelector<HTMLElement>('[data-testid="first"]')!;
    const last = closeButton();
    last.focus();
    expect(document.activeElement).toBe(last);

    act(() => {
      pressKey("Tab");
    });

    expect(document.activeElement).toBe(first);
  });

  it("wraps Shift+Tab from the first focusable to the last", async () => {
    renderModal();
    await flushFrames();

    const first = dialog().querySelector<HTMLElement>('[data-testid="first"]')!;
    const last = closeButton();
    first.focus();

    act(() => {
      pressKey("Tab", { shiftKey: true });
    });

    expect(document.activeElement).toBe(last);
  });

  it("calls onClose exactly once on Escape", async () => {
    renderModal();
    await flushFrames();

    act(() => {
      pressKey("Escape");
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      pressKey("Escape");
    });
    // Still mounted open: each Escape invokes onClose once (no duplicate per key).
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("restores focus to the opener after close", async () => {
    function Harness(): ReactElement {
      const [open, setOpen] = useState(false);
      return createElement(
        "div",
        null,
        createElement(
          "button",
          {
            type: "button",
            "data-testid": "opener",
            onClick: () => setOpen(true),
          },
          "Open",
        ),
        createElement(
          Modal,
          {
            open,
            onClose: () => setOpen(false),
            title: "Restore focus",
          },
          createElement("button", { type: "button", "data-testid": "inside" }, "Inside"),
        ),
      );
    }

    act(() => {
      root.render(createElement(Harness));
    });

    const opener = host.querySelector<HTMLButtonElement>('[data-testid="opener"]')!;
    act(() => {
      opener.focus();
      opener.click();
    });
    await flushFrames();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    act(() => {
      pressKey("Escape");
    });
    await flushFrames();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("keeps focus inside the dialog when there are no focusable children", async () => {
    // Public Modal always renders a close control; empty children still focus that control.
    renderModal({
      children: createElement("p", null, "No interactive children"),
    });
    await flushFrames();

    expect(dialog().contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(closeButton());

    // Empty focusable list path: Tab keeps focus on the dialog panel.
    vi.mocked(getFocusableElements).mockReturnValue([]);
    const dialogPanel = panel();
    dialogPanel.focus();

    act(() => {
      pressKey("Tab");
    });

    expect(document.activeElement).toBe(dialogPanel);
  });

  it("wires aria-labelledby to a real unique title element", async () => {
    renderModal({ title: "Unique title" });
    await flushFrames();

    const labelledBy = dialog().getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl).not.toBeNull();
    expect(titleEl?.tagName).toBe("H2");
    expect(titleEl?.textContent).toBe("Unique title");
  });

  it("closes via backdrop click and close button", async () => {
    renderModal();
    await flushFrames();

    const backdrop = dialog().querySelector<HTMLElement>('[aria-hidden]')!;
    act(() => {
      backdrop.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    act(() => {
      closeButton().click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("removes the keydown listener on unmount and does not call onClose after", async () => {
    renderModal();
    await flushFrames();

    act(() => {
      root.unmount();
    });

    act(() => {
      pressKey("Escape");
    });

    expect(onClose).not.toHaveBeenCalled();

    // Re-create root so afterEach unmount is safe.
    root = createRoot(host);
  });
});
