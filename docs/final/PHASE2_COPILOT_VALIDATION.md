# Phase 2 — Copilot / AI validation

**Date:** 2026-03-23  
**Environment:** Local dev tree `/Users/alex/Projects/AISTROYKA`, `apps/web`.

---

## Automated tests executed

From `apps/web`:

```bash
npx vitest run app/api/v1/projects/\[id\]/copilot/chat/stream/route.test.ts lib/observability/ai-telemetry.test.ts --reporter=dot
```

**Result:** 2 files passed, 4 tests passed (Vitest v4.0.18).

### What those tests cover

- **Stream route** (`route.test.ts`): mocked Supabase + OpenAI stream; asserts SSE `Content-Type: text/event-stream`, happy-path lifecycle emits telemetry events (`ai_copilot_stream_started`, `first_token`, `stream_completed`, `ai_copilot_stream_complete`), and error/edge behaviors per file.
- **Telemetry** (`ai-telemetry.test.ts`): `logCopilotStreamLifecycle` JSON shape and absence of prompt-like keys.

## Not executed in this pass (honest limits)

- **E2E** browser run against real Supabase + OpenAI (requires secrets, tenant, and deployed or local full stack).
- **Edge function** `aistroyka-ai-chat` integration tests (not in this workspace as source).
- **Load / rate-limit** characterization.

## Manual scenario checklist (for ops when env is available)

1. **No `OPENAI_API_KEY`:** POST stream → 503 + `X-Stream-Status: unavailable`; UI should fall back to Edge `send_chat_message` if function is live.
2. **Happy path:** Send message from `CopilotChatPanel` → tokens render → thread refreshes; DB rows in `ai_chat_messages` for user + assistant.
3. **Cancel in-flight:** Abort while streaming → SSE error with `cancelled` class; verify thread state vs expectation (see `docs/ai/` cancellation notes).

Record outcomes in a future validation revision if any step fails.
