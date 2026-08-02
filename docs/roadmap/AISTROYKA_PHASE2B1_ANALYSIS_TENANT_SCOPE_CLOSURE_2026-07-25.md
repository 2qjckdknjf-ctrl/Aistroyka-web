# AISTROYKA Phase 2B.1 — Analysis Tenant Scope Closure

Date: 2026-07-25
Batch: `2B_analysis_process_tenant_scope` only
Repo: `/Users/alex/Projects/AISTROYKA`
Prior: Phase 2A inventory accepted; P0 proven

Migration **not** applied to staging/production.

---

## 1. Pre-implementation findings

| Item | Finding |
| --- | --- |
| `processOneJob` call sites | Only `app/api/analysis/process/route.ts` (v1 re-exported that handler) + unit tests |
| `dequeue_job` call sites in app/lib | Only `lib/ai/runOneJob.ts` (HTTP path) |
| Global RPC | `public.dequeue_job(text, uuid)` in `20260411120000_release1_analysis_engine.sql` — `SECURITY DEFINER`, service_role only, **no tenant filter**, `FOR UPDATE SKIP LOCKED`, order `started_at asc` |
| `analysis_jobs` | Has `tenant_id uuid not null`; indexes on tenant/status |
| `media` | Has `tenant_id` — usable for scoped lookup |
| Permission | `authorize(ctx, "analysis:trigger")` → min role **member** (`tenant.policy.ts`) |
| Lite | v1 middleware blocks `/api/v1/analysis/process`; legacy `/api/analysis/*` **bypassed** lite allow-list |
| Rate limit | Existing `checkRateLimit` + `HIGH_RISK_ENDPOINTS` (jobs/process pattern: log + continue if store fails) |
| Migration order | Latest prior: `20260704120000_roma_audit_runs.sql` |

Attack path before:

```text
Any authenticated user
→ POST /api/analysis/process (or /api/v1/analysis/process)
→ service-role admin client
→ processOneJob → rpc dequeue_job(null, null)
→ first global queued analysis_jobs row (any tenant)
→ claim / AI / complete on foreign tenant job
```

---

## 2. Root cause

User HTTP path authenticated only on “session exists”, then used service-role `dequeue_job` without `tenant_id`. SQL intentionally selected the first `status = 'queued'` row globally.

---

## 3. Authorization matrix after

| Caller | Result |
| --- | --- |
| Unauthenticated | 401 |
| Authenticated, no membership | 403 |
| Service-role JWT on request | 403 (`TenantForbiddenError`) |
| stakeholder | 403 (`analysis:trigger` requires member+) |
| viewer | 403 |
| member / admin / owner | Allowed |
| ios_lite / android_lite / ios_worker / android_worker | 403 in-handler (legacy + v1) |

Tenant id source: **only** `ctx.tenantId` from `getTenantContextFromRequest` (never body/query/cookie/arbitrary header).

---

## 4. SQL function contract

**Migration:** `apps/web/supabase/migrations/20260725143000_dequeue_tenant_job.sql`
**Name:** `public.dequeue_tenant_job(p_tenant_id uuid, p_region_id text default null, p_worker_id uuid default null)`

| Requirement | Proven |
| --- | --- |
| `p_tenant_id` required (null raises) | YES |
| Predicate `tenant_id = p_tenant_id AND status = 'queued'` | YES |
| `SECURITY DEFINER` + `search_path = public` | YES |
| `FOR UPDATE SKIP LOCKED` | YES |
| Order `started_at asc` (matches current global dequeue) | YES |
| Returns row including `tenant_id` | YES (returns `analysis_jobs`) |
| `REVOKE` public/anon/authenticated; `GRANT` service_role | YES |
| Global `dequeue_job` preserved | YES (not dropped/replaced) |
| Partial index `(tenant_id, started_at) WHERE status = 'queued'` | YES |

Static contract tests: `lib/ai/dequeue-tenant-job.migration.contract.test.ts`.

---

## 5. Route legacy / v1 behavior

Canonical security logic lives in `lib/ai/analysis-process.http.ts` (`handleAnalysisProcessPost`).

