/**
 * Horizontal tablist keyboard target index (WAI-ARIA automatic activation helpers).
 * Returns null for unrelated keys so callers must not preventDefault.
 */

export function resolveHorizontalTabKeyboardIndex(input: {
  key: string;
  currentIndex: number;
  tabCount: number;
}): number | null {
  const { key, currentIndex, tabCount } = input;
  if (tabCount <= 0 || currentIndex < 0 || currentIndex >= tabCount) {
    return null;
  }

  switch (key) {
    case "ArrowRight":
      return (currentIndex + 1) % tabCount;
    case "ArrowLeft":
      return (currentIndex - 1 + tabCount) % tabCount;
    case "Home":
      return 0;
    case "End":
      return tabCount - 1;
    default:
      return null;
  }
}

export function getDirectTabElements(tablist: ParentNode): HTMLElement[] {
  return Array.from(tablist.children).filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement && node.getAttribute("role") === "tab"
  );
}
