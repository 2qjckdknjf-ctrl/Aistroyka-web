# AISTROYKA Phase 2C — Lite Idempotency & Rate Limits Closure

Date: 2026-07-25  
Batch: `2C_lite_idempotency_rate_limits` (second independent corrective pass)  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch: `security/platform-admin-separation`  

Migrations **NOT APPLIED** (by design this pass):

- `20260725143000_dequeue_tenant_job.sql` (Phase 2B.1)
- `20260725190000_rate_limit_try_increment.sql` (multi-bucket RPC + `claim_token` column)

Phase 2A / 2B historical artifacts — **not edited**.  
Do **not** start `2C_lite_read_scope`, `2C_lite_prefix_boundary`, or Phase 2D.  
Do **not** commit/push/deploy.

---

## Verdict

**YES** (local code/contract complete)

`Safe to proceed to next Phase 2C lite batch: YES` (only when owner requests)

**Production enablement: BLOCKED** until migration is applied via normal ops.

**Live Postgres transaction concurrency proof: BLOCKED** in this environment (no `apps/web/supabase/config.toml`, Docker unavailable). Algorithm-twin + SQL contract tests are **not** claimed as live DB concurrency proof.

Overall Phase 2: **IN PROGRESS**  
Overall release: **NO-GO**

Locally controllable tails from the second audit: **none remaining**.

---

## Second-pass tails closed

| # | Finding | Fix |
| --- | --- | --- |
| 1 | Help path fail-open to HELP caps (120/60) on subscription lookup failure | Lookup throw/invalid → `rate_limit_unavailable` 503. Effective limits always `min(help_cap, plan)`. FREE plan (10/5) covered by tests. |
| 2 | Three independent RPCs partially charged on later error/limit | Single `rate_limit_try_increment_multi`: sorted key lock order, FOR UPDATE, check-all then increment-all (or charge none). Legacy single-key path unchanged. |
| 3 | Weak IP token check; spoofable on non-Worker paths | `parseAndNormalizeIp` (IPv4/IPv6). Trust `cf-connecting-ip` only when `AISTROYKA_TRUST_CF_CONNECTING_IP=1` (wrangler Worker vars). Vercel/local/direct → no IP bucket. |
| 4 | Expired reclaim without ownership | `claim_token` column + required on finalize/release. Late A after B reclaim → affected 0. |
| 5 | Regex-only migration contract | Expanded SQL contract + algorithm-twin concurrency tests + honest live-DB blocker. |
| 6 | Gates + honest closure | Full lint/test/build/cf:build/design/lock/audit/diff-check PASS. |

---

## Key files

- `apps/web/supabase/migrations/20260725190000_rate_limit_try_increment.sql`
- `apps/web/lib/platform/rate-limit/rate-limit.store.ts` (`checkAndIncrementMultiStrict`)
- `apps/web/lib/platform/rate-limit/rate-limit-multi.algorithm.ts` (algorithm twin; not DB proof)
- `apps/web/lib/platform/rate-limit/ip-address.ts`
- `apps/web/lib/platform/rate-limit/rate-limit.service.ts`
- `apps/web/lib/platform/idempotency/idempotency.repository.ts` (ownership token)
- `apps/web/lib/api/lite-idempotency.ts`
- `apps/web/wrangler.toml` (`AISTROYKA_TRUST_CF_CONNECTING_IP` on Worker envs)
- `docs/architecture/HELP_API_AUTH_ABUSE.md`

---

## Validation

| Gate | Result |
| --- | --- |
| Focused store/service/repo/lite/help | PASS — 7 files / 80 tests |
| `bun run lint` | PASS |
| `bun run test` | PASS — 392 files / 2541 tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| `bun run --cwd apps/web check:design` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS |

---

## Constraints

| Constraint | Status |
| --- | --- |
| Active-tenant / unrelated mobile/design/legacy preserved | YES |
| Phase 2A / 2B docs unchanged | YES |
| Migrations applied | NO |
| Commit/push/deploy | NO |
| Next lite batch started | NO |
| Legacy rate-limit / lite fail-open not hardened | YES |

---

## Remaining out-of-batch

- `2C_lite_read_scope`
- `2C_lite_prefix_boundary`
- Operator: apply `20260725190000_rate_limit_try_increment.sql`
- Optional follow-up: live Postgres multi-bucket concurrency integration test when local Supabase/Docker is available
