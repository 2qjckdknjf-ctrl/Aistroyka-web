# Copilot Streaming Verification

**Date:** 2026-03-19  
**Purpose:** Strongest realistic verification strategy for Chat Copilot streaming; no fake full E2E if live-provider verification is unavailable.

---

## 1. Scope

- **Route:** POST /api/v1/projects/:id/copilot/chat/stream
- **Behavior:** SSE stream (meta → token(s) → done or error); AbortController propagation; persistence and error handling.

---

## 2. Route-level verification

**What to check:**

- Request with valid tenant/project/auth returns 200 and stream (Content-Type: text/event-stream).
- Request without valid auth returns 401/403.
- Request without OpenAI config returns 503.
- Body validation: missing user_text → 400.

**How:** Unit/integration test with mocked Supabase and mocked fetch to OpenAI. Do not require live OpenAI API key for CI. Mock fetch to simulate stream chunks and verify SSE events (meta, token, done or error).

---

## 3. Parser / transport verification

**SSE format:**

- Lines: `data: ${JSON.stringify(payload)}\n\n`.
- Events: meta (request_id, thread_id, context_tokens_estimated, ...); token (delta); done (request_id, thread_id, final_text, assistant_message_id, ...); error (request_id, retryable, message, kind).

**What to check:**

- Parser in chatApi (sendChatMessageStream): correctly splits lines, parses data: lines, dispatches on event type.
- Token accumulation: client onToken(delta) produces full content when done is received (client responsibility; can test with a small mock stream).

**How:** Unit test with a ReadableStream of SSE lines; assert event order and shapes (meta → N× token → done, or meta → error).

---

## 4. Success / error / done behavior

**Success path:**

- After streamed tokens, server persists assistant message to ai_chat_messages, updates ai_chat_threads.updated_at / last_message_at.
- send("done", { request_id, thread_id, final_text, assistant_message_id, context_tokens_estimated, context_trim_applied }).
- Client receives done; promise resolves; onSuccess invalidates thread query.

**Error path:**

- On OpenAI non-OK response: send("error", ...), no done. Optionally persist error assistant message.
- On fetch throw (AbortError, network): catch → send("error", kind: "cancelled" or "unknown"), persist optional error message, controller.close().

**What to test:**

- Mock stream that emits meta → token → done: verify done payload shape and that no error is sent.
- Mock stream that emits meta → error: verify error payload (kind, retryable) and no done.
- Mock abort after meta: verify error with kind "cancelled" (or equivalent) and cleanup.

---

## 5. Fallback verification

- **chatApi:** When response is 503 or body is not a reader, client can fall back to non-stream sendChatMessage (if available). Verify fallback is triggered on 503 and that no unhandled exception when stream is unavailable.
- **Server:** No fallback to non-stream in the same route; stream route is stream-only. Brief is a separate endpoint.

---

## 6. Manual verification procedure (when full live E2E is unavailable)

1. **Stream shape:** Call stream route with valid auth and body (e.g. via curl or browser). Confirm first line is meta, then token lines, then done (or error). Confirm X-Request-Id and request_id in meta/done match.
2. **Cancel:** Start a long-running stream; cancel from UI. Confirm stream stops, UI shows no infinite loading, and optional error message in thread.
3. **Persistence:** After a successful stream, load thread (getThread or list messages); confirm user message and assistant message exist and assistant_message_id in done matches.

---

## 7. What we do not claim

- We do not claim "full E2E with live OpenAI" unless such a test is actually run in a controlled environment with a real key.
- We do not test exact prose or model output; we test lifecycle (meta → token → done/error) and structure.

---

## 8. Summary

| Check | Method |
|-------|--------|
| Route auth and 503 | Unit/integration test with mocks |
| SSE event order and shape | Unit test with mock ReadableStream |
| Done payload and no duplicate error | Unit test |
| Cancel → error event and cleanup | Unit test with aborted request |
| Fallback on 503 | Unit test |
| Manual stream + cancel + persistence | Runbook / manual procedure |
