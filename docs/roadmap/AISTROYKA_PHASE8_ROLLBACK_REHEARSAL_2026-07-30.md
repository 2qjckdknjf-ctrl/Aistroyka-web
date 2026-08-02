# Phase 8 — Rollback tabletop rehearsal (2026-07-30)

**Mode:** read-only evidence + documented production commands (`NOT EXECUTED`).
**Canonical runtime:** Cloudflare Workers + OpenNext.
**RTO/RPO:** not stated in authoritative docs → **owner-policy follow-up**.

## Read-only evidence collected

| Item | Result (sanitized) |
| --- | --- |
| Last successful staging deploy | GitHub Actions success; `headSha` prefix `a401693` (2026-07-18) |
| Last successful production deploy | GitHub Actions success; same `headSha` prefix `a401693` (2026-07-18) |
| Staging health stamp | `buildStamp.sha7=a401693`, `buildTime=2026-07-18 22:29` |
| Production health stamp | **absent** on apex and www |
| Prior known-good deploy | Previous production run `headSha` prefix `f088ed3` (2026-07-18 earlier) |
| Immutable source for last deploy | Present on remote GitHub as full SHA ending `…2ad8` (not equal to dirty local HEAD) |
| Local worktree | Dirty; not an immutable release identity |

## Checks actually performed (read-only)

1. `gh run list` for Deploy Cloudflare (Staging) and (Production) — last 3 runs each.
2. `GET` health on staging / apex / www — stamp presence recorded.
3. Security headers smoke against staging / www / apex — **FAIL** on HTML joined duplicates (`nosniff, nosniff`); API profile OK.
4. OpenAPI probe: `rate_limit_try_increment_multi` **MISSING**.
5. Local `wrangler deploy` / real rollback / workflow_dispatch — **NOT EXECUTED**.

## Local dry-run steps (allowed)

- Documented `wrangler deploy --dry-run` packaging after `cf:build` (artifact checksum recorded in closure).
- Contract tests for workflow provenance + buildStamp fail-closed.

## Production commands documented only (`NOT EXECUTED`)

```text
# 1) Freeze further deploys (cancel queued workflow_dispatch / pause merges) — NOT EXECUTED
# 2) Choose last-known-good immutable SHA (example from history: a401693… or prior f088ed3…) — NOT EXECUTED
# 3) GitHub Actions → Deploy Cloudflare (Production) → workflow_dispatch ref=<full-40-char-sha>
#    OR revert commit(s) on main and let staging→prod chain run — NOT EXECUTED
# 4) Verify:
#    curl -fsS https://aistroyka.ai/api/v1/health
#    curl -fsS https://www.aistroyka.ai/api/v1/health
#    bash scripts/smoke/security_headers.sh https://aistroyka.ai
# 5) Do NOT automatically reverse DB migrations — NOT EXECUTED
```

## Required approvals before any real rollback

| Approval | Role |
| --- | --- |
| Declare incident / freeze deploys | incident commander |
| Choose rollback vs fix-forward | incident commander + on-call engineer |
| Authorize production workflow_dispatch / revert merge | product owner |
| Schema compatibility confirmation (app vs current DB) | database operator |
| Customer/comms if user-visible | product owner |

## Runbook coverage map

| # | Topic | Covered |
| --- | ---: | --- |
| 1 | Incident detection | YES — health/stamp/headers/auth/5xx signals in FIRST_72H |
| 2 | Freeze further deploys | YES — documented; NOT EXECUTED |
| 3 | Rollback vs fix-forward | YES — decision matrix pointer Phase3 + this rehearsal |
| 4 | Last-known-good immutable version | YES — GH deploy history `a401693` / prior `f088ed3` |
| 5 | Cloudflare rollback/redeploy | YES — workflow_dispatch `ref` or revert+chain; NOT EXECUTED |
| 6 | Verify buildStamp after rollback | YES — required; currently prod missing stamp is a deploy-contract defect |
| 7 | Health/header/auth/API smoke | YES — commands listed |
| 8 | Env bindings/secrets preservation | YES — redeploy same Worker env; do not rewrite secrets casually |
| 9 | App vs current DB schema | YES — migrations never auto-rollback |
| 10 | No automatic DB migration reverse | YES — hard rule |
| 11 | Abort/stop conditions | YES — unknown cause + DB doubt → freeze, no migration reverse |
| 12 | Communication + post-incident evidence | YES — roles + evidence locations in FIRST_72H |

## Rehearsal result

**PASS (tabletop only).** Rollback target identity is knowable from GitHub Actions history. Production currently lacks `buildStamp`, so post-rollback verification must use the **new** stamp contract after the next authorized deploy of Phase 8 code. No production mutation performed.