| Path | Wrapper | Route key | Legacy headers | Lite denial |
| --- | --- | --- | --- | --- |
| `/api/v1/analysis/process` | thin POST | `POST /api/v1/analysis/process` | No | In-handler |
| `/api/analysis/process` | thin POST | `POST /api/analysis/process` | Deprecation + Sunset | In-handler |

Both call the same handler with `tenantId: ctx.tenantId`. Security does **not** depend only on middleware (Cloudflare OpenNext may bypass middleware for most `/api/v1/*`).

---

## 6. Processor tenant proof

`processOneJob(admin, aiUrl, { tenantId, traceId })`:

- Requires non-empty `tenantId`
- Calls **only** `dequeue_tenant_job` with `p_tenant_id`
- No fallback to `dequeue_job` if RPC missing (returns error)
- Returned `job.tenant_id` must equal `tenantId` or fail closed (no media/claim/AI/complete)
- Media: `.eq("id", mediaId).eq("tenant_id", tenantId)`
- `markJobFailed`: `.eq("id", jobId).eq("tenant_id", tenantId)`
- HTTP 500 body sanitized to `"Processing failed"` (no foreign ids)

---

## 7. Rate-limit proof

- Endpoint keys: `/api/v1/analysis/process` and `/api/analysis/process`
- Added to `HIGH_RISK_ENDPOINTS`
- `checkRateLimit({ tenantId, ip, endpoint })` → 429 when limited
- Store failure: log `rate_limit_unavailable`, continue with **tenant-scoped** process (same as `jobs/process`) — never opens global dequeue
- Covered by route tests

---

## 8. Tests and exit codes

### Targeted

```bash
bun run --cwd apps/web test -- \
  app/api/analysis/process/route.test.ts \
  app/api/v1/analysis/process/route.test.ts \
  lib/ai/runOneJob.test.ts \
  lib/ai/dequeue-tenant-job.migration.contract.test.ts
```

**PASS** — 4 files, 59 tests (exit 0). With rate-limit catalog test: 62 tests earlier.

### Full checks

| Check | Result |
| --- | --- |
| `bun run lint` | PASS (0) |
| `bun run test` | PASS — 328 files, **1809** tests (0) |
| `bun run build` | PASS (0) after return-type fix |
| `bun run cf:build` | PASS (0) |
| `bun run --cwd apps/web check:design` | PASS (0) |
| `npm audit` | 0 vulnerabilities (0) |
| `npm audit --omit=dev` | 0 vulnerabilities (0) |

### Static

- User HTTP processor does not `rpc("dequeue_job")`
- `dequeue_tenant_job` used in migration + `runOneJob.ts`

### Failure found/fixed during batch

1. **Build type error:** `handleAnalysisProcessPost` annotated as `Promise<NextResponse>` but `withRequestIdAndTiming` returns `Response`. Fixed to `Promise<Response>`; retargeted tests PASS; rebuild PASS.

---

## 9. Migration rollout / rollback

**Filename:** `apps/web/supabase/migrations/20260725143000_dequeue_tenant_job.sql`
**Applied this batch:** **NO**

### Forward behavior

Creates `dequeue_tenant_job`, grants service_role only, adds queued tenant index. Leaves `dequeue_job` intact for background workers.

### Safe deployment order

1. Apply migration to DB (staging → verify → production).
2. Deploy code that calls `dequeue_tenant_job`.

| Scenario | Behavior |
| --- | --- |
| Code before migration | Fail closed: RPC missing → 500 `"Processing failed"` / processor error — **no** global dequeue |
| Migration before code | Harmless: new RPC unused until deploy; global path unchanged |
| Both applied | User HTTP tenant-scoped; workers may still use `dequeue_job` |

### Rollback SQL / runbook

```sql
drop function if exists public.dequeue_tenant_job(uuid, text, uuid);
drop index if exists public.idx_analysis_jobs_tenant_queued_started;
```

Then redeploy previous app revision that called `dequeue_job` **only if** intentionally restoring the insecure path (not recommended). Prefer keep migration and keep new code.

