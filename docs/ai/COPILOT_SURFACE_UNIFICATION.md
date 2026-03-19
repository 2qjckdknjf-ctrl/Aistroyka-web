# Copilot Surface Unification

**Date:** 2026-03-19  
**Purpose:** Minimal alignment between Brief and Chat Copilot; document intentional differences; reduce architectural confusion.

---

## 1. Naming and standards

| Term | Usage |
|------|--------|
| **Copilot** | Product name for the management assistant. |
| **Brief Copilot** | Single-shot, use-case–driven summaries (Manager brief, Executive brief, Top risks, etc.). GET copilot?useCase=... |
| **Chat Copilot** | Thread-based conversational assistant. POST copilot/chat/stream. |
| **Copilot brief** | UI label for the Brief Copilot card (e.g. "Copilot brief"). |
| **Chat** | UI label for the Chat Copilot panel ("Chat"). |

Both are "Copilot"; one is brief-by-use-case, one is chat-by-thread. Avoid wording that implies they are unrelated products.

---

## 2. Request / response conventions

| Aspect | Brief | Chat (stream) |
|--------|--------|----------------|
| Method | GET | POST |
| Auth | Same (tenant/project from request) | Same |
| Request id | X-Request-Id | X-Request-Id; echoed in meta/done/error |
| Response | JSON `{ data: CopilotResponse }` | SSE stream (meta → token → done or error) |
| Error | 4xx/5xx + JSON body | 4xx/5xx or SSE error event |

Shared: tenant/project isolation, request id, observability (ai-telemetry, audit). Different: transport (JSON vs SSE) and state (stateless vs thread).

---

## 3. Context metadata shape

**Brief:** No context metadata in response; response has useCase, summary/brief fields, at, source.

**Chat stream:** meta event carries:
- request_id, thread_id
- context_tokens_estimated, context_trim_applied
- memory_used, memory_chunks_count, summary_used

done event carries: request_id, thread_id, final_text, assistant_message_id, context_tokens_estimated, context_trim_applied.

Unification: we use the same budget meta concepts (context_tokens_estimated, summary_used, memory_chunks_count) in Chat; Brief does not expose token counts in the API (could be added later if needed).

---

## 4. Explainability fields

- **Brief:** source: "llm" | "deterministic" | "mock"; at (timestamp).
- **Chat:** request_id (for lookup); in done: context_tokens_estimated, context_trim_applied; optional error kind (cancelled, timeout, unknown). Diagnostics in UI (dev/staging): request_id, memory_summary_used, memory_chunks_count, low_confidence, error_kind.

Alignment: both expose enough to trace and debug; Chat adds stream-specific meta.

---

## 5. Intentional differences (do not "unify" away)

| Difference | Reason |
|------------|--------|
| Brief: no thread, no history | Single-shot summaries by use case; no conversation. |
| Chat: thread + recent + historicalSummary | Conversation continuity. |
| Brief: GET, sync JSON | Simple, cacheable-by-useCase if desired. |
| Chat: POST, SSE | Streaming and cancel; thread state. |
| Brief: context from brain (snapshot, health, reports, etc.) | Manager view of project. |
| Chat: context from decision_context + messages | User-driven Q&A with project context. |
| Brief: no Cancel | No stream. |
| Chat: Cancel wired | Stream can be aborted. |

These are by design. Unification is about naming, conventions, and clarity—not merging the two into one API.

---

## 6. Backend split (documented)

- **Thread CRUD (list, get, create, archive):** Supabase function `aistroyka-ai-chat`.
- **Send message (stream):** Next.js route POST .../copilot/chat/stream (writes ai_chat_threads / ai_chat_messages via Supabase client).
- **Thread summary (UI):** getThreadSummary → Supabase function; not sent to stream route. Stream route builds its own historicalSummary from messages.

Developers should know: "thread listing and thread summary come from Edge; streaming and message persistence from Next.js route."

---

## 7. Minimal alignment done in this phase

- Document Brief vs Chat paths and conventions (this doc + inventory).
- Use consistent "Copilot" naming in docs; Brief = "Copilot brief", Chat = "Chat" in UI.
- Same auth/tenant/project model; same request id and observability ideas.
- No code merge of Brief and Chat into one execution path; no giant rewrite.
