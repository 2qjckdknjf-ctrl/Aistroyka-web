# Phase 8 Closure — Ops / Deploy / Observability / Rollback (2026-07-30)

## 1. Phase 8 verdict

| Gate | Verdict |
| --- | --- |
| **Local Phase 8 contract** | **YES** |
| **Runtime parity** | **NO** |
| **Migration parity** | **NO** (remote RPC missing; ledger remote list SKIPPED without Management API token in this session — OpenAPI proves critical RPC absent) |
| **Overall Phase 8** | **BLOCKED_EXTERNAL** |
| **Safe to proceed to Phase 9** | **NO** |

**Operator batch 2026-08-02:** see `docs/roadmap/AISTROYKA_PHASE8_RELEASE_EXECUTION_2026-08-02.md`. Staging deployed immutable `8408ca26…` (headers PASS, stamp match). Migration apply stopped (two pending). Production **not** deployed (`PRODUCTION` auth NOT_GRANTED). Overall still **BLOCKED_EXTERNAL**.

Dirty local source is a **local fingerprint**, not an immutable deployable release. Staging/production are on older runtime (`a401693`, 2026-07-18) and cannot be proven equal to this worktree.

---

## 2–4. Contract / runtime / migration (detail)

### Local Phase 8 contract: YES

Closed locally:

- Immutable release identity helpers (`build-stamp.ts`) — ignore Vercel SHA; require stamp for staging/production.
- Health fail-closed on missing/invalid staging/production stamp (`missing_build_stamp` → 503).
- Deploy workflows stamp from `git rev-parse HEAD`, pass Wrangler `--var`, post-deploy stamp verify, migration filename check, security header smoke.
- CI Check runs `check-migrations.sh`.
- Security headers smoke detects duplicates/joined values; worker-bootstrap collapses identical OpenNext joins (pending deploy).
- Migration local ledger sanity + parity script; critical migration present locally.
- Observability fields on health: `rateLimitRpcStatus`, `aiOperationalStatus`, `releaseStampRequired/Present`.
- Rollback tabletop + FIRST_72H checklist rewritten without placeholders.
- Focused + full unit tests green; lint/build/cf:build green.

### Runtime parity: NO

| Target | buildStamp | Match intended immutable SHA |
| --- | --- | --- |
| staging | `sha7=a401693` | No intended immutable SHA for dirty tree; remote ≠ local fingerprint |
| production apex/www | **ABSENT** | External blocker |

### Migration parity: NO

| Check | Result |
| --- | --- |
| Local migration contract | **YES** (153 files; `20260725190000_rate_limit_try_increment.sql` PRESENT; sha256 prefix `ed743931c788ff58`) |
| Remote OpenAPI `rate_limit_try_increment_multi` | **MISSING** |
| Remote ledger via Supabase CLI | SKIPPED (`SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` not set for parity script) |
| Phase 7 paid AI consequence | Remains fail-closed / degraded until owner-authorized apply |

---

## 5. Canonical deploy path

**Cloudflare Workers + OpenNext** only:

1. PR → **CI Check** (`cf:build`, tests, migration filename sanity).
2. Merge to `main` → **Deploy Cloudflare (Staging)** (`cf:build` → wrangler dry-run + patch → deploy patched bundle → verify `buildStamp` → security headers → pilot smoke).
3. Staging success → **Deploy Cloudflare (Production)** (`workflow_run`) → same provenance → verify apex+www `buildStamp` → security headers → pilot smoke.

**Vercel is not production proof.** Historical Vercel / `develop`-staging notes marked stale where they mislead operators.

---

## 6. Local HEAD and sanitized dirty fingerprint

| Field | Value |
| --- | --- |
| HEAD (full) | `7855fb1641b7511b24f98d7ad652a0c674dae8f7` |
| Branch | `security/platform-admin-separation` |
| Dirty | YES (~710 porcelain entries; includes pre-Phase-8 work) |
| Tracked diff SHA256 | `807804295bd575274bc36ab985b580153018ecb5615ee9ead1a996649fe44661` |
| Untracked manifest SHA256 | `15fe128540438415c08f55e1e09cff771773804c864ef960d4d0fa5e0ba498ac` |
| Build timestamp (local gates) | `2026-07-30T05:59:24Z` |
| Toolchain | Bun `1.2.15`, Node `v22.23.0`, `@opennextjs/cloudflare@1.20.2`, Wrangler `4.114.0` |

**This is not an “intended commit.”** Commit/review required before any deploy claim.

---

## 7. Artifact checksum (dry-run only)

