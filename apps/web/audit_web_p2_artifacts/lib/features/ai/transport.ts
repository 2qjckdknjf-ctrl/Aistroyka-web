/**
 * P2: Copilot transport abstraction.
 * Backend does not support streaming; streamMessage can be implemented later.
 * sendMessage uses existing askCopilot; UI can pseudo-stream (typewriter) over finalText.
 */

import { askCopilot } from "@/lib/engine/ai";
import type { DecisionContextPayload } from "@/lib/engine/types";
import type { EngineError } from "@/lib/engine/errors";

export interface SendMessageParams {
  projectId: string;
  tenantId: string | null;
  locale: string | null;
  decisionContext: DecisionContextPayload;
  message: string;
  getAuthToken: () => Promise<string | null>;
  signal?: AbortSignal | null;
}

export interface SendMessageResult {
  ok: true;
  finalText: string;
  requestId: string;
  meta: {
    lowConfidence?: boolean;
    fallback_reason?: string | null;
    error_category?: string | null;
  };
}

export interface SendMessageErrorResult {
  ok: false;
  requestId: string;
  error: EngineError;
}

export type SendMessageResponse = SendMessageResult | SendMessageErrorResult;

export interface CopilotTransport {
  sendMessage(params: SendMessageParams): Promise<SendMessageResponse>;
  /** Optional: real SSE/fetch streaming. When absent, UI can pseudo-stream finalText. */
  streamMessage?(
    params: SendMessageParams,
    onToken: (token: string) => void
  ): Promise<SendMessageResponse>;
}

/** V1: non-streaming. Uses askCopilot; UI can apply typewriter over finalText. */
export const defaultTransport: CopilotTransport = {
  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    const res = await askCopilot(params.decisionContext, params.message.trim(), {
      getAuthToken: params.getAuthToken,
      tenant_id: params.tenantId,
      project_id: params.projectId,
      locale: params.locale ?? undefined,
      signal: params.signal ?? null,
    });
    if (!res.ok) {
      return {
        ok: false,
        requestId: res.request_id,
        error: res.error,
      };
    }
    const text = res.payload.summary ?? res.payload.text;
    return {
      ok: true,
      finalText: text ?? "",
      requestId: res.request_id,
      meta: {
        lowConfidence:
          res.payload.groundedness_passed === false || res.payload.retrieval_low_confidence === true,
        fallback_reason: res.payload.fallback_reason ?? null,
        error_category: res.payload.error_category ?? null,
      },
    };
  },
};
