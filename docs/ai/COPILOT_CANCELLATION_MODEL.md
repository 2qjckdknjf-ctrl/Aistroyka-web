# Copilot Cancellation Model

**Date:** 2026-03-19  
**Purpose:** End-to-end cancellation behavior for Chat Copilot; Brief is non-stream and has no cancel.

---

## 1. Where cancellation applies

- **Chat Copilot (stream):** User can click "Cancel" while a stream is in progress. Cancellation is supported end-to-end.
- **Brief Copilot:** Single GET request; no stream, no Cancel button. In-flight request completes even if user navigates away. No change required.

---

## 2. Chat: client → server

| Layer | Behavior |
|-------|----------|
| UI | CopilotChatPanel: handleCancel() calls abortRef.current.abort(); setStreamingContent(""). Cancel button shown when isPending. |
| Hook | useCopilotThread: sendMessageMutation receives signal (AbortController.signal) in variables; passed to sendChatMessageStream(..., { signal }). |
| API | chatApi.sendChatMessageStream: fetch(streamUrl, { signal: params.signal ?? undefined }). So client AbortController is wired to the fetch. |
| Server | request.signal is the incoming request’s AbortSignal (from fetch). stream/route.ts: request.signal?.addEventListener("abort", () => abortCtrl.abort()). So when client aborts fetch, request is aborted and abortCtrl aborts. |

**Result:** Client cancel → fetch aborted → request.signal aborted → abortCtrl.abort() → OpenAI fetch (which uses abortCtrl.signal) is aborted.

---

## 3. Chat: server lifecycle on cancel

1. **OpenAI fetch** uses signal: abortCtrl.signal → throws AbortError when aborted.
2. **Catch block** in stream route:
   - isAbort = err.name === "AbortError" || err.message?.includes("aborted")
   - clientGone = request.signal?.aborted
   - errorKind: if isAbort && streamTimedOut && !clientGone → "provider_timeout"; else if isAbort → "cancellation"
3. **Response:** send("error", { kind: "cancelled", message: "Something went wrong", retryable: false }).
4. **Persistence:** Server can persist an assistant message with content "Sorry, I encountered an error..." and error_kind "cancelled" (best-effort).
5. **Cleanup:** clearTimeout(timeoutId); controller.close() in finally.

---

## 4. Chat: UI state after cancel

- **Client:** Promise from sendChatMessageStream rejects (AbortError or similar). .catch clears streamingContent; .finally sets abortRef.current = null. onSuccess is not called, so thread query is not invalidated.
- **Display:** Streaming bubble disappears; thread list still shows previous messages. No new assistant message from this request (or an error message if server persisted one). User can send again or refetch; no ambiguous "loading forever" state.

---

## 5. Partial cancellation / limits

- **Timeout:** 60s server-side timeout aborts the stream (abortCtrl.abort()). Treated as provider_timeout (retryable), not user cancellation.
- **Persistence on cancel:** Server may insert an error assistant message; client does not add a synthetic message. So thread might have user message + optional server-side error message after cancel.
- **Refetch:** After cancel, thread is not auto-invalidated. Next send or manual refetch will show latest state. Acceptable.

---

## 6. Summary

| Question | Answer |
|----------|--------|
| Is cancellation wired UI → backend? | Yes. AbortController in panel → signal in sendChatMessageStream → fetch signal → request.signal → abortCtrl in route. |
| Does backend stop work on cancel? | Yes. OpenAI fetch uses abortCtrl.signal; abort stops the request. |
| Is UI state coherent after cancel? | Yes. Streaming content cleared; no infinite loading. Thread may show user message only until next refetch. |
| Brief cancellation? | N/A (no stream). |