| Artifact | SHA256 |
| --- | --- |
| `.open-next/deploy/worker-bootstrap.js` (after patch) | `ee236df92da811f2d1fd2b288d7f86a13a8ad86b9883a974fecc3adfcda587b2` |
| Deploy dir file manifest | `442dc48e8450bc460b67253c6ad8c6091fcf0e04f441e497f118d3118cd2fb70` |
| Collapse helper in bundle | YES (`collapseDuplicatedSecurityHeaders`) |

Command used (no live deploy):

```bash
bun run --cwd apps/web cf:build
npx wrangler deploy --env staging --dry-run --outdir .open-next/deploy
node scripts/patch-bundle-require.cjs
```

---

## 8–10. Staging / production buildStamp and source match

| Env | buildStamp | Source/deployment match to local dirty fingerprint |
| --- | --- | --- |
| staging | `a401693` / `2026-07-18 22:29` | **NO** |
| production | **missing** | **NO** |

Last GH deploys (read-only): staging+prod success on `a401693…` (2026-07-18). Prior prod: `f088ed3…`.

---

## 11–12. Security-header matrix / duplicates

| Surface | Pages HTML | API health | Duplicate/joined |
| --- | --- | --- | --- |
| staging | FAIL (`nosniff, nosniff` etc.) | PASS | Joined identical duplicates on pages |
| www | FAIL | PASS | Same |
| apex | FAIL | PASS | Same |

**Local fix:** `worker-bootstrap.js` + `collapseDuplicateSecurityHeaderValue` (identical repeats only; conflicting joins left intact). **Live remains FAIL until authorized deploy** → runtime/header external blocker.

Smoke commands supported:

```bash
bash scripts/smoke/security_headers.sh
bash scripts/smoke/security_headers.sh https://staging.aistroyka.ai
bash scripts/smoke/security_headers.sh https://www.aistroyka.ai
```

---

## 13. Health / observability

| Signal | Source | Threshold | Severity | Owner role | Immediate action | Escalation |
| --- | --- | --- | --- | --- | --- | --- |
| buildStamp present (stg/prod) | `/api/v1/health` | required; sha7 match deploy | P0 | on-call engineer | Freeze / rollback | incident commander |
| Health `ok` / `db` | health | `ok` + `db=ok` | P0 | on-call engineer | Investigate | incident commander |
| `rateLimitRpcStatus` | health OpenAPI probe | not silently green when missing | P1 | on-call engineer | Keep AI degraded label | database operator |
| AI configured vs verified | health + live smoke | configured ≠ LIVE | P1 | on-call engineer | Honest claims only | product owner |
| Security headers | `security_headers.sh` | exit 0 | P1 | on-call engineer | Patch-forward or rollback | incident commander |
| 5xx / latency | Cloudflare analytics | owner policy required | P1 | on-call engineer | Triage | incident commander |
| Auth failure storm | login + API 401/5xx | owner policy required | P0 | on-call engineer | Incident | product owner |
| Queue/outbox | admin jobs (auth) | owner policy required | P1 | on-call engineer | Pause drains if cascading | incident commander |

Governance follow-up: named on-call human assignment not present in repo.

Health does **not** treat `aiConfigured`/`openaiConfigured` as live success; `aiOperationalStatus=degraded` when RPC missing; secrets not returned in body (unit-tested).

---

## 14–16. Migrations / RPC / AI consequence

- Pending critical: `20260725190000_rate_limit_try_increment.sql` (RPC `rate_limit_try_increment_multi`).
- No local downgrade/fallback added to hide missing RPC.
- Paid AI paths remain fail-closed / degraded until owner-authorized apply (Phase 7 carryover).

---

## 17–18. Rollback target + rehearsal

- Last-known-good deploy identity from GH: `a401693…` (also prior `f088ed3…`).
- Tabletop: **PASS** — see `AISTROYKA_PHASE8_ROLLBACK_REHEARSAL_2026-07-30.md`.
- No real rollback executed. RTO/RPO = owner-policy follow-up.

---

## 19. First 72h readiness

`docs/release-hardening/FIRST_72H_OPERATIONS_CHECKLIST.md` rewritten with concrete hosts, roles, stages T+0…T+72h. **Observation window not executed** — readiness/docs/rehearsal only.

---

## 20–21. Tests and repository gates