---

## 10. Files changed

| File | Why |
| --- | --- |
| `apps/web/supabase/migrations/20260725143000_dequeue_tenant_job.sql` | New tenant RPC |
| `apps/web/lib/ai/runOneJob.ts` | Mandatory tenantId; tenant RPC; scoped media/fail |
| `apps/web/lib/ai/runOneJob.test.ts` | Processor proofs |
| `apps/web/lib/ai/analysis-process.http.ts` | **Necessary** shared handler (no duplicated auth) |
| `apps/web/lib/ai/dequeue-tenant-job.migration.contract.test.ts` | SQL/HTTP contract |
| `apps/web/app/api/v1/analysis/process/route.ts` | Canonical thin wrapper |
| `apps/web/app/api/v1/analysis/process/route.test.ts` | Negatives |
| `apps/web/app/api/analysis/process/route.ts` | Legacy thin wrapper |
| `apps/web/app/api/analysis/process/route.test.ts` | Negatives + deprecation |
| `apps/web/lib/platform/rate-limit/rate-limit.service.ts` | Register high-risk endpoints |
| `apps/web/lib/platform/rate-limit/rate-limit.service.test.ts` | Catalog assertion |
| `docs/roadmap/AISTROYKA_PHASE2B1_ANALYSIS_TENANT_SCOPE_CLOSURE_2026-07-25.md` | This report |

---

## 11. Scope confirmation

| Area | Changed? |
| --- | --- |
| Customer-finance guard / portal | NO |
| Platform-owner routes | NO |
| Global lite allow-list rules | NO (in-handler lite deny only for this path) |
| Role model / `(1)` files | NO |
| Other legacy APIs | NO |
| User dirty worktree (Phase 1, QA docs, etc.) | Preserved |

---

## 12. Remaining Phase 2 findings (NOT closed)

Still open from Phase 2A (not this batch):

- Customer-finance route-level guard gaps (`2B_customer_finance_guard_coverage`)
- Platform negative tests / admin alias middleware depth
- Role model unify / stakeholder middleware wire
- Lite idempotency / read scope / prefix boundary (`2C_*`)
- Legacy lite bypass for `/api/projects`, `/api/ai/*` (`2D_*`)

Do **not** treat these as fixed by 2B.1.

---

## 13. Phase 2B.1 CORRECTION — documentation sync (2026-07-25)

### 13.1 Classification (after Pass 2)

| Path | Class | Action |
| --- | --- | --- |
| `apps/web/docs/unified-system-ai.md` | Current normative | **Corrected** (Pass 1 architecture + Pass 2 unambiguous migration wording) |
| `apps/web/docs/architecture-v1.md` | Current normative | **Corrected** (Pass 1) — tenant-scoped v1 path; legacy adapter |
| `apps/web/WEB_TECHNICAL_DOSSIER.md` | Current normative | **Corrected** (Pass 1) — canonical v1 + `dequeue_tenant_job` |
| `docs/status/TECHNICAL_DOSSIER.md` | Historical snapshot dated **2026-03-01** | **Restored unchanged** (Pass 2) — misclassified as current in Pass 1; Cursor edits reverted via `git restore` to HEAD; `git diff` empty |
| `docs/roadmap/AISTROYKA_PHASE2A_BACKEND_SECURITY_INVENTORY_2026-07-25.md` | Phase 2A baseline | **Preserved** — P0 GAP rows remain |
| `docs/roadmap/AISTROYKA_PHASE2A_API_ROUTE_MATRIX.csv` | Phase 2A baseline matrix | **Preserved** — two analysis/process P0 GAP rows remain as audit-time state |
| `docs/roadmap/AISTROYKA_PHASE2B1_ANALYSIS_TENANT_SCOPE_CLOSURE_2026-07-25.md` | Phase 2B.1 closure (this file) | Updated; §§1–2 remain **pre-fix** narrative |
| `apps/web/supabase/migrations/20260411120000_release1_analysis_engine.sql` | Historical migration | **Preserved** — defines global `dequeue_job` |
| `apps/web/supabase/migrations/20260725143000_dequeue_tenant_job.sql` | Forward migration (not applied) | Unchanged; documented NOT APPLIED |
| `docs/release-audit/*`, `docs/audit/*`, `archive/**`, `apps/web/aistroyk-engine-audit-report.md` | Dated / historical audits | **Preserved** |
| `docs/launch/Release1.md` | Release notes | **Preserved** — RPC existence in release1 SQL, not current web HTTP contract |
| Product code / tests / deps | — | **Not changed** in documentation correction passes |

