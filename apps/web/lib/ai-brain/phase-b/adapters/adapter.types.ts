/**
 * AI Brain Phase B — Action adapter types.
 */

import type { AiActionDraft, AiActionExecutionPolicy } from "../actions";

export interface AdapterInput {
  draft: AiActionDraft;
  policy: AiActionExecutionPolicy;
}

export interface AdapterResult {
  success: boolean;
  available: boolean;
  output?: unknown;
  error?: string;
  degradationReason?: string;
}
