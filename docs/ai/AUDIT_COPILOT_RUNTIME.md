# Copilot Runtime Audit

**Date:** 2026-06-04

---

## Architecture

| Path | Role |
|------|------|
| `GET /api/v1/projects/:id/copilot` | Non-stream use cases (`generateManagerBrief`, `detectTopRisks`, …) |
| `POST /api/v1/projects/:id/copilot/chat/stream` | SSE chat (`meta`, `token`, `done`, `error`) |
| `lib/copilot/copilot.service.ts` | Orchestration: context → prompt → provider → parser → fallback |
| `lib/copilot/copilot.openai-provider.ts` | OpenAI chat completions for non-stream |
| `lib/copilot/context-budget.ts` | Token budgets + trim metadata |

---

## Streaming protocol

**Events (verified in `route.ts`):**

| Event | Payload highlights |
|-------|-------------------|
| `meta` | `request_id`, `thread_id`, `context_tokens_estimated`, `context_trim_applied`, `memory_*` |
| `token` | `{ delta }` |
| `done` | `final_text`, `assistant_message_id`, `fallback_reason` (null or string) |
| `error` | cancellation path: `kind: cancelled` |

**Lifecycle telemetry:** `ai_copilot_stream_started`, `first_token`, `finished` / `failed` / `cancelled`, `ai_copilot_stream_complete`.

**Timeouts:** 60s abort on stream; client `request.signal` abort → `cancellation` (no fallback).

---

## Persistence

| Step | Timing | Failure behavior |
|------|--------|------------------|
| Thread create/load | Before stream | 404/503 JSON (not SSE) |
| User message insert | Before OpenAI call | 503 if insert fails |
| Assistant message | After stream completes or fallback | **best-effort** (`persistAssistantMessage` returns null on error; stream still sends `done`) |
| Thread touch | After assistant write | best-effort |

**Tables:** `ai_chat_threads`, `ai_chat_messages` with RLS tenant policies (`20260418143000_ai_chat_stream_tables.sql`).

---

## Fallback paths

| Trigger | Stream behavior | Non-stream behavior |
|---------|-----------------|---------------------|
| `!isOpenAIConfigured()` | 503 JSON + `X-Fallback: use non-stream endpoint` | `deterministicFallback` via `runCopilot` |
| OpenAI HTTP error / no body | SSE `done` with `fallback_reason` + deterministic text | Provider throw → deterministic |
| Provider timeout / transport | Same | Same |
| Gate (quota/policy) | 402/403/429 JSON before stream starts | Same |

Stream fallback text includes user message snippet (max 240 chars) — **operational risk** for log/SSE exposure to same-tenant users only.

---

## Context budget

- **Stream:** `applyContextBudget` with `DEFAULT_CONTEXT_BUDGET`; historical messages summarized when >5; `memoryChunks: []` **hardcoded** (memory/RAG not loaded in stream path).
- **Non-stream:** `applyBriefContextBudget` on assembled ai-brain summaries in `buildCopilotContext`.

---

## Memory / RAG

| Surface | Status |
|---------|--------|
| `GET /api/v1/ai/memory/context` | **ACTIVE** — Phase C retrieval |
| Stream chat | **OPEN** — `memoryChunks: []`, `memory_used: 0` always in current code |
| Non-stream copilot context | Uses deterministic ai-brain signals, not vector RAG |

---

## Cancellation

- Client abort → `stream_cancelled` telemetry, `event: error` with `cancelled`, **no** assistant persistence requirement documented (may partial tokens in client only).
- Server 60s timeout → treated as `provider_timeout` → **fallback** `done` event.

---

## Errors & tests

- **Route tests:** 7 stream tests, 3 non-stream tests (mock OpenAI, gate, locale injection).
- **Unit:** `context-budget.test.ts` (12), `copilot.openai-provider.test.ts`.

---

## Required verdicts

| Area | Verdict | Evidence |
|------|---------|----------|
| True streaming | **FULL** | OpenAI `stream: true`, token events, usage in stream_options |
| Context budget | **PARTIAL** | Budget enforced; stream omits memory retrieval |
| Fallback | **FULL** | Deterministic stream + non-stream; telemetry `fallback_invoked` |
| Persistence | **PARTIAL** | User msg strict; assistant best-effort |
| Memory/RAG | **OPEN** | API exists; stream not wired |
| Live provider proof | **OPEN** | No `OPENAI_API_KEY` in local `.env.local`; tests mock provider |

---

## Copilot subsystem verdict

**Status:** **CONDITIONAL** — Production-safe degradation exists; full LLM value requires configured provider + assistant persistence hardening + memory wiring in stream.