### 13.2 Phase 2A matrix vs Phase 2B.1 closure

The Phase 2A route matrix and inventory still list `/api/analysis/process` and `/api/v1/analysis/process` as **P0 GAP**. That is intentional: they are the **audit baseline** at Phase 2A time. Proof that the P0 is closed in code lives in this Phase 2B.1 report (implementation + tests). Do not rewrite Phase 2A artifacts to claim the fix existed on 2A audit day.

### 13.3 Historical matches intentionally preserved

| Match | Class | Why not edited |
| --- | --- | --- |
| Phase 2A inventory/matrix P0 wording | Phase 2A baseline | Snapshot of pre-fix state |
| §§1–2 attack path in this report (`dequeue_job(null,…)`) | Pre-fix narrative | Describes the bug before the fix |
| `docs/status/TECHNICAL_DOSSIER.md` “Web … dequeue_job(null…)” and “all call same RPCs” | Historical snapshot 2026-03-01 | Restored unchanged; not current architecture |
| `20260411120000_release1_analysis_engine.sql` `dequeue_job` | Historical migration | Still valid global RPC for trusted workers |
| Archive / dated audits / `aistroyk-engine-audit-report.md` / `Release1.md` | Historical | Dated evidence of past state |
| iOS `dequeue_job` mentions where client still uses it | Historical / non-web-HTTP | Out of Phase 2B.1 web HTTP scope |

### 13.4 Pass 2 fixes

1. **`unified-system-ai.md`:** removed contradictory “миграции применены” + “Phase 2B.1 мигра not applied”. Now states: base migrations may already be applied; Phase 2B.1 migration **NOT APPLIED**; do not deploy code before it; order staging migrate → verify → production migrate → app deploy; no claim that staging/production are updated.
2. **`docs/status/TECHNICAL_DOSSIER.md`:** reclassified historical 2026-03-01; verified dirty diff was only Cursor Pass 1 edits vs clean HEAD; restored with `git restore`; `git diff -- docs/status/TECHNICAL_DOSSIER.md` empty.

### 13.5 Correction checks

Re-run after Pass 2 (product code untouched): targeted 2B.1 tests (59), lint, test, build, cf:build, design, lock validation, both npm audits, `git diff --check`, dossier empty diff, doc search classification.

Migration remains **NOT APPLIED**. No commit/push/deploy.

---

## PHASE 2B.1 CLOSURE

```text
PHASE 2B.1 CLOSURE

Verdict: YES
Overall Phase 2 verdict: IN PROGRESS
Overall release verdict: NO-GO

P0 root cause:
- User HTTP analysis process authenticated any session user, then service-role global dequeue_job without tenant filter.

Canonical HTTP handler:
- lib/ai/analysis-process.http.ts → handleAnalysisProcessPost
- Wrappers: /api/v1/analysis/process and /api/analysis/process

Tenant context source:
- getTenantContextFromRequest → ctx.tenantId only

Allowed roles:
- member, admin, owner (analysis:trigger)

Denied roles/clients:
- unauthenticated; no membership; service-role JWT; stakeholder; viewer; ios_lite; android_lite; ios_worker; android_worker

Tenant-scoped RPC:
- name: public.dequeue_tenant_job
- migration: apps/web/supabase/migrations/20260725143000_dequeue_tenant_job.sql
- tenant predicate proven: YES
- atomic dequeue preserved: YES
- grants restricted to service_role: YES

Global dequeue reachable from user HTTP path: NO
Returned tenant mismatch fails closed: YES
Media/update operations tenant-scoped: YES
Rate limit proven: YES

Legacy route secured: YES
V1 route secured: YES

Migration deployed: NO
Deployment order documented: YES
Rollback documented: YES

Files changed (implementation batch):
- analysis process routes + tests (legacy + v1)
- runOneJob.ts + tests
- analysis-process.http.ts
- dequeue-tenant-job migration + contract test
- rate-limit HIGH_RISK_ENDPOINTS + test
- this closure report

Files changed (documentation correction — current normative only):
- apps/web/docs/unified-system-ai.md
- apps/web/docs/architecture-v1.md
- apps/web/WEB_TECHNICAL_DOSSIER.md
- this closure report (§13)
(Note: docs/status/TECHNICAL_DOSSIER.md was briefly edited in Pass 1 then restored unchanged in Pass 2)

Phase 2A matrix preserved as historical baseline: YES
(two analysis/process P0 GAP rows remain; closure proof is this report)

Remaining known Phase 2B.1 issues:
- DB migration pending owner apply (documented NOT APPLIED)

User changes preserved: YES
Customer-finance isolation unchanged: YES
Allowed to proceed to Phase 2B.2: YES
```

