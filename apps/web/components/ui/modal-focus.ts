/** Focusable controls inside a dialog panel (PD-P1-03). */
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusableElements(container: ParentNode): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") return false;
    if (el.tabIndex < 0 && el.tagName !== "A") return false;
    return true;
  });
}

/** Compute wrap-around index for Tab / Shift+Tab within a focus trap. */
export function getNextFocusIndex(current: number, count: number, shiftKey: boolean): number {
  if (count <= 0) return -1;
  if (shiftKey) {
    return current <= 0 ? count - 1 : current - 1;
  }
  return current >= count - 1 ? 0 : current + 1;
}
