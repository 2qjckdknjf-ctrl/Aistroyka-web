/**
 * Production login UI must not expose internal auth step strings (PD-P1-01).
 * Keep step state + console logging elsewhere; only gate the visible label.
 */
export function shouldShowLoginStepDebug(nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return nodeEnv === "development";
}
