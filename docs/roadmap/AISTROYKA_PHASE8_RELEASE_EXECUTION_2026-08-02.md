# Phase 8 Release Execution — 2026-08-02

## 1. Authorization scope

| Variable | Value | Effect |
| --- | --- | --- |
| `PHASE8_COMMIT_PUSH_MIGRATION_STAGING_AUTHORIZATION` | **GRANTED** (2026-08-02) | Commit / push / migration / staging authorized |
| `PHASE8_PRODUCTION_DEPLOY_AUTHORIZATION` | **NOT_GRANTED** | Production deploy forbidden |
| `PHASE8_FAILED_SMOKE_ROLLBACK_AUTHORIZATION` | **NOT_GRANTED** | Rollback forbidden if smoke fails |

Prompt text alone is not authorization; the GRANTED value above is.

## 2. Commit manifests (prepared, not executed)

### Worktree snapshot (sanitized)

| Field | Value |
| --- | --- |
| Branch | `security/platform-admin-separation` |
| Upstream | `origin/security/platform-admin-separation` (0 ahead / 0 behind) |
| HEAD | `7855fb1641b7511b24f98d7ad652a0c674dae8f7` |
| Merge/rebase | none |
| Porcelain | ~713 |
| Tracked diff SHA256 | `be9adbfba1614c3283aa46c41ccb630dbade2426d10d00e1e6e5a048cf2e8a80` |
| Untracked manifest SHA256 | `66e693c4cbc628c57294ead978c9345b0315aa1c84fa1683902f4df6ff852f1f` |

### Classification

| Class | Count (porcelain) | Action |
| --- | --- | --- |
| EXPECTED_PRODUCT (Phases 2–8) | ~705–709 | Candidate for release commit when authorized |
| GENERATED (`ios/Shared/.build`) | present; **1395 historically tracked** paths | **EXCLUDE** from commit; `.gitignore` now covers `**/.build/`; when committing, run `git rm -r --cached ios/Shared/.build` (authorized commit step only) |
| REVIEW_CRED_SOURCE (`PilotE2ECredentials.swift`) | 2 | **EXCLUDE** pending owner confirm (env/file wiring only; no hardcoded email/password literals found) |
| SECRET_ENV / SECRET_CRED in porcelain | 0 | Ignored secretish files remain gitignored (not printed) |

### Manifest A — Phase 8 + audit (43 paths)

See generator output / `/tmp/p8-manifest-phase8.txt` (local). Includes workflows, buildStamp/health/headers, migration scripts, Phase 7/8 docs, lockfile/overrides, `.gitignore`.

### Manifest B — Full product RC (~709 paths)

All non-generated, non-credential-source dirty paths. Prefer this for a single immutable staging SHA that carries Phases 2–8 product work. Do **not** use `git add -A`.

### Explicit excludes

- `ios/Shared/.build/**` (generated)
- `ios/**/PilotE2ECredentials.swift` until owner confirms
- `.env*`, keystores, `.p8`, service-account JSON, `local-secrets/`, `.open-next/`, `.next/`

**Commit/push: NOT EXECUTED** (auth NOT_GRANTED).

## 3. Immutable SHA

**None created.** Dirty fingerprint is not an intended commit. After GRANTED commit, record full 40-char SHA here.

## 4. Audit advisories and resolution

### Before fix (`bun audit --omit=dev` exit 1)

23 vulnerabilities (1 critical, 9 high, 11 moderate, 2 low), including:

| Package | Path (from audit text) | Sev | Reachability | Fix applied |
| --- | --- | --- | --- | --- |
| vitest | apps/web + contracts + roma-kernel (dev) | critical | DEV | bump `^4.1.0` |
| vite | via vitest | high/mod | DEV | override `7.3.6` |
| fast-xml-parser | `@opennextjs/cloudflare` → aws → xml-builder | high/mod | BUILD | override `5.7.0` |
| flatted | eslint | high | DEV | override `3.4.2` |
| path-to-regexp | wrangler + opennext aws | high/mod | BUILD/DEPLOY TOOLING | override `8.4.2` |
| picomatch | vitest/next-intl/opennext dotenvx/… | high/mod | MIXED | override `4.0.4` |
| next-intl | apps/web dependency | moderate | PROD APP | bump `^4.9.2` |
| yaml | lint-staged / opennext / tailwind / vitest | moderate | MIXED | override `2.8.3` |
| qs | stripe / express body-parser | moderate | MIXED | override `6.15.3` |
| icu-minify | next-intl | low | PROD APP (via intl) | cleared via next-intl bump |

