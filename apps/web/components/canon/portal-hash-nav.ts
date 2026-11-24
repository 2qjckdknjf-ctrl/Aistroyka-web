/** Same-page portal hash navigation (Next Link often skips scroll when already on the URL). */
export function scrollToPortalHash(targetHash: string): void {
  const id = targetHash.replace(/^#/, "");
  if (!id || typeof document === "undefined") return;
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function applyPortalHash(targetHash: string): void {
  if (typeof window === "undefined") return;
  const normalized = targetHash.startsWith("#") ? targetHash : `#${targetHash}`;
  if (window.location.hash !== normalized) {
    window.history.pushState(null, "", normalized);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
  scrollToPortalHash(normalized);
}