| Check | Result |
| --- | --- |
| Focused Phase 8 tests | PASS (build-stamp, health.stamp, deploy-workflow, security-headers + contracts) |
| `bun run --cwd apps/web test` | **424 files / 2735 tests PASS** |
| `packages/contracts` test | **7 PASS** |
| `bun run --cwd apps/web lint` | PASS |
| `bun run --cwd apps/web build` | PASS |
| `bun run --cwd apps/web cf:build` | PASS |
| wrangler `--dry-run` + patch | PASS |
| `bun run --cwd apps/web check:design` | PASS (canonical; root `check:design` script absent) |
| `bun run i18n:check` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS (root script name `validate-npm-lock` absent) |
| `bun audit --omit=dev` | **FAIL** — pre-existing transitive advisories (fast-xml-parser, path-to-regexp, picomatch, flatted, yaml, …); **not** resolved with `audit fix --force` |
| `git diff --check` | Phase 8 docs cleaned; broader dirty tree may still have pre-existing whitespace elsewhere |
| Live `security_headers.sh` | **FAIL** on remote pages (pending deploy of collapse fix) |

Skipped/live-unexecuted are **not** counted as proof.

---

## 22. Defects found and fixed (Phase 8)

1. Production/staging stamp contract weak (Vercel SHA fallback possible; missing stamp not fail-closed) → fixed in `build-stamp` + health.
2. Deploy workflows used `github.sha` without post-deploy stamp verify → stamp from checked-out HEAD + verify + Wrangler vars.
3. Security headers smoke lacked base URL arg / duplicate detection → rewritten.
4. OpenNext page header identical joins (`nosniff, nosniff`) → collapse in `worker-bootstrap` (live pending deploy).
5. FIRST_72H placeholders (`your-app.com`, `>X%`) → replaced.
6. Stale rollback/deploy docs could mislead (`develop`/Vercel) → stale banners + DEPLOYMENT_SOURCE_OF_TRUTH update.
7. Migration parity tooling for critical RPC → `check-migration-parity.sh` + CI/local sanity.

---

## 23. Files changed in Phase 8 (primary)

- `apps/web/lib/config/build-stamp.ts` (+ test)
- `apps/web/lib/config/public.ts`, `config.test.ts`
- `apps/web/lib/controllers/health.ts`, `health.stamp.test.ts`
- `apps/web/lib/security-headers.ts`, `.js`, `.test.ts`
- `apps/web/worker-bootstrap.js`
- `apps/web/lib/ops/deploy-workflow.contract.test.ts`
- `packages/contracts` health schema (+ tests)
- `.github/workflows/deploy-cloudflare-staging.yml`, `deploy-cloudflare-prod.yml`, `ci-check.yml`
- `scripts/smoke/security_headers.sh`
- `scripts/release/check-migration-parity.sh` (+ `check-migrations.sh` wired)
- `docs/release-hardening/FIRST_72H_OPERATIONS_CHECKLIST.md`
- `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`
- `docs/security/SECURITY_HEADERS_POLICY.md`
- `docs/release/PHASE3_ROLLBACK_*.md` (stale banners)
- `docs/roadmap/AISTROYKA_PHASE8_*` (this closure, runtime matrix, rollback rehearsal)

Pre-existing dirty tree from earlier phases preserved.

---

## 24. Remaining local defects

- None known that block **Local Phase 8 contract** after gates above.
- `bun audit` transitive advisories remain (pre-existing; owner dependency-upgrade track).
- Live header collapse and production stamp require **deploy** (external).

---

## 25. Exact external blockers

1. No immutable intended commit (dirty worktree; commit forbidden in this phase).
2. Production `buildStamp` absent on live apex/www.
3. Staging/production not equal to local fingerprint; last deploy `a401693` (2026-07-18).
4. `rate_limit_try_increment_multi` missing on live DB (migration unapplied; apply forbidden).
5. Live HTML security headers still show joined duplicates until Phase 8 Worker deploy.
6. Owner approvals for commit / migration / staging / production not granted.

---

## 26. Exact authorized operator sequence (NOT EXECUTED)

1. Review and commit current source into an immutable SHA (owner-authorized PR path).
2. Owner approval for migration apply.
3. Apply `20260725190000_rate_limit_try_increment.sql` via canonical operator path (not this agent).
4. Staging deploy of that immutable SHA.
5. Staging smoke: buildStamp + health + security_headers + migration/RPC presence.
6. Explicit production approval.
7. Production deploy of the **same** proven release.
8. Production smoke: apex+www buildStamp + health + security_headers.
9. Start first-72h monitoring per checklist.

---

## 27. Safe to proceed to Phase 9

**NO**

---

## 28. Prohibited actions confirmation

Not performed: commit, push, merge/PR, deploy/promote/rollback, workflow_dispatch/re-run/cancel, `wrangler deploy` without `--dry-run`, Supabase migration apply/push/repair, SQL writes, Cloudflare/Supabase/GitHub/DNS/env mutations, fixture/user creation, notifications, paid AI/provider probes, secret disclosure. Phase 9 not started.
