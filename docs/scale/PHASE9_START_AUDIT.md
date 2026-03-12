# Phase 9 Start Audit — Scale Infrastructure

**Date:** 2026-03-10  
**Role:** Principal Platform Scalability Architect  
**Purpose:** Assess current scalability posture before growth.

---

## Current user/tenant capacity assumptions

| Dimension | Assumption | Source |
|-----------|------------|--------|
| **Tenants** | Tens to low hundreds; no hard platform cap in code. | Subscription limits are per-tenant; no global tenant limit. |
| **Users per tenant** | FREE: 2 workers, PRO: 15, ENTERPRISE: 200 (max_workers). Managers/owners not separately capped. | `lib/platform/subscription/limits.ts` |
| **Projects per tenant** | FREE: 3, PRO: 20, ENTERPRISE: 500. | limits.ts |
| **Concurrent job execution** | One concurrent job per tenant (try_acquire_job_slot). | `queue.db.ts`, job.service.ts |
| **Rate (per tenant/min)** | FREE: 10, PRO: 60, ENTERPRISE: 300 on HIGH_RISK_ENDPOINTS. | rate-limit.service.ts, limits.ts |
| **Storage per tenant** | FREE: 1 GB, PRO: 10 GB, ENTERPRISE: 100 GB. | limits.ts (enforcement may be partial). |
| **Request body size** | 1 MB max for media-related POST. | request-limit.ts |

**Implicit:** Single Next.js/Cloudflare Worker deployment; Supabase as primary DB and storage; no horizontal app-tier partitioning by tenant.

---

## Current infra bottlenecks

- **Single worker process:** Job processor (POST /api/v1/jobs/process) runs in same deployment; claim limit 5–20 per run; WORKER_TIME_BUDGET_MS 25s. One slow tenant can delay others only via shared DB, not CPU—but job throughput is bounded by cron frequency and claim limit.
- **Database:** All tenants share one Supabase project; connection pool and query performance become single point of contention at high tenant/query count.
- **Rate limit store:** rate_limit_slots in Supabase; every high-risk request does read+increment; at high QPS this adds latency and DB load.
- **No read replicas:** All reads and writes go to primary; no documented read scaling.
- **Storage:** Supabase Storage (or configured bucket) single region; egress and large-object handling scale with usage.

---

## Known heavy endpoints

| Endpoint | Why heavy | Mitigation today |
|----------|-----------|-------------------|
| POST /api/v1/ai/analyze-image | External AI call (OpenAI/Anthropic/Gemini); long latency. | Rate limit; circuit breaker; timeout. |
| POST /api/v1/worker/report/submit | Writes report, may enqueue jobs. | Rate limit; idempotency. |
| POST /api/v1/jobs/process | Claims and runs up to 5–20 jobs; runs AI, push, upload-reconcile. | Cron-driven; tenant concurrency slot; time budget. |
| POST /api/v1/media/upload-sessions/:id/finalize | Storage verification; DB updates. | Rate limit; body size limit. |
| GET /api/v1/sync/changes | Can return large change sets. | Rate limit; cursor-based; retention window. |
| POST /api/auth/login | Auth provider call. | Stricter IP rate limit (5/min). |

---

## Storage growth risks

- **Media:** Photos and files per report; growth linear with reports and resolution. Storage_limit_gb per tenant exists but enforcement (block uploads when over) may not be fully wired everywhere.
- **Audit logs / jobs / ops_events:** Append-only tables; retention job (retention-cleanup, ops-events-prune) exists but data_retention_policies enforcement is scaffold only (DATA-RETENTION-STRATEGY).
- **Backup size:** Grows with DB and storage; restore time and backup window increase.
- **Risk:** Unbounded growth if retention not enforced; cost and restore complexity rise.

---

## Queue/backlog risks

- **Jobs table:** One queue for all tenants; claim by tenant_id, status, run_after. Under load, queue depth grows; processing is rate-limited by cron frequency and tenant slot (1 concurrent per tenant).
- **Dead letter:** Jobs can move to dead after max attempts; no automatic replay; manual or admin action needed.
- **Push outbox:** Similar; delivery depends on job processor and external provider (APNs/FCM).
- **Risk:** Burst of reports or AI requests creates job spike; backlog grows; latency from enqueue to completion increases. No global queue depth alert documented.

---

## AI load risks

- **Budget:** Per-tenant monthly_ai_budget_usd (5 / 50 / 500); consumption tracked; 402 when exceeded.
- **Rate:** AI endpoint rate-limited per tenant and IP; 429 when exceeded.
- **Latency:** Provider latency (seconds); circuit breaker and timeout in place.
- **Cost:** AI cost scales with usage; no per-request cost logged in standard observability; budget prevents runaway but does not optimize unit cost.
- **Risk:** Many tenants using AI simultaneously increases provider cost and can hit provider rate limits; circuit open affects all tenants using that provider.

---

## Release pipeline risks

- **CI/CD:** GitHub Actions; deploy on push to main (production); staging deploy exists. Single pipeline; no canary or staged rollout in repo.
- **Build:** OpenNext + Cloudflare; build time and size affect deploy duration; no parallel env promotion (e.g. staging → prod only after manual approval).
- **Rollback:** Redeploy previous commit or revert; no one-click rollback automation documented.
- **Risk:** Bad deploy affects all users; no blast-radius reduction.

---

## Cost exposure risks

- **AI:** Direct cost per token/image; scales with usage; budget caps per tenant but not global spend.
- **Supabase:** DB, storage, egress; scales with tenants and data volume.
- **Cloudflare Workers:** Invocations and CPU; scales with traffic.
- **Third-party:** Push (APNs/FCM), email, etc. if used.
- **Risk:** No centralized cost visibility or budget alerts; surprise bill possible at scale.

---

## Strict priority list

1. **Observability at scale:** Log aggregation, SLO/alert definitions, dashboards (success rate, p95, errors, tenant-level). Without these, scale issues are detected too late.
2. **Multi-tenant hardening:** Tenant quotas and rate limits verified and documented; noisy-neighbor mitigation (already partially in place via tenant concurrency and rate limits); billing/usage metrics for cost attribution.
3. **Data and media scaling:** Retention enforcement (run retention job); storage tiering and backup/restore verification; large-upload and CDN strategy.
4. **Performance and load testing:** Define targets (p95, error rate); run load tests on auth, tasks, reports, uploads, AI; document tools and scenarios.
5. **Release safety:** Environment promotion, feature flags, canary or staged rollout, fast rollback procedure.
6. **Cost control:** Track AI, storage, compute, bandwidth; budget thresholds and alerts; optimization levers documented.
