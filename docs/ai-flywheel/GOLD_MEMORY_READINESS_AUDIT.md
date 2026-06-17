# Gold Memory Readiness Audit

**Date:** 2026-06-17  
**Branch base:** `ai/flywheel-final-tail-closure` @ `20b4f3f7`  
**Verdict:** **GO** for MVP implementation

---

## A1. Embedding / provider capabilities

| Capability | Status | Notes |
|------------|--------|-------|
| pgvector in `apps/web/supabase/migrations/` | **Not present** | No `create extension vector` in live repo migrations |
| Workers AI embedding binding | **Not present** | No `@cf/` or Workers AI in `apps/web` |
| OpenAI embedding route | **Not present** | No `/api/v1/ai/embed` route |
| OpenAI HTTP client pattern | **Present** | `fetchWithOpenAiRetry` + `getServerConfig().OPENAI_API_KEY` |
| Phase C project memory (non-vector) | **Present** | `loadCopilotStreamMemoryChunks` — confidence-ranked, not flywheel gold |
| Planned RAG docs (`ai_embeddings`) | **Docs only** | Enterprise plan references; not applied to AISTROYKA live schema |

**MVP embedding strategy:** Optional OpenAI `text-embedding-3-small` via existing `fetchWithOpenAiRetry` when write flag + API key; otherwise **disabled no-op embedder**. Store vectors as `embedding_json jsonb` (float array) — pgvector deferred. Retrieval uses in-app cosine similarity over tenant-filtered rows.

---

## A2. Candidate source data

| Source | Table | MVP | Notes |
|--------|-------|-----|-------|
| Expert corrections | `ai_expert_reviews` | **YES** | `corrected_output_json`, verdict filter |
| Manager preference pairs | `ai_preference_pairs` | **YES** | `chosen_json` vs `rejected_json`, `audience` column |
| Feedback records | `ai_feedback_records` | **Deferred** | No structured gold output field |
| Run records | `ai_run_records` | **Deferred** | Telemetry only |
| Chat threads/messages | `ai_chat_messages` | **Deferred** | Raw conversation; high PII risk |

---

## A3. Prompt construction points

| Route | Risk | MVP |
|-------|------|-----|
| **Copilot stream** `POST .../copilot/chat/stream` | Lowest | **SELECTED** — existing `formatMemoryContextSection` pattern, fail-safe meta events |
| Copilot non-stream GET | Medium | Deferred |
| Vision analyze-image | High | Deferred |
| Construction intelligence | High | Deferred |
| Help assistant | Medium | Deferred |

---

## A4. Security boundaries

| Control | Location | Gold Memory use |
|---------|----------|-----------------|
| `tenant_id` | Copilot stream, all flywheel tables | Required filter on read/write |
| `audience` | `ai_preference_pairs`, builder default | Owner/customer finance guard |
| `trainingConsentFilter` | `consent.ts` | Required before write |
| `scrubJsonStrings` + `verifyScrubbedJson` | `pii-scrub*.ts` | Required before store/inject |
| `financeDatasetGuard` | `finance-dataset-guard.ts` | Owner/customer rows require pass |
| RLS deny-all | Flywheel tables pattern | `ai_gold_memory` service-role only |

---

## Selected MVP scope

| Item | Choice |
|------|--------|
| **Route** | Copilot stream only |
| **Task type** | `copilot_chat` |
| **Audience** | `manager` |
| **Data sources** | `ai_expert_reviews`, `ai_preference_pairs` |
| **Storage** | `ai_gold_memory` append-only, RLS deny-all |
| **Retrieval** | Top-3 cosine similarity, flags gated |
| **Injection** | Sanitized few-shot section in system context block |

---

## Biggest risks

| Risk | Mitigation |
|------|------------|
| No pgvector → scale limits | MVP tenant-filtered scan + jsonb embeddings; pgvector migration deferred |
| PII in gold examples | Scrub + verifier before write; re-verify before inject |
| Owner finance leakage | `finance_guard_passed` required for owner/customer audience |
| Production behavior change | All flags default false; injection no-op when disabled |
| Cross-tenant leak | Strict `tenant_id` filter; no cross-tenant MVP |
| Embedding provider unavailable | No-op embedder; retrieval returns `[]`; route continues |

---

## Implementation order

1. Flags + readiness docs  
2. Migration `ai_gold_memory`  
3. Gold memory module (builder, embedder, retriever, prompt, guard)  
4. `build-gold-memory.ts` dry-run script  
5. Copilot stream injection (one route)  
6. Tests + validation + post-audit  

---

## GO/NO-GO

**GO** — Foundation closed, security primitives exist, one-route MVP is feasible with disabled-by-default flags and no-op embedding fallback.
