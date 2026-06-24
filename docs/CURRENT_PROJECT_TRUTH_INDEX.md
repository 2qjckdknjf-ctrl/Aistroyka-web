# AISTROYKA Current Project Truth Index

**Last updated:** 2026-06-23  
**Canonical main SHA:** `d4681983d1809c25ff2dc087c3a0995f01642091`

## 1. Purpose

This document is the **current project truth index** for AISTROYKA.

Historical docs under `docs/` may contain older readiness, certification, GO/NO-GO, or “production ready” claims. Those documents are **evidence snapshots** unless explicitly revalidated here.

**If a historical doc conflicts with this index, this index wins** unless newer dated evidence (SHA, PR, CI, deployment, smoke, governance) supersedes it.

## 2. Current main

| Field | Value |
|-------|-------|
| **main commit** | `d4681983d1809c25ff2dc087c3a0995f01642091` |
| **date** | 2026-06-23 |
| **repo** | `2qjckdknjf-ctrl/Aistroyka-web` |

### Latest merged post-baseline slices (on main)

| PR | Topic |
|----|-------|
| #120 | API security headers |
| #122 | Live/staging smoke runbook (`docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md`) |
| #124 | Architecture lockdown forensic audit (docs-only intake) |
| #125 | GitHub governance forensic audit + remediation evidence |
| #126 | Diagnostics route test stabilization (test-only) |
| #127 | Reports export UI polish (UI/i18n/tests only) |

## 3. What is verified

- **CI/build/test on main after PR #127:** green in operator validation (install, lint, contracts, i18n:check, tests, build, cf:build).
- **Test count (post PR #127):** 1543/1543 passing in full suite run.
- **Security headers slice (PR #120 scope):** verified with staging/production smoke at time of that slice (see PR #120 evidence; not re-run by this index).
- **Governance (issue #110):** P0 remediation applied (`enforce_admins: true`); issue closed after non-author APPROVED protected merge of forensic audit PR #125.
- **Reports export UI (issue #118):** acceptance criteria met via PR #127; protected merge with non-author approval; backend CSV schema, role gates, and `/api/v1/reports/export` authorization unchanged.
- **Architecture lockdown forensic intake (PR #124):** external “9.5/10 CERTIFIED” claim **rejected** — documented in `docs/reconciliation/architecture-lockdown-forensic-intake-2026-06-22/`.

## 4. What is NOT verified

- **Latest main deployment after PR #127** is **not** automatically confirmed unless a deployment run and/or `GET /api/v1/health` `buildStamp.sha7` on production/staging proves the merged SHA.
- **Architecture lockdown 9.5/10** is **not** accepted as current truth.
- **Broad merge** of `cursor/aistroyka-system-maturity-7957` is **not safe** (584 commits behind main; high-risk surface; see PR #124 audit).
- **Public GA** is **not** declared by this index or by docs-only updates.
- **AI / mobile / design** broad branches are **not** automatically accepted without fresh rebase, small-slice audit, and protected merge.
- **Historical GO/NO-GO, pilot-ready, or production-ready docs** are **not** current truth without revalidation against this SHA and runtime evidence.

## 5. Status by area

| Area | Current status | Evidence | Next safe step |
|------|----------------|----------|----------------|
| **Web main** | Post-baseline reconciliation + polish slices merged | main `d4681983`; PRs #120–#127 | Continue small scoped slices; full validation per PR |
| **Production runtime** | Deployed SHA **not assumed** equal to latest main | Confirm via Cloudflare/Vercel + `/api/v1/health` buildStamp | Run deploy/smoke only per `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md` when operator-approved |
| **Security headers** | Slice merged (#120); smoke PASS at slice time | PR #120; `apps/web/lib/security-headers.ts` | Small follow-up slices only if evidence-backed |
| **Governance** | Remediated; protected merge process verified | PR #125; issue #110 closed; `enforce_admins: true` | Non-author APPROVED + CI before every main merge |
| **Reports export UI** | Polish merged (#127) | PR #127; issue #118 | No backend/CSV/role changes without explicit audit |
| **Architecture lockdown** | **NOT verified** (9.5/10 rejected) | `docs/reconciliation/architecture-lockdown-forensic-intake-2026-06-22/` | Do not broad-merge maturity branch; obtain primary source if claim persists |
| **AI / Flywheel** | Deferred; not production-certified | Issue #111 stacked audit | Fresh rebase + small-slice audit before implementation |
| **Mobile pilot** | Deferred; iOS-primary contour | Issue #112 stacked audit | UITest/smoke per `ios/README.md`; no speculative Android expansion |
| **Design / Public** | Deferred | Issue #113 stacked audit | Small public/design slice only if narrowly scoped |
| **Docs truth** | In progress (this index) | Issue #116; PR for this file | Merge docs-only truth index; avoid mass doc rewrites |
| **Stale branches** | Archival plan drafted (issue #117); **no deletion performed** | `docs/reconciliation/issue-117-stale-branch-archival-plan-2026-06-23/` | Owner-approved separate task for any delete; no broad merges |

## 6. Historical docs policy

- Readiness, certification, GO/NO-GO, pilot-ready, and “final verdict” documents are **historical evidence**.
- They are **not** automatically current truth for today’s `main`.
- Any **CERTIFIED**, **PRODUCTION READY**, **GA**, **LOCKED DOWN**, or numeric score claim (e.g. 9.5/10) requires **current** main SHA, PR, CI, deployment/smoke, and governance evidence if used as a **runtime** or **release** claim.
- Forensic/reconciliation audits under `docs/reconciliation/` describe **point-in-time** findings; check their dated baseline SHA.

### Key evidence-only docs (non-exhaustive)

- `docs/publication-readiness/FINAL_GO_NO_GO_AUDIT.md`
- `docs/release/FINAL_GO_NO_GO_VERDICT.md`
- `docs/reconciliation/architecture-lockdown-forensic-intake-2026-06-22/`
- `docs/reconciliation/issue-110-github-governance-forensic-2026-06-23/`
- `docs/reconciliation/issue-116-docs-truth-stacked-audit/`

## 7. Forbidden assumptions

- Do **not** claim production readiness from docs alone.
- Do **not** broad-merge stale architecture/AI/mobile/design branches.
- Do **not** use owner/admin bypass for protected merges (`enforce_admins` must stay enabled).
- Do **not** apply live Supabase migrations without explicit operator gate.
- Do **not** deploy or claim live smoke PASS without following `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md` and confirming buildStamp.
- Do **not** accept external architecture lockdown certification without in-repo reproducible rubric + SHA + CI proof on `main`.

## 8. Current safe backlog (prioritized)

1. **#116 docs truth** — merge this current truth index (docs-only).
2. **#117 stale branch archival** — plan only; no deletion first.
3. **#113 design/public** — small slice only if narrowly scoped.
4. **#114 middleware/security** — remaining security slices only if small and evidence-backed.
5. **#111 / #112 AI/mobile** — only after fresh rebase and small-slice audit.

---

*For deployment topology and canonical paths, see `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`. For live/staging smoke policy, see `docs/ops/LIVE_STAGING_SMOKE_RUNBOOK.md`.*
