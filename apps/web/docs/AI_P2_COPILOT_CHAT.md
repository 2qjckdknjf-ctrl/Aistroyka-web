# AI P2 — Copilot Chat (conversation layer)

**Scope:** Web only. Backend/edge unchanged. P0/P1 behaviors preserved.

---

## Where the chat lives

- **Project AI page:** `/[locale]/projects/[projectId]/ai`
- **In the AI Copilot panel:** the **Copilot** tab shows the conversation UI (`CopilotChatPanel`).
- Summary and Explain Risk tabs are unchanged (single request/response). Copilot tab is the single source of truth for multi-turn chat.

---

## History storage

- **Location:** `localStorage`
- **Key:** `copilot_thread_<projectId>`
- **Limit:** last 50 messages per project. Older messages are dropped when saving.
- **Clear:** "Clear chat" button in the panel removes the thread for the current project (localStorage key deleted, UI reset).

---

## Streaming abstraction

- **Transport:** `lib/features/ai/transport.ts`
  - `CopilotTransport.sendMessage(params)` — returns `Promise<{ finalText, requestId, meta }>` (or error). Used by the chat today.
  - `streamMessage?(params, onToken)` — optional; when the backend supports SSE/fetch streaming, implement it here and the UI can consume tokens. Today the backend does not stream, so only `sendMessage` is implemented.
- **V1:** No real streaming. Response is returned in one shot; UI shows the full reply when the request completes. A future step can add a typewriter (pseudo-stream) over `finalText` or switch to `streamMessage` when the edge supports it.

---

## Debugging: request_id and low-confidence

- **request_id:** Shown in the chat for the latest assistant message (inline under the bubble) and in the **Copy request ID** button. In dev/staging, the **Diagnostics** block also shows `request_id`, `low_confidence`, `fallback_reason`, `error_kind`. Use the same value in backend logs for correlation.
- **Low-confidence:** When the engine sets `groundedness_passed === false` or `retrieval_low_confidence === true`, the chat shows the existing **LowConfidenceNotice** (expandable "Why this happened?" and "Suggest a follow-up question"). The last assistant message is stored with `lowConfidence: true`.
- **Errors:** Failed assistant replies are stored with `errorKind`; the panel shows **AiErrorBanner** (same P0 UX: countdown for rate limit, Retry when retryable, request_id in footer).

---

## Files

- `lib/features/ai/types.ts` — `ChatMessage`, `ChatThread`
- `lib/features/ai/storage.ts` — get/save/clear thread, `generateMessageId`
- `lib/features/ai/transport.ts` — `CopilotTransport`, `defaultTransport` (askCopilot)
- `lib/features/ai/api/useCopilotThread.ts` — `useCopilotThread(projectId)` (query + send mutation + clearChat)
- `lib/features/ai/components/CopilotChatPanel.tsx` — chat UI (messages, input, Send, Clear, Copy request_id, low-confidence, error, diagnostics)
- `lib/engine/queryKeys.ts` — `queryKeys.thread(projectId)`, `aiKeys.thread(projectId)`
- `components/ai/AiActionPanel.tsx` — Copilot tab renders `CopilotChatPanel` when `projectId` is set.
