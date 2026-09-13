/**
 * Client/server gate for optional flywheel feedback UI.
 * Must match server capture flags — non-NEXT_PUBLIC env vars are false in browser bundles.
 */

import { isAiFeedbackCaptureEnabled } from "./flags";

/** When false, optional feedback UI must not render (production default). */
export function isAiFeedbackCaptureUiEnabled(): boolean {
  return isAiFeedbackCaptureEnabled();
}