### After fix

```text
bun audit --omit=dev → exit 0 → "No vulnerabilities found"
```

**Audit verdict: PASS** (exit 0). Files touched: root `package.json` overrides, `apps/web/package.json`, `packages/*/package.json`, `bun.lock`, `package-lock.json`.

## 5–6. Migration target / result

| Item | Status |
| --- | --- |
| Local critical SQL | PRESENT `20260725190000_rate_limit_try_increment.sql` |
| Local SHA256 | `ed743931c788ff5815ece9ff3715515e4b40d1a413119306f570015cf46ef908` |
| Local ledger sanity | PASS (153) |
| Remote OpenAPI RPC `rate_limit_try_increment_multi` | **MISSING** (prior evidence; not re-mutated) |
| Remote ledger CLI | SKIPPED (no `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` in parity script env) |
| **Apply** | **NOT EXECUTED** |

Target when authorized: live AISTROYKA project only (`docs/audit/LIVE_SUPABASE_SCHEMA_REPORT.md` / AGENTS.md). Stop if pending set ≠ expected single critical (plus any already-reviewed ordered predecessors).

## 7. Concurrency proof

**NOT EXECUTED** (requires migration apply auth). Planned keys: `PHASE8_VERIFY:<runId>` only; delete to residue 0.

## 8–9. Staging workflow / stamp

| Item | Status |
| --- | --- |
| Current staging stamp | `sha7=a401693`, `buildTime=2026-07-18 22:29` |
| Last staging GH deploy | success, `a401693ec691…`, 2026-07-18 |
| Known-good rollback candidate | same `a401693…` (prior `f088ed3…`) |
| Staging deploy | **NOT EXECUTED** |

## 10–12. Production

| Item | Status |
| --- | --- |
| Production approval | NOT_GRANTED |
| apex/www buildStamp | **ABSENT** |
| Production deploy | **NOT EXECUTED** |

## 13. Header matrix (live, pre-deploy)

| Target | Pages | API | Joined duplicates |
| --- | --- | --- | --- |
| staging | FAIL historically (`nosniff, nosniff`) | PASS | Present on HTML until Phase 8 Worker ships |
| www / apex | FAIL historically | PASS | Same |

Local collapse in `worker-bootstrap.js` present in dry-run bundle (`COLLAPSE=YES`).

## 14. Smoke results (local preflight)

| Gate | Result |
| --- | --- |
| `apps/web check:design` | PASS |
| `i18n:check` | PASS |
| `apps/web lint` | PASS |
| Focused Phase 8 tests | PASS (32) |
| contracts tests | PASS (10) |
| `apps/web test` | **424 files / 2735 tests PASS** |
| `apps/web build` | PASS |
| `apps/web cf:build` | PASS |
| wrangler `--dry-run` + patch | PASS |
| `validate-npm-lock` (`node scripts/ci/validate-npm-lock.cjs`) | PASS |
| `bun audit --omit=dev` | **PASS (0 vulns)** |
| `git diff --check` (Phase 8 / package scope) | PASS |
| migration sanity | PASS |
| Live staging/prod smoke deploy | NOT EXECUTED |

### Dry-run artifact

| Artifact | SHA256 |
| --- | --- |
| `.open-next/deploy/worker-bootstrap.js` | `4005ac6cfacae2bab7511a6b082db2e7e173a78bc90259c73c501d19e5b495f0` |
| Deploy dir manifest | `f322a0b46295950a5c25e94674ef43f997756848227b7261e6236cc6851cad52` |

## 15. Rollback target / applied?

