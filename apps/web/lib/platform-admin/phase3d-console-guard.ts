/** Pure helpers for Phase 3D browser harness (unit-testable). */

export function isIgnorablePhase3dConsoleError(text: string): boolean {
  if (/favicon|\[login\]|React DevTools|hydration|Download the React/i.test(text)) return true;
  // Expected fail-closed probe noise (Chrome "Failed to load resource" for 403/404/503).
  if (/Failed to load resource:.*\b(403|404|503)\b/i.test(text)) return true;
  return false;
}