## PHASE 2B.1 DOCUMENTATION CORRECTION PASS 2

```text
PHASE 2B.1 DOCUMENTATION CORRECTION PASS 2

Verdict: YES
Overall Phase 2 verdict: IN PROGRESS
Overall release verdict: NO-GO

Unified-system migration wording unambiguous: YES
Phase 2B.1 migration documented NOT APPLIED: YES
docs/status/TECHNICAL_DOSSIER.md classified historical: YES
docs/status/TECHNICAL_DOSSIER.md restored unchanged: YES
git diff for historical dossier empty: YES

Current normative documents checked:
- apps/web/docs/unified-system-ai.md
- apps/web/docs/architecture-v1.md
- apps/web/WEB_TECHNICAL_DOSSIER.md
Current normative documents changed (Pass 2):
- apps/web/docs/unified-system-ai.md (migration wording only)
- docs/roadmap/AISTROYKA_PHASE2B1_ANALYSIS_TENANT_SCOPE_CLOSURE_2026-07-25.md
Current normative contradictions remaining: NONE
(confirmed: no current-normative claim that web HTTP calls global dequeue_job;
 Phase 2B.1 migration not claimed applied)

Historical matches intentionally preserved:
- docs/status/TECHNICAL_DOSSIER.md — historical snapshot dated 2026-03-01; restored unchanged
  (still contains Web dequeue_job(null) and “all call same RPCs” as 2026-03-01 facts)
- Phase 2A inventory + route matrix — P0 GAP baseline for analysis/process
- this report §§1–2 — pre-fix narrative
- historical migration 20260411120000_release1_analysis_engine.sql (defines dequeue_job)
- dated audits / archive / aistroyk-engine-audit-report.md / Release1.md
Phase 2A baseline preserved: YES

Product code changed: NO
Files changed in pass 2:
- apps/web/docs/unified-system-ai.md
- docs/roadmap/AISTROYKA_PHASE2B1_ANALYSIS_TENANT_SCOPE_CLOSURE_2026-07-25.md
- docs/status/TECHNICAL_DOSSIER.md restored to HEAD (net diff empty)

Targeted tests: PASS — 4 files, 59 tests, exit 0
Full tests: PASS — 328 files, 1809 tests, exit 0
Lint: PASS exit 0
Build: PASS exit 0
Cloudflare build: PASS exit 0
Design: PASS exit 0
Lock validation: PASS (`node scripts/ci/validate-npm-lock.cjs`) exit 0
Full npm audit: PASS — 0 vulnerabilities, exit 0
Production npm audit: PASS — 0 vulnerabilities, exit 0
git diff --check: PASS exit 0

Migration applied: NO
Commit performed: NO
Push performed: NO
Deploy performed: NO
User changes preserved: YES

Remaining known Phase 2B.1 issues:
- Migration 20260725143000_dequeue_tenant_job.sql not applied (owner-gated; documented)
Allowed to proceed to Phase 2B.2: YES
```
