# AI Flywheel Readiness Audit

**Date:** 2026-06-17  
**Scope:** Foundation-only sprint — no training, shadow, or user-facing AI changes  
**Authoritative roadmap:** `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md`

---

## Executive summary

AISTROYKA has a mature AI runtime (vision, copilot, intelligence, eval/optimization layers) with tenant-aware routing, policy engine, usage metering, and RLS hardening. There is **no existing flywheel foundation** (no training consent column, no preference-pair capture, no PII scrub export pipeline, no finance dataset guard, no flywheel feature flags). Phase 12 conceptual doc (`docs/ai/AI_DATA_FLYWHEEL.md`) exists but is not wired to code.

**GO/NO-GO for foundation-only work:** **GO** — additive schema, internal tables, env-gated helpers, and dry-run scripts can land without touching production AI output paths.

---

## A1. AI runtime surface

### What exists

| Surface | Location | Notes |
|---------|----------|-------|
| Vision façade | `apps/web/lib/platform/ai/ai.service.ts` | `analyzeImage`, `analyzeVideoDailyWork` — policy → router → usage |
| Provider router | `apps/web/lib/platform/ai/providers/provider.router.ts` | Tenant prefs, circuit breaker, fallback |
| Policy engine | `apps/web/lib/platform/ai-governance/policy.service.ts` | `ai_policy_decisions` audit |
| Copilot | `lib/copilot/*`, routes under `/api/v1/projects/[id]/copilot*` | Stream + non-stream, gate, fallback |
| Construction intelligence | `lib/intelligence/*`, `/api/v1/projects/[id]/intelligence` | Health, risks, projections |
| AI Brain phases A–E | `lib/ai-brain/*` | Truth snapshot, memory, eval, optimization |
| Transcription | `/api/v1/ai/transcribe` | Whisper via gate |
| Action plan / brief | `/api/v1/ai/action-plan`, `project-brief` | LLM routes |
| Eval / feedback (Phase D) | `ai_run_records`, `ai_feedback_records`, `/api/v1/ai/feedback` | Tenant-readable feedback — **not** flywheel preference pairs |
| Telemetry | `lib/observability/ai-telemetry.ts`, `audit.service.ts` | Safe metadata only; no raw prompts |
| PII classifier (detect) | `lib/platform/privacy/pii.classifier.ts` | Heuristic classify; not export scrub |

### What is missing

- `runAiTask` symbol (not present; `analyzeImage` / copilot paths are canonical)
- Training consent on `tenants`
- Flywheel feature flags (`AI_FLYWHEEL_*`)
- PII scrub + verifier for export
- Finance dataset guard for export
- `ai_preference_pairs`, `ai_expert_reviews` internal tables
- Dataset export pipeline (any real JSONL export)
- Shadow mode / student model routing

### Must not touch

- `ai.service.ts` provider invocation paths
- Copilot stream/non-stream response contracts
- `/api/v1/ai/analyze-image` request/response shapes
- Intelligence projection semantics for owner/customer surfaces
- Existing `ai_feedback_records` tenant RLS (separate from flywheel internal tables)
- Legacy `/api/*` routes (keep; do not delete)

---

## A2. Data model / Supabase

### Existing `ai_*` tables

| Table | RLS pattern | Flywheel relevance |
|-------|-------------|-------------------|
| `ai_usage` | Deny-all (service role) | Cost telemetry — not training export |
| `ai_policy_decisions` | Internal tenant reader | Policy audit |
| `ai_memory_records` | Internal tenant reader | Memory — not training export without scrub |
| `ai_run_records` | Internal tenant reader | Run telemetry |
| `ai_feedback_records` | Internal tenant reader | Human scores — different from preference pairs |
| `ai_eval_*`, `ai_improvement_*`, `ai_optimization_*` | Mixed internal/tenant | Eval layer — not training pipeline |
| `ai_analysis` | Media tenant membership | Vision results |
| `ai_chat_threads/messages` | Tenant member | Copilot history — PII risk if exported |
| `ai_guide_events` | Tenant member | UI telemetry |
| `ai_provider_health` | Deny-all | Ops |

### Related non-AI tables

