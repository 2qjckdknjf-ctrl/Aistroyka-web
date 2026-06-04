# AI Observability Audit

**Date:** 2026-06-04

---

## Operator questions — can we answer them?

| Question | Mechanism | Verdict |
|----------|-----------|---------|
| Which AI route was used? | `audit_logs.details.route`, structured `event` field | **FULL** |
| Which provider was used? | `details.provider`, vision `logVisionAnalyzeComplete` | **PARTIAL** (stream fallback logs `provider: none`) |
| Did streaming start? | `ai_copilot_stream_started` | **FULL** |
| First token time? | `first_token_ms`, `ai_copilot_stream_first_token` | **FULL** |
| Did fallback happen? | `fallback_triggered`, `fallback_reason`, `error_kind: fallback_invoked` | **FULL** |
| Context trimmed? | `context_trim_applied` in meta/audit | **FULL** |
| Tokens estimated? | `context_tokens_estimated`; usage table on success | **PARTIAL** (estimates on fallback) |
| Provider fail? | `ai_copilot_stream_error`, `ai_vision_analyze_error` | **FULL** |
| Persistence fail? | User msg fails before stream; assistant silent fail | **PARTIAL** — no distinct `persistence_failure` event when assistant insert fails |
| Release/build correlation? | `getAiReleaseCorrelation()` → `build_sha7`, `app_env` | **FULL** |
| Tenant/project/request? | `request_id`, `tenant_id`, `project_id` on telemetry + `X-Request-Id` | **FULL** |

---

## Telemetry channels

### 1. Structured logs (`logStructured`)

- File: `lib/observability/ai-telemetry.ts`
- Events: `ai_copilot_stream_*`, `ai_intelligence_*`, `ai_vision_*`
- **Explicit rule:** no prompts, secrets, raw user text in payloads (comment + audit types)

### 2. `audit_logs` (tenant-scoped)

- `emitAiRuntimeAudit` → actions like `ai_copilot_stream_complete`, `ai_intelligence_complete`, `ai_vision_analyze_*`
- Admin rollup: `GET /api/v1/admin/ops/ai-runtime`
- Safe details interface: `AiRuntimeAuditDetails` — no prompt fields

### 3. `ai_usage` table

- Per-request cost/tokens via `recordUsage` (stream, vision, copilot non-stream)

### 4. Legacy / drift

| Artifact | Status |
|----------|--------|
| `ai_llm_logs` | Documented in `engine/`, SLO docs — **not migrated in apps/web** |
| `ai_retrieval_logs`, `ai_security_events` | Compliance docs only — **UNKNOWN in web DB** |
| Edge copilot inserts | **LEGACY** parallel path |

---

## Leakage audit

| Risk | Finding |
|------|---------|
| Raw prompt in logs | **Mitigated** — telemetry types exclude prompts; copilot errors slice message to 200 chars in `copilot.service` only |
| Secrets in logs | **Mitigated** — no API keys in telemetry |
| Tenant context in logs | tenant_id present — **required for ops**; ensure log sink access controls |
| SSE to client | Fallback includes user message excerpt — **same-tenant session only** |
| Image URL in logs | Vision telemetry avoids image URLs (route comment Phase 8) |

---

## Stream lifecycle

```
stream_started → (first_token?) → stream_completed | stream_failed | stream_cancelled
```

`ai_copilot_stream_complete` consolidates metadata on success/fallback complete.

---

## Gaps

1. **Single pane:** Operators must correlate Worker logs + `audit_logs` + optional missing `ai_llm_logs`.
2. ~~**Assistant persistence failure**~~ — stream route logs `persistence_failure` via `logCopilotStreamError` (2026-06-04).
3. ~~**SLO `ai_llm_logs` drift**~~ — `docs/operations/slo-definition.md` now documents canonical `audit_logs` + structured logs (legacy Edge tables marked non-authoritative for web).

---

## Observability verdict

**Status:** **CONDITIONAL** — Strong in-app structured telemetry and audit trail for web copilot/intelligence/vision; **not FULL** until DB telemetry aligns with SLO docs and persistence failures are visible.