- Target evidence: GH production/staging success on `a401693ec6915d9014dc45503a2b1a6ae4412ad8`.
- Rollback **NOT EXECUTED** (and not authorized).

## 16–17. T+0 / T+15m / 72h

Not started (no production deploy). Checklist remains `docs/release-hardening/FIRST_72H_OPERATIONS_CHECKLIST.md`.

## 18. Cleanup / residue

- No PHASE8_VERIFY DB keys created.
- No fixtures created.
- Local temp scripts under `scripts/ops/phase8_*.py` are source helpers (include in Manifest A).
- Generated `.open-next/` remains untracked/local only.

## 19. Gates / counts (summary)

- Web tests: 2735 PASS
- Audit: 0 vulnerabilities
- Migrations local: 153 OK
- Phase 8 scoped files ready: 43
- Full RC candidate files: ~709 (excludes generated/cred sources)

## 20. Exact remaining blockers

1. **Authorization NOT_GRANTED** for commit/push/migration/staging.
2. No immutable release SHA yet (dirty tree).
3. Remote migration RPC still missing until authorized apply.
4. Live staging/production still on `a401693` / prod missing stamp / HTML header joins until deploy.
5. Canonical staging deploy is via `main` workflow chain — pushing only to `security/platform-admin-separation` does not deploy; needs owner-approved PR→`main` (or separately authorized path).
6. Historically tracked `ios/Shared/.build` must be un-cached on commit (`git rm -r --cached`), not force-added.

## 21–22. Verdicts

| Verdict | Value |
| --- | --- |
| Local Phase 8 contract | **YES** (strengthened: audit PASS) |
| Runtime parity | **NO** |
| Migration parity | **NO** |
| Audit gate | **PASS** (exit 0) |
| Overall Phase 8 | **BLOCKED_EXTERNAL** |
| Safe to proceed to Phase 9 | **NO** |
| Ready for | **COMMIT_PUSH_MIGRATION_STAGING_APPROVAL** (preflight green) |

## 23. Prohibited / not-executed confirmation

Not performed: commit, push, force push, merge/PR, tag/release, workflow_dispatch, wrangler deploy (non-dry-run), Supabase migration apply/push/repair, SQL writes, production deploy, rollback, paid AI probes, secret disclosure, Phase 9.

---

## Exact operator sequence when auth becomes GRANTED (do not run now)

1. Owner sets `PHASE8_COMMIT_PUSH_MIGRATION_STAGING_AUTHORIZATION=GRANTED`.
2. Re-run classification + secret scan.
3. `git rm -r --cached ios/Shared/.build` (stop tracking generated tree).
4. Stage Manifest B (or A if intentionally Phase-8-only) via explicit path list — never `git add -A`.
5. Commit with hooks; record full SHA; re-run release-critical tests.
6. Push **without force** to a release branch (not protected `main` unless separately authorized).
7. Open/merge PR per protected-main policy → staging workflow on `main`.
8. Read-only confirm Supabase target + pending set; apply **only** `20260725190000_rate_limit_try_increment.sql` via canonical path; concurrency proof + residue 0.
9. Staging smoke: stamp==SHA, headers PASS, RPC present, health OK.
10. Stop for `PHASE8_PRODUCTION_DEPLOY_AUTHORIZATION=GRANTED`.
11. Production same SHA; apex+www stamp; headers; T+0/T+15m; start 72h log.
12. Rollback only if smoke fails **and** rollback auth GRANTED to pre-recorded `a401693…` (or newer known-good).


## Live operator update (2026-08-02 GRANTED batch)

- Authorization for commit/push/migration/staging: **GRANTED**.
- Remote ledger last applied (MCP read-only): `20260718091239_task_messages_rls_manager_roles`.
- Local pending after remote last (ordered):
  1. `20260725143000_dequeue_tenant_job.sql`
  2. `20260725190000_rate_limit_try_increment.sql`
- Migration apply **STOPPED**: pending set is two migrations, not a single expected file; cannot apply rate-limit out of order; no migration repair.
- Owner follow-up required to authorize applying **both** pending migrations in order (or explicitly accept a different sequence).
- Branch: `release/phase8-ops-2026-08-02`.
