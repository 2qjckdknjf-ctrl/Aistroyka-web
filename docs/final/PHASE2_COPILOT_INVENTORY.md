# Phase 2 — Copilot / AI layer inventory

**Date:** 2026-03-23  
**Scope:** Next.js `apps/web` — Copilot brief, streaming chat, client integration, observability, workflow hooks.  
**Related deep dives:** `docs/ai/COPILOT_EXECUTION_UNIFICATION_INVENTORY.md`, `docs/ai/COPILOT_STREAMING_VERIFICATION.md`.

---

## 1. API routes (runtime surfaces)

| Route | Method | Role | Key deps |
|-------|--------|------|----------|
| `/api/v1/projects/:id/copilot` | GET | Non-stream “brief” use cases (`summarizeProjectStatus`, `detectTopRisks`, `generateManagerBrief`, …) | `lib/copilot/copilot.service.ts`, tenant + `getProject`, LLM adapter or deterministic fallback |
| `/api/v1/projects/:id/copilot/chat/stream` | POST | SSE chat (`text/event-stream`: `meta`, `token`, `done`, `error`) | `OPENAI_API_KEY` (`isOpenAIConfigured()`), Supabase tables `ai_chat_threads` / `ai_chat_messages`, direct `fetch` to OpenAI |

**Not in this repo:** Supabase Edge Function `aistroyka-ai-chat` (thread CRUD, non-stream `send_chat_message`, `get_thread_summary`, `request_memory_refresh`) — called from `lib/features/ai/api/chatApi.ts` using `NEXT_PUBLIC_SUPABASE_URL/functions/v1/...`.

---

## 2. Client / UI

| Piece | Location | Notes |
|-------|----------|--------|
| Copilot chat panel | `lib/features/ai/components/CopilotChatPanel.tsx` | Streaming via `sendChatMessageStream` → Next stream route; cancel via `AbortController`; thread list/detail via Edge function |
| Thread hook | `lib/features/ai/api/useCopilotThread.ts` | React Query; `listThreads` / `getThread` / `createThread` / `archiveThread` → Edge; send → stream or fallback |
| Transport | `lib/features/ai/api/chatApi.ts` | 503 + `X-Stream-Status: unavailable` → non-stream `sendChatMessage` (Edge) |
| Project intelligence | `ProjectIntelligenceClient.tsx` | Embeds `CopilotSummaryPanel` (brief GET) |
| Admin AI | `admin/ai/*`, `GET /api/v1/admin/ops/ai-runtime` | Audit rollup for copilot / intelligence / vision |

---

## 3. Feature flags / config

| Mechanism | Where | Copilot relevance |
|-----------|--------|-------------------|
| `OPENAI_API_KEY` | `lib/config/server.ts` → `isOpenAIConfigured()` | Stream route returns **503** JSON with `X-Stream-Status: unavailable` when missing; client falls back to Edge non-stream |
| Tenant feature flags | `tenant_feature_flags`, `lib/platform/ai/*` | Provider preference / fallback for **brain** routing; stream route does **not** read these (fixed `gpt-4o-mini` + direct OpenAI) |
| Health | `lib/system/health.service.ts` | `checkCopilot()` reflects OpenAI key presence |

There is **no** dedicated “copilot_enabled” kill-switch on the stream route beyond missing OpenAI key.

---

## 4. Persistence

| Data | Writer | Reader |
|------|--------|--------|
| `ai_chat_threads`, `ai_chat_messages` | Next stream route (`createClientFromRequest`) | Stream route (context); Edge function for thread CRUD (must stay consistent with same Supabase DB) |
| Brief copilot | None (stateless) | N/A |

**Repo gap:** No `apps/web/supabase/migrations/*.sql` references `ai_chat_threads` / `ai_chat_messages`. Schema is assumed to exist in the linked Supabase project (verify apply / RLS outside this inventory).

---

## 5. Error / cancellation paths (stream)

- **401 / 403 / 404:** JSON before stream starts (tenant, project access).
- **503:** No OpenAI key; JSON + fallback headers (client uses non-stream).
- **Provider errors:** SSE `error` event; telemetry + `emitAiRuntimeAudit`; stream closes.
- **Timeout:** 60s `AbortController` on OpenAI fetch; classified as `provider_timeout` when not client abort.
- **Client abort:** `request.signal` → abort; `cancellation` path; optional assistant row with error_kind.
- **Assistant persist failure:** Log swallow after successful generation (stream still completes with `done`).

---

## 6. Observability

- `lib/observability/ai-telemetry.ts` — stream lifecycle + complete/error events (JSON logs, no prompt leakage).
- `emitAiRuntimeAudit` — persists rollup-friendly events for admin.

---

## 7. Workflow / backlog cross-check (`PHASE0_MASTER_BACKLOG.md`)

| Ref | Topic | In-repo state |
|-----|--------|----------------|
| P1-04 | Copilot: streaming, fallback, cancel, errors | Implemented in stream route + `chatApi` fallback + `CopilotChatPanel` cancel |
| P1-04 tails | “Full closure” | `enqueue_copilot_summary` in `lib/workflows/action-dispatcher.ts` is still **noop** — workflow rule `rule-health-copilot` does not enqueue real work |
| Intelligence / vision | Separate from Copilot brief/chat | Own routes and panels; out of narrow “copilot” scope but shares audit + flags |

---

## 8. Status matrix

| Area | Exists | Partial | Missing / risk |
|------|--------|---------|----------------|
| Brief GET + fallback | Yes | — | No request cancellation (short GET only) |
| Stream SSE + persist | Yes | Memory chunks always `[]` in stream | Thread summary from Edge not injected into stream context (see `docs/ai/` note) |
| Thread CRUD | Yes (Edge) | Dual stack with Next stream | Operational discipline: two entry points |
| Workflow-driven copilot | — | — | **noop** dispatcher |
| Migrations in repo for chat tables | — | — | **Not found** in `apps/web/supabase/migrations` |