- `worker_reports`, `media`, `upload_sessions` — field evidence; high PII/media risk
- `project_documents`, `project_cost_items`, `milestones`, `approvals` — finance isolation critical
- `privacy_settings`, `pii_findings` — detect mode exists; no export scrub
- `audit_logs` — safe AI runtime metadata pattern to follow for consent audit
- `tenants` — no `ai_training_consent` yet

### RLS patterns to reuse

- **Deny-all:** `20260526105200_superbase_hardening_service_only_tables_policies.sql` (`using (false) with check (false)`)
- **Internal tenant reader:** `is_internal_tenant_reader_for_tenant()` — **do not use** for flywheel training tables (service-role only per spec)

---

## A3. API and contracts

### Canonical `/api/v1` AI routes (21+ under `app/api/v1/ai/` and project-scoped)

Vision, transcribe, copilot, intelligence, memory, eval, optimization, feedback, improvements, requests (jobs list).

### Legacy `/api` mirrors

`analyze-image`, `analyze-video-daily`, `transcribe`, `analysis/process`, media/job triggers — must remain.

### Contracts

`packages/contracts/src/schemas/ai.schema.ts` — vision/video schemas only; no flywheel schemas needed in this sprint.

### Mobile-used routes

Copilot stream, analyze-image, intelligence, sync routes — **no new flywheel endpoints** in foundation sprint.

---

## A4. Jobs / workers

- **Cloudflare:** `wrangler.toml` — no cron triggers; HTTP cron via `/api/v1/admin/jobs/cron-tick`
- **Job handlers:** `ai-analyze-media`, `ai-analyze-report` in `lib/platform/jobs/job.handlers/`
- **Smoke scripts:** `scripts/smoke/ai_live_provider.sh`, `ai_vision.sh`, `ai_copilot_stream.sh`, `ai_intelligence.sh`
- **No `scripts/ai/`** directory today

---

## A5. Env / config governance

- Server config: `lib/config/server.ts` — OpenAI, timeouts, service role
- Feature flags (DB): `feature_flags`, `tenant_feature_flags` via `lib/platform/flags/`
- Billing flag pattern: `lib/platform/billing-readiness/billing-provider-config.ts` — env boolean, default false
- Direct `process.env` reads scattered; flywheel flags will follow billing flag pattern in dedicated module

---

## A6. Test / build gates

| Gate | Command | Location |
|------|---------|----------|
| Install | `bun install --frozen-lockfile` | Root |
| Lint | `bun run lint` | ESLint on apps/web |
| Test | `bun run test` | Vitest in apps/web |
| Build | `bun run build` | contracts + web |
| CF build | `bun run cf:build` | OpenNext |
| i18n | `bun run i18n:check` | Not required for flywheel backend |
| AI live gate | `bash scripts/smoke/ai_live_provider.sh --require-live` | Post-foundation optional |

---

## Integration risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Exporting tenant data without consent | P0 | `ai_training_consent default false`; `trainingConsentFilter()` |
| Owner/customer finance leakage in training set | P0 | `financeDatasetGuard()`, `ownerAudienceDatasetGuard()` |
| Raw PII in training JSONL | P0 | Scrub + verifier; drop failures |
| Accidental production AI behavior change | P0 | All flags default false; no hooks in copilot/vision hot paths |
| Tenant role reading internal flywheel tables | P0 | Deny-all RLS on new tables |
| Confusion with existing `ai_feedback_records` | P1 | Separate `ai_preference_pairs`; document distinction |
| `ai_chat_messages` content in export | P1 | Defer real export; dry-run only |
| Existing eval tables have tenant SELECT | P2 | Do not repurpose; new tables are service-only |

---

## Safest implementation order

1. Audit + integration plan docs (this file + plan)
2. Feature flags module (all default false)
3. Append-only migration: consent column + internal tables + deny-all RLS
4. Consent helper + audit
5. PII scrub + verifier (lib + scripts)
6. Finance dataset guard
7. Feedback capture helper (inert unless flag)
8. Expert review helper (inert unless flag)
9. Export dry-run script (no real JSONL unless `--write-test-output`)
10. Tests + validation + post-audit

---

## GO/NO-GO verdict

| Criterion | Verdict |
|-----------|---------|
| Foundation can be additive | **GO** |
| No production AI path change required | **GO** |
| RLS deny-all pattern established | **GO** |
| Finance isolation guardable at export layer | **GO** |
| Blockers for foundation sprint | **None** |

**Foundation sprint:** **GO**
