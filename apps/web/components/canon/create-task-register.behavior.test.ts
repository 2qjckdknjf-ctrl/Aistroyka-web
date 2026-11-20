/**
 * @vitest-environment jsdom
 *
 * V2-WEB-01: Create Task registration must not cause a Maximum update depth loop.
 * Mirrors the fixed parent/child callback contract used by DashboardTasksCanonPage +
 * DashboardTasksClient without mounting the full tasks workspace.
 */
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

async function flushFrames(times = 4): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    // eslint-disable-next-line no-await-in-loop -- sequential rAF flush
    await act(async () => {
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
    });
  }
}

/** Fixed pattern: stable parent callback + child openCreate via useCallback/ref. */
function FixedChild({
  onRegisterCreateHandler,
}: {
  onRegisterCreateHandler?: (openCreate: () => void) => void;
}) {
  const [, setCreateOpen] = useState(false);
  const openCreateForm = useCallback(() => setCreateOpen(true), []);
  const registerRef = useRef(onRegisterCreateHandler);
  registerRef.current = onRegisterCreateHandler;
  useEffect(() => {
    registerRef.current?.(openCreateForm);
  }, [openCreateForm]);
  return createElement("div", { "data-testid": "child" });
}

function FixedParent({ onParentRender }: { onParentRender: () => void }) {
  onParentRender();
  const [, setOpenCreate] = useState<(() => void) | null>(null);
  const registerCreateHandler = useCallback((open: () => void) => {
    setOpenCreate(() => open);
  }, []);
  return createElement(FixedChild, {
    onRegisterCreateHandler: registerCreateHandler,
  });
}

/**
 * Intentionally unstable parent (audit Oct-19): used only to prove the child ref
 * defense still settles when the parent keeps passing a fresh inline register.
 */
function UnstableParent({ onParentRender }: { onParentRender: () => void }) {
  onParentRender();
  const [, setOpenCreate] = useState<(() => void) | null>(null);
  return createElement(FixedChild, {
    onRegisterCreateHandler: (open) => setOpenCreate(() => open),
  });
}

describe("V2-WEB-01 create-task registration", () => {
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

  it("stable parent+child registration settles within a few parent renders", async () => {
    let renders = 0;
    await act(async () => {
      root.render(
        createElement(FixedParent, {
          onParentRender: () => {
            renders += 1;
          },
        }),
      );
    });
    await flushFrames(6);
    expect(renders).toBeLessThanOrEqual(4);
    expect(host.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("child ref defense settles even when parent register identity is unstable", async () => {
    let renders = 0;
    await act(async () => {
      root.render(
        createElement(UnstableParent, {
          onParentRender: () => {
            renders += 1;
          },
        }),
      );
    });
    await flushFrames(6);
    expect(renders).toBeLessThanOrEqual(4);
    expect(host.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
